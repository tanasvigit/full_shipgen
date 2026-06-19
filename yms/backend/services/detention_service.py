import uuid
from datetime import date, datetime, timezone
from typing import Any

from fastapi import HTTPException

from db import get_pool
from enums import DETENTION_STATUSES, DETENTION_STATUS_TRANSITIONS
from services.yms_service import _to_dict, create_yard_event


DETENTION_CONFIG = {
    "free_hours": 2.0,
    "standard_rate": 1000,
    "hazmat_rate": 1500,
    "outside_surcharge_pct": 15,
    "contract_multiplier": 1.0,
    "company_multiplier": 0.85,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return _now().date()


def _coerce_datetime(value: Any) -> datetime | None:
    """asyncpg returns datetime objects; yard_events may use ISO strings."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time(), tzinfo=timezone.utc)
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _minutes_between(start_at: Any, end_at: Any = None) -> int:
    start = _coerce_datetime(start_at)
    if start is None:
        return 0
    end = _coerce_datetime(end_at) if end_at is not None else _now()
    mins = int((end - start).total_seconds() / 60)
    return max(0, mins)


def normalize_detention_row(row: dict[str, Any]) -> dict[str, Any]:
    """Prepare DB/derived row for DetentionOut serialization."""
    data = {k: v for k, v in row.items() if k not in ("gate_in_time", "end_time", "events")}
    if data.get("free_hours") is not None:
        data["free_hours"] = float(data["free_hours"])
    if data.get("actual_hours") is not None:
        data["actual_hours"] = float(data["actual_hours"])
    billing = data.get("billing_date")
    if isinstance(billing, datetime):
        data["billing_date"] = billing.date()
    return data


def _normalize_category(ownership_type: str | None) -> str:
    t = (ownership_type or "").lower()
    if t == "company":
        return "Company"
    if t == "contract":
        return "Contract"
    return "Outside"


def _is_hazmat(appointment: dict | None) -> bool:
    blob = f"{appointment.get('shipment_reference', '') if appointment else ''} {appointment.get('remarks', '') if appointment else ''}".lower()
    return any(k in blob for k in ("hazmat", "hazard", "chem", "class 3"))


def _resolve_rate(vehicle: dict, appointment: dict | None) -> int:
    base = DETENTION_CONFIG["hazmat_rate"] if _is_hazmat(appointment) else DETENTION_CONFIG["standard_rate"]
    ownership = (vehicle.get("ownership_type") or "").lower()
    if ownership == "outside":
        return int(base * (1 + DETENTION_CONFIG["outside_surcharge_pct"] / 100))
    if ownership == "company":
        return int(base * DETENTION_CONFIG["company_multiplier"])
    return base


def _resolve_wait_window(queue: dict | None, vehicle: dict, events: list[dict]) -> tuple[str | None, str | None]:
    vehicle_id = vehicle["id"]
    veh_events = [e for e in events if e.get("vehicle_id") == vehicle_id]
    veh_events.sort(key=lambda e: e.get("event_time") or "")

    start_iso = queue.get("checkin_time") if queue else None
    if not start_iso:
        for e in veh_events:
            if e.get("event_type") in {"VEHICLE_CHECKED_IN", "QUEUE_ENTRY_CREATED"}:
                start_iso = e.get("event_time")
                break

    end_iso = None
    for e in reversed(veh_events):
        if e.get("event_type") in {"LOADING_COMPLETED", "VEHICLE_STATUS_CHANGED"} and "EXIT" in (e.get("event_note") or "").upper():
            end_iso = e.get("event_time")
            break
        if e.get("event_type") == "LOADING_COMPLETED":
            end_iso = e.get("event_time")
            break

    if not end_iso and vehicle.get("status") in {"EXITED", "COMPLETED"}:
        end_iso = vehicle.get("updated_at")
    if not end_iso and queue and queue.get("status") in {"COMPLETED", "EXITED"}:
        end_iso = queue.get("updated_at")

    return start_iso, end_iso


def _derive_record(
    vehicle: dict,
    queue: dict | None,
    appointment: dict | None,
    events: list[dict],
) -> dict[str, Any] | None:
    start_iso, end_iso = _resolve_wait_window(queue, vehicle, events)
    if not start_iso:
        return None

    wait_mins = _minutes_between(start_iso, end_iso)
    actual_hours = round(wait_mins / 60, 2)
    free_hours = float(DETENTION_CONFIG["free_hours"])
    billable_hours = max(0.0, actual_hours - free_hours)
    if billable_hours <= 0:
        return None

    rate = _resolve_rate(vehicle, appointment)
    cost = int(round(billable_hours * rate))
    if cost <= 0:
        return None

    billing_date = _today()
    start_dt = _coerce_datetime(start_iso)
    if start_dt:
        billing_date = start_dt.date()

    ref_suffix = (queue.get("queue_number") if queue else vehicle.get("vehicle_number", ""))[:12]
    detention_ref = f"DET-{ref_suffix}".replace(" ", "")

    return {
        "detention_ref": detention_ref,
        "vehicle_id": vehicle["id"],
        "queue_entry_id": queue.get("id") if queue else None,
        "appointment_id": (queue.get("appointment_id") if queue else None) or (appointment.get("id") if appointment else None),
        "billing_date": billing_date,
        "plate": vehicle["vehicle_number"],
        "category": _normalize_category(vehicle.get("ownership_type")),
        "transporter": vehicle.get("transporter_name") or "—",
        "free_hours": free_hours,
        "actual_hours": actual_hours,
        "rate": rate,
        "cost": cost,
        "status": "Pending",
        "remarks": None,
        "is_estimated": True,
        "gate_in_time": start_iso,
        "end_time": end_iso,
    }


async def get_detention_config() -> dict[str, Any]:
    return {**DETENTION_CONFIG, "formula": "(ActualWaitTime - FreeWaitTime) × Rate"}


async def _upsert_derived(conn: Any, derived: dict[str, Any], existing: dict | None) -> dict[str, Any]:
    if existing:
        row = await conn.fetchrow(
            """
            UPDATE detention_records SET
                plate = $2,
                category = $3,
                transporter = $4,
                free_hours = $5,
                actual_hours = $6,
                rate = $7,
                cost = $8,
                billing_date = $9,
                is_estimated = TRUE,
                updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING *
            """,
            existing["id"],
            derived["plate"],
            derived["category"],
            derived["transporter"],
            derived["free_hours"],
            derived["actual_hours"],
            derived["rate"],
            derived["cost"],
            derived["billing_date"],
        )
        return {**_to_dict(row), "gate_in_time": derived.get("gate_in_time"), "end_time": derived.get("end_time")}

    record_id = str(uuid.uuid4())
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO detention_records (
                id, detention_ref, vehicle_id, queue_entry_id, appointment_id,
                billing_date, plate, category, transporter,
                free_hours, actual_hours, rate, cost, status, remarks, is_estimated
            )
            VALUES ($1, $2, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending', $14, TRUE)
            RETURNING *
            """,
            record_id,
            derived["detention_ref"],
            derived["vehicle_id"],
            derived.get("queue_entry_id"),
            derived.get("appointment_id"),
            derived["billing_date"],
            derived["plate"],
            derived["category"],
            derived["transporter"],
            derived["free_hours"],
            derived["actual_hours"],
            derived["rate"],
            derived["cost"],
            derived.get("remarks"),
        )
    except Exception as exc:
        if "detention_records_detention_ref_key" in str(exc) and derived.get("queue_entry_id"):
            row = await conn.fetchrow(
                "SELECT * FROM detention_records WHERE queue_entry_id = $1::uuid",
                derived["queue_entry_id"],
            )
            if row:
                return {**_to_dict(row), "gate_in_time": derived.get("gate_in_time"), "end_time": derived.get("end_time")}
        raise
    return {**_to_dict(row), "gate_in_time": derived.get("gate_in_time"), "end_time": derived.get("end_time")}


async def list_detention_records(
    *,
    q: str | None = None,
    status: str | None = None,
) -> list[dict[str, Any]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        vehicles = await conn.fetch("SELECT * FROM vehicles ORDER BY updated_at DESC")
        queues = await conn.fetch("SELECT * FROM queue_entries ORDER BY checkin_time DESC NULLS LAST")
        appointments = await conn.fetch("SELECT * FROM appointments")
        events = await conn.fetch("SELECT * FROM yard_events ORDER BY event_time DESC LIMIT 2000")
        existing_rows = await conn.fetch("SELECT * FROM detention_records ORDER BY billing_date DESC, cost DESC")

        vehicle_map = {str(r["id"]): _to_dict(r) for r in vehicles}
        appointment_map = {str(r["id"]): _to_dict(r) for r in appointments}
        existing_by_queue = {str(r["queue_entry_id"]): _to_dict(r) for r in existing_rows if r["queue_entry_id"]}
        existing_by_ref = {r["detention_ref"]: _to_dict(r) for r in existing_rows}
        events_list = [_to_dict(e) for e in events]

        seen_queues: set[str] = set()
        results: list[dict[str, Any]] = []

        for q_row in queues:
            queue_entry = _to_dict(q_row)
            if queue_entry["id"] in seen_queues:
                continue
            vehicle = vehicle_map.get(str(queue_entry["vehicle_id"]))
            if not vehicle:
                continue
            appt = appointment_map.get(str(queue_entry.get("appointment_id") or ""))
            derived = _derive_record(vehicle, queue_entry, appt, events_list)
            if not derived:
                continue
            seen_queues.add(queue_entry["id"])
            existing = existing_by_queue.get(str(queue_entry["id"])) or existing_by_ref.get(
                derived["detention_ref"]
            )
            merged = await _upsert_derived(conn, derived, existing)
            results.append(merged)

        for v_row in vehicles:
            v = _to_dict(v_row)
            if v["status"] not in {"WAITING", "CHECKED_IN", "CALLED", "DOCK_ASSIGNED", "LOADING", "COMPLETED", "EXITED"}:
                continue
            if any(r.get("vehicle_id") == v["id"] for r in results):
                continue
            appt = next((a for a in appointment_map.values() if a.get("vehicle_id") == v["id"]), None)
            derived = _derive_record(v, None, appt, events_list)
            if not derived:
                continue
            existing = existing_by_ref.get(derived["detention_ref"])
            merged = await _upsert_derived(conn, derived, existing)
            results.append(merged)

        result_ids = {r["id"] for r in results}
        for ex_row in existing_rows:
            ex = _to_dict(ex_row)
            if ex["id"] not in result_ids:
                results.append(ex)

        results.sort(key=lambda r: (r.get("billing_date"), r.get("cost", 0)), reverse=True)

        if status:
            results = [r for r in results if r.get("status") == status]
        if q is not None and str(q).strip():
            q_lower = str(q).strip().lower()
            filtered = []
            for row in results:
                norm = normalize_detention_row(row)
                hay = " ".join(
                    str(norm.get(k, ""))
                    for k in ("detention_ref", "plate", "transporter", "status", "remarks", "category")
                ).lower()
                if q_lower in hay:
                    filtered.append(row)
            results = filtered

        return results


async def get_detention_record(detention_id: str) -> dict[str, Any]:
    pool = get_pool()
    row = await pool.fetchrow("SELECT * FROM detention_records WHERE id = $1::uuid", detention_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Detention record not found")
    record = _to_dict(row)
    events = await pool.fetch(
        """
        SELECT * FROM yard_events
        WHERE vehicle_id = $1::uuid OR queue_entry_id = $2::uuid
        ORDER BY event_time DESC LIMIT 30
        """,
        record["vehicle_id"],
        record.get("queue_entry_id"),
    )
    record["events"] = [_to_dict(e) for e in events]
    return record


def _validate_status(status: str) -> None:
    if status not in DETENTION_STATUSES:
        raise HTTPException(status_code=400, detail=f"Unsupported detention status '{status}'")


def _validate_transition(current: str, next_status: str) -> None:
    allowed = DETENTION_STATUS_TRANSITIONS.get(current, set())
    if next_status not in allowed and next_status != current:
        raise HTTPException(status_code=409, detail=f"Invalid transition from '{current}' to '{next_status}'")


def _status_event_type(status: str) -> str:
    return {
        "Approved": "DETENTION_APPROVED",
        "Disputed": "DETENTION_DISPUTED",
        "Paid": "DETENTION_PAID",
        "Reviewed": "DETENTION_REVIEWED",
    }.get(status, "DETENTION_STATUS_CHANGED")


async def update_detention_status(
    detention_id: str,
    status: str,
    *,
    remarks: str | None = None,
    created_by: str = "detention-ui",
) -> dict[str, Any]:
    _validate_status(status)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await conn.fetchrow("SELECT * FROM detention_records WHERE id = $1::uuid", detention_id)
            if current is None:
                raise HTTPException(status_code=404, detail="Detention record not found")
            cur = _to_dict(current)
            _validate_transition(cur["status"], status)
            row = await conn.fetchrow(
                """
                UPDATE detention_records SET status = $2, remarks = COALESCE($3, remarks), updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                detention_id,
                status,
                remarks,
            )
            await create_yard_event(
                vehicle_id=str(cur["vehicle_id"]),
                appointment_id=str(cur["appointment_id"]) if cur.get("appointment_id") else None,
                queue_entry_id=str(cur["queue_entry_id"]) if cur.get("queue_entry_id") else None,
                dock_id=None,
                event_type=_status_event_type(status),
                event_note=remarks or f"Detention {cur['detention_ref']} → {status}",
                created_by=created_by,
                conn=conn,
            )
    return _to_dict(row)


async def build_detention_summary(records: list[dict[str, Any]]) -> dict[str, Any]:
    today = _today()
    month_start = today.replace(day=1)
    today_records = [r for r in records if r.get("billing_date") == today]
    mtd_records = [r for r in records if r.get("billing_date") and r["billing_date"] >= month_start]

    today_total = sum(r.get("cost", 0) for r in today_records)
    mtd_total = sum(r.get("cost", 0) for r in mtd_records)
    disputed_count = sum(1 for r in records if r.get("status") == "Disputed")
    disputed_cost = sum(r.get("cost", 0) for r in records if r.get("status") == "Disputed")
    approved_count = sum(1 for r in records if r.get("status") == "Approved")
    targeted_savings = int(disputed_cost * 0.35 + approved_count * 1200)

    categories = [
        {"name": "Outside", "key": "Outside", "fill": "#DC2626"},
        {"name": "Contract", "key": "Contract", "fill": "#D97706"},
        {"name": "Company", "key": "Company", "fill": "#16A34A"},
    ]
    breakdown = []
    for c in categories:
        cat_records = [r for r in records if r.get("category") == c["key"]]
        breakdown.append({
            "name": c["name"],
            "value": sum(r.get("cost", 0) for r in cat_records),
            "fill": c["fill"],
            "count": len(cat_records),
        })

    return {
        "today": today_total,
        "monthToDate": mtd_total,
        "disputedCount": disputed_count,
        "targetedSavings": targeted_savings,
        "breakdown": breakdown,
        "recordCount": len(records),
    }
