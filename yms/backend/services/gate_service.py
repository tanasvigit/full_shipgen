"""Gate Management — entry & exit verification integrated with YMS lifecycle."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from db import get_pool
from services.yms_service import (
    _to_dict,
    check_in_vehicle,
    create_yard_event,
    get_appointment,
    get_dock,
    get_queue_entry,
    get_vehicle,
    get_vehicle_journey,
    list_appointments,
    list_queue_entries,
    list_vehicles,
    list_yard_events,
    transition_vehicle_status,
    update_appointment,
    update_queue_entry,
    update_vehicle,
)

GATE_EVENT_TYPES = {
    "GATE_SCAN",
    "ENTRY_APPROVED",
    "ENTRY_REJECTED",
    "VEHICLE_CHECKED_IN",
    "EXIT_HOLDING",
    "EXIT_VERIFIED",
    "EXIT_REJECTED",
    "GATE_OUT_APPROVED",
    "VEHICLE_EXITED",
    "GATE_OUT_COMPLETED",
}

EXIT_CHECKLIST_FIELDS = (
    "loading_completed_verified",
    "appointment_completed_verified",
    "vehicle_verified",
    "delivery_document_verified",
    "invoice_approved",
    "gate_pass_approved",
    "security_cleared",
)

OPEN_GATE_IDS = {"G1", "G2", "G3", "G4"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_query(q: str) -> str:
    return str(q or "").strip().upper().replace(" ", "")


async def _fetch_latest_appointment_for_vehicle(
    vehicle_id: str,
    *,
    conn: Any | None = None,
) -> dict[str, Any] | None:
    sql = """
        SELECT * FROM appointments
        WHERE vehicle_id = $1::uuid
        ORDER BY created_at DESC
        LIMIT 1
    """
    if conn is not None:
        row = await conn.fetchrow(sql, vehicle_id)
        return _to_dict(row) if row else None
    pool = get_pool()
    async with pool.acquire() as db_conn:
        row = await db_conn.fetchrow(sql, vehicle_id)
        return _to_dict(row) if row else None


async def _fetch_latest_queue_for_vehicle(
    vehicle_id: str,
    *,
    conn: Any | None = None,
) -> dict[str, Any] | None:
    sql = """
        SELECT * FROM queue_entries
        WHERE vehicle_id = $1::uuid
        ORDER BY created_at DESC
        LIMIT 1
    """
    if conn is not None:
        row = await conn.fetchrow(sql, vehicle_id)
        return _to_dict(row) if row else None
    pool = get_pool()
    async with pool.acquire() as db_conn:
        row = await db_conn.fetchrow(sql, vehicle_id)
        return _to_dict(row) if row else None


async def _get_or_create_verification(
    vehicle_id: str,
    appointment_id: str | None,
    gate_id: str,
    *,
    conn: Any,
) -> dict[str, Any]:
    if appointment_id:
        row = await conn.fetchrow(
            """
            SELECT * FROM gate_verifications
            WHERE vehicle_id = $1::uuid AND appointment_id = $2::uuid
            ORDER BY updated_at DESC
            LIMIT 1
            """,
            vehicle_id,
            appointment_id,
        )
    else:
        row = await conn.fetchrow(
            """
            SELECT * FROM gate_verifications
            WHERE vehicle_id = $1::uuid
            ORDER BY (appointment_id IS NULL), updated_at DESC
            LIMIT 1
            """,
            vehicle_id,
        )
    if row:
        return _to_dict(row)
    vid = str(uuid.uuid4())
    row = await conn.fetchrow(
        """
        INSERT INTO gate_verifications (
            id, vehicle_id, appointment_id, gate_id,
            gate_pass_approved, invoice_approved, security_cleared
        )
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4, FALSE, FALSE, FALSE)
        RETURNING *
        """,
        vid,
        vehicle_id,
        appointment_id,
        gate_id,
    )
    return _to_dict(row)


async def _resolve_lookup(query: str) -> tuple[dict[str, Any], dict[str, Any] | None, dict[str, Any] | None]:
    q = _normalize_query(query)
    if not q:
        raise HTTPException(status_code=400, detail="Query required")

    vehicles, _ = await list_vehicles()
    appointments, _ = await list_appointments()
    queues, _ = await list_queue_entries()

    vehicle = next((v for v in vehicles if _normalize_query(v["vehicle_number"]) == q), None)
    appointment = None

    if not vehicle:
        appointment = next(
            (
                a
                for a in appointments
                if _normalize_query(a["booking_reference"]) == q
                or q in _normalize_query(a["booking_reference"])
            ),
            None,
        )
        if appointment:
            vehicle = next((v for v in vehicles if v["id"] == appointment["vehicle_id"]), None)

    if not vehicle:
        vehicle = next((v for v in vehicles if q in _normalize_query(v["vehicle_number"])), None)

    if not vehicle:
        ref_match = next(
            (v for v in vehicles if v.get("vehicle_reference") and q in _normalize_query(v["vehicle_reference"])),
            None,
        )
        vehicle = ref_match

    if not vehicle:
        raise HTTPException(status_code=404, detail=f"No vehicle found for '{query}'")

    if not appointment:
        vid = str(vehicle["id"])
        appts = [a for a in appointments if str(a["vehicle_id"]) == vid]
        appts.sort(key=lambda a: a.get("created_at") or "", reverse=True)
        appointment = appts[0] if appts else None

    queue = None
    if appointment:
        appt_id = str(appointment["id"])
        queue = next((qrow for qrow in queues if str(qrow["appointment_id"]) == appt_id), None)
    if not queue:
        vid = str(vehicle["id"])
        queue = next((qrow for qrow in queues if str(qrow["vehicle_id"]) == vid), None)

    return vehicle, appointment, queue


def _derive_activity_tab(vehicle: dict, appointment: dict | None, queue: dict | None, events: list) -> str:
    """Map vehicle lifecycle status to gate activity tab (canonical — no status lumping)."""
    from services.operational_metrics import LOADING_PIPELINE_STATUSES

    status = vehicle.get("status") or ""
    if status == "EXITED" or (appointment and appointment.get("status") == "EXITED"):
        return "EXITED"
    rejected = any(
        e.get("event_type") in {"ENTRY_REJECTED", "EXIT_REJECTED", "GATE_REJECTED"}
        for e in events
    )
    if rejected or status == "CANCELLED":
        return "REJECTED"
    if status == "EXIT_VERIFIED":
        return "EXIT_VERIFIED"
    if status == "EXIT_HOLDING":
        return "EXIT_HOLDING"
    if status in LOADING_PIPELINE_STATUSES:
        return "LOADING_PIPELINE"
    if status == "WAITING":
        return "WAITING"
    if status == "CHECKED_IN":
        return "CHECKED_IN"
    if status == "ARRIVED" or (appointment and appointment.get("status") == "ARRIVED"):
        return "ARRIVED"
    if appointment and appointment.get("status") == "SCHEDULED":
        rt = appointment.get("reporting_time")
        if rt:
            diff = datetime.fromisoformat(str(rt).replace("Z", "+00:00")).timestamp() - _now().timestamp()
            if diff > 15 * 60:
                return "APPROACHING"
        return "ARRIVED"
    return "APPROACHING"


def _build_entry_checks(
    vehicle: dict,
    appointment: dict | None,
    queue: dict | None,
    gate_id: str,
) -> list[dict[str, Any]]:
    checks = []
    appt_exists = appointment is not None
    checks.append({
        "id": "appointment_exists",
        "label": "Appointment Exists",
        "passed": appt_exists,
        "hint": appointment.get("booking_reference") if appointment else "Not found",
    })
    appt_active = appointment and appointment.get("status") not in {"CANCELLED", "EXITED", "COMPLETED"}
    checks.append({
        "id": "appointment_active",
        "label": "Appointment Active",
        "passed": bool(appt_active),
        "hint": appointment.get("status") if appointment else "—",
    })
    correct_date = False
    if appointment and appointment.get("booking_date"):
        today = _now().date().isoformat()
        bd = str(appointment["booking_date"])
        correct_date = bd == today or bd == str(appointment.get("booking_date"))
    checks.append({
        "id": "correct_date",
        "label": "Correct Date",
        "passed": correct_date,
        "hint": str(appointment.get("booking_date")) if appointment else "—",
    })
    checks.append({
        "id": "vehicle_match",
        "label": "Vehicle Match",
        "passed": bool(
            vehicle
            and appointment
            and str(appointment.get("vehicle_id")) == str(vehicle["id"])
        ),
        "hint": vehicle.get("vehicle_number") or "—",
    })
    already_in = bool(queue) or vehicle.get("status") in {
        "WAITING", "CALLED", "LOADING", "COMPLETED", "EXIT_HOLDING", "EXIT_VERIFIED",
    }
    checks.append({
        "id": "not_checked_in",
        "label": "Not Already Checked In",
        "passed": not already_in,
        "hint": queue.get("queue_number") if queue else vehicle.get("status", "Clear"),
    })
    gate_open = gate_id in OPEN_GATE_IDS
    checks.append({
        "id": "gate_open",
        "label": "Gate Open",
        "passed": gate_open,
        "hint": f"Gate {gate_id}",
    })
    return checks


def _build_exit_checks(verification: dict | None) -> list[dict[str, Any]]:
    """Manual exit checklist — operator must confirm each item before approve exit."""
    ver = verification or {}
    specs = [
        ("loading_completed", "Loading Completed", "loading_completed_verified"),
        ("appointment_completed", "Appointment Completed", "appointment_completed_verified"),
        ("vehicle_verified", "Vehicle Verified", "vehicle_verified"),
        ("delivery_document", "Delivery Document Verified", "delivery_document_verified"),
        ("invoice", "Invoice Verified", "invoice_approved"),
        ("gate_pass", "Gate Pass Verified", "gate_pass_approved"),
        ("security", "Security Clearance Verified", "security_cleared"),
    ]
    checks = []
    for cid, label, field in specs:
        passed = bool(ver.get(field))
        checks.append({
            "id": cid,
            "label": label,
            "field": field,
            "passed": passed,
            "hint": "Verified" if passed else "Pending operator confirmation",
        })
    return checks


def _entry_approved(checks: list[dict]) -> bool:
    return all(c["passed"] for c in checks)


def _exit_approved(checks: list[dict]) -> bool:
    return all(c["passed"] for c in checks)


async def lookup_gate_context(query: str, gate_id: str = "G1") -> dict[str, Any]:
    vehicle, appointment, queue = await _resolve_lookup(query)
    events, _ = await list_yard_events()
    vehicle_events = [
        e for e in events
        if e.get("vehicle_id") == vehicle["id"]
        or (appointment and e.get("appointment_id") == appointment["id"])
    ][:30]
    journey = await get_vehicle_journey(vehicle["id"])
    pool = get_pool()
    async with pool.acquire() as conn:
        verification = await _get_or_create_verification(
            vehicle["id"],
            appointment["id"] if appointment else None,
            gate_id,
            conn=conn,
        )
    entry_checks = _build_entry_checks(vehicle, appointment, queue, gate_id)
    exit_checks = _build_exit_checks(verification)
    tab = _derive_activity_tab(vehicle, appointment, queue, vehicle_events)
    return {
        "vehicle": vehicle,
        "appointment": appointment,
        "queueEntry": queue,
        "verification": verification,
        "journey": journey,
        "events": vehicle_events,
        "activityTab": tab,
        "entryChecks": entry_checks,
        "exitChecks": exit_checks,
        "entryApproved": _entry_approved(entry_checks),
        "exitApproved": _exit_approved(exit_checks),
        "gateId": gate_id,
    }


async def get_gate_dashboard(gate_id: str = "G1") -> dict[str, Any]:
    vehicles, _ = await list_vehicles()
    appointments, _ = await list_appointments()
    queues, _ = await list_queue_entries()
    events, _ = await list_yard_events()
    today = _now().date().isoformat()
    activity = []
    queue_by_appt = {q["appointment_id"]: q for q in queues}
    seen_vehicles: set[str] = set()

    for appt in appointments:
        vehicle = next((v for v in vehicles if v["id"] == appt["vehicle_id"]), None)
        if not vehicle:
            continue
        seen_vehicles.add(vehicle["id"])
        queue = queue_by_appt.get(appt["id"])
        veh_events = [e for e in events if e.get("vehicle_id") == vehicle["id"]]
        tab = _derive_activity_tab(vehicle, appt, queue, veh_events)
        activity.append({
            "vehicleId": vehicle["id"],
            "appointmentId": appt["id"],
            "queueEntryId": queue["id"] if queue else None,
            "plate": vehicle.get("vehicle_number"),
            "vehicleReference": vehicle.get("vehicle_reference"),
            "appointment": appt.get("booking_reference"),
            "transporter": vehicle.get("transporter_name"),
            "driver": vehicle.get("driver_name"),
            "slot": appt.get("scheduled_slot"),
            "status": vehicle.get("status"),
            "activityTab": tab,
            "gateId": appt.get("gate_number") or gate_id,
        })

    for v in vehicles:
        if v.get("status") in {"EXIT_HOLDING", "EXIT_VERIFIED"} and v["id"] not in seen_vehicles:
            appt = next((a for a in appointments if a["vehicle_id"] == v["id"]), None)
            tab = "EXIT_VERIFIED" if v.get("status") == "EXIT_VERIFIED" else "EXIT_HOLDING"
            activity.append({
                "vehicleId": v["id"],
                "appointmentId": appt["id"] if appt else None,
                "queueEntryId": None,
                "plate": v.get("vehicle_number"),
                "vehicleReference": v.get("vehicle_reference"),
                "appointment": appt.get("booking_reference") if appt else "—",
                "transporter": v.get("transporter_name"),
                "driver": v.get("driver_name"),
                "slot": appt.get("scheduled_slot") if appt else "—",
                "status": v.get("status"),
                "activityTab": tab,
                "gateId": gate_id,
            })

    from services.operational_metrics import (
        count_vehicles_exit_holding,
        count_vehicles_loading_pipeline,
        count_vehicles_waiting,
    )

    counts = {
        "approaching": sum(1 for row in activity if row["activityTab"] == "APPROACHING"),
        "arrived": sum(1 for v in vehicles if v.get("status") == "ARRIVED"),
        "checkedIn": sum(1 for v in vehicles if v.get("status") == "CHECKED_IN"),
        "waiting": count_vehicles_waiting(vehicles),
        "loadingPipeline": count_vehicles_loading_pipeline(vehicles),
        "exitHolding": count_vehicles_exit_holding(vehicles),
        "exitedToday": 0,
    }
    for v in vehicles:
        if v.get("status") == "EXITED" and v.get("exit_time") and str(v["exit_time"])[:10] == today:
            counts["exitedToday"] += 1

    return {"gateId": gate_id, "kpis": counts, "activity": activity}


async def record_gate_scan(query: str, gate_id: str, scan_type: str, created_by: str) -> dict[str, Any]:
    ctx = await lookup_gate_context(query, gate_id)
    await create_yard_event(
        vehicle_id=ctx["vehicle"]["id"],
        appointment_id=ctx["appointment"]["id"] if ctx.get("appointment") else None,
        queue_entry_id=ctx["queueEntry"]["id"] if ctx.get("queueEntry") else None,
        dock_id=None,
        event_type="GATE_SCAN",
        event_note=f"{scan_type} scan at gate {gate_id}: {query}",
        created_by=created_by,
    )
    return ctx


async def mark_vehicle_arrived(
    vehicle_id: str,
    gate_id: str,
    created_by: str,
    *,
    conn: Any | None = None,
) -> dict[str, Any]:
    async def _run(connection: Any) -> dict[str, Any]:
        vehicle = await get_vehicle(vehicle_id, conn=connection)
        if vehicle["status"] not in {"SCHEDULED", "DRAFT"}:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot mark arrived from status {vehicle['status']}",
            )
        appt_row = await connection.fetchrow(
            """
            SELECT id, status FROM appointments
            WHERE vehicle_id = $1::uuid
            ORDER BY created_at DESC LIMIT 1
            """,
            vehicle_id,
        )
        now = _now()
        await update_vehicle(
            vehicle_id,
            {"status": "ARRIVED"},
            conn=connection,
            internal=True,
        )
        await connection.execute(
            "UPDATE vehicles SET arrived_at = $2, updated_at = NOW() WHERE id = $1::uuid",
            vehicle_id,
            now,
        )
        if appt_row:
            await update_appointment(
                str(appt_row["id"]), {"status": "ARRIVED"}, conn=connection, internal=True
            )
        await create_yard_event(
            vehicle_id=vehicle_id,
            appointment_id=str(appt_row["id"]) if appt_row else None,
            queue_entry_id=None,
            dock_id=None,
            event_type="VEHICLE_STATUS_CHANGED",
            event_note=f"Marked ARRIVED at gate {gate_id}",
            created_by=created_by,
            conn=connection,
        )
        return vehicle

    if conn is not None:
        vehicle = await _run(conn)
    else:
        pool = get_pool()
        async with pool.acquire() as acquired:
            async with acquired.transaction():
                vehicle = await _run(acquired)
    plate = vehicle.get("vehicle_number") or vehicle_id
    return await lookup_gate_context(plate, gate_id)


async def approve_entry(
    vehicle_id: str,
    gate_id: str,
    created_by: str,
    *,
    queue_number: str | None = None,
    queue_type: str = "Loading",
) -> dict[str, Any]:
    vehicle = await get_vehicle(vehicle_id)
    appointment = await _fetch_latest_appointment_for_vehicle(vehicle_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="No appointment for vehicle")

    existing_queue = await _fetch_latest_queue_for_vehicle(vehicle_id)
    if existing_queue and str(existing_queue.get("appointment_id")) == str(appointment["id"]):
        raise HTTPException(status_code=409, detail="Vehicle already checked in")

    ctx = await lookup_gate_context(vehicle["vehicle_number"], gate_id)
    if not ctx["entryApproved"]:
        failed = [c["label"] for c in ctx["entryChecks"] if not c["passed"]]
        raise HTTPException(status_code=409, detail=f"Entry blocked: {', '.join(failed)}")

    qnum = queue_number or f"Q-{int(_now().timestamp()) % 10000000}"
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            vehicle = await get_vehicle(vehicle_id, conn=conn)
            appointment = await _fetch_latest_appointment_for_vehicle(vehicle_id, conn=conn) or appointment
            if vehicle["status"] in {"SCHEDULED", "DRAFT"}:
                await mark_vehicle_arrived(vehicle_id, gate_id, created_by, conn=conn)
                vehicle = await get_vehicle(vehicle_id, conn=conn)
                appointment = await _fetch_latest_appointment_for_vehicle(vehicle_id, conn=conn) or appointment

            queue = await check_in_vehicle(appointment["id"], qnum, queue_type, conn=conn)
            await _get_or_create_verification(
                vehicle_id,
                str(appointment["id"]),
                gate_id,
                conn=conn,
            )
            await conn.execute(
                """
                UPDATE gate_verifications SET
                    entry_approved_at = NOW(),
                    gate_pass_approved = TRUE,
                    updated_at = NOW()
                WHERE vehicle_id = $1::uuid AND appointment_id = $2::uuid
                """,
                vehicle_id,
                appointment["id"],
            )
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appointment["id"],
                queue_entry_id=queue["id"],
                dock_id=None,
                event_type="ENTRY_APPROVED",
                event_note=f"Entry approved at gate {gate_id}",
                created_by=created_by,
                conn=conn,
            )

    return await lookup_gate_context(vehicle["vehicle_number"], gate_id)


async def reject_entry(
    vehicle_id: str,
    gate_id: str,
    reason: str,
    created_by: str,
) -> None:
    vehicle = await get_vehicle(vehicle_id)
    appointment = await _fetch_latest_appointment_for_vehicle(vehicle_id)
    if appointment:
        await update_appointment(
            appointment["id"],
            {"status": "CANCELLED", "remarks": reason},
            internal=True,
        )
    if vehicle["status"] not in {"EXITED", "CANCELLED"}:
        await transition_vehicle_status(
            vehicle_id,
            "CANCELLED",
            f"Entry rejected — {reason}",
            created_by,
        )
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            if appointment:
                await conn.execute(
                    """
                    UPDATE gate_verifications SET entry_rejected_at = NOW(), updated_at = NOW()
                    WHERE vehicle_id = $1::uuid AND appointment_id = $2::uuid
                    """,
                    vehicle_id,
                    appointment["id"],
                )
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appointment["id"] if appointment else None,
                queue_entry_id=None,
                dock_id=None,
                event_type="ENTRY_REJECTED",
                event_note=f"Gate {gate_id}: {reason}",
                created_by=created_by,
                conn=conn,
            )


def _completed_at_for_vehicle(vehicle: dict, events: list) -> str | None:
    completed_ev = next(
        (
            e
            for e in events
            if e.get("vehicle_id") == vehicle["id"] and e.get("event_type") == "LOADING_COMPLETED"
        ),
        None,
    )
    if completed_ev and completed_ev.get("event_time"):
        return str(completed_ev["event_time"])
    if vehicle.get("exit_holding_at"):
        return str(vehicle["exit_holding_at"])
    return vehicle.get("updated_at")


def _waiting_minutes(since: str | None) -> int:
    if not since:
        return 0
    try:
        start = datetime.fromisoformat(str(since).replace("Z", "+00:00"))
        return max(int((_now() - start).total_seconds() // 60), 0)
    except (TypeError, ValueError):
        return 0


async def get_exit_holding_dashboard(gate_id: str = "G1") -> dict[str, Any]:
    vehicles, _ = await list_vehicles()
    events, _ = await list_yard_events()
    today = _now().date()
    today_str = today.isoformat()
    waiting = [v for v in vehicles if v.get("status") == "EXIT_HOLDING"]
    delays = []
    for v in waiting:
        delays.append(_waiting_minutes(_completed_at_for_vehicle(v, events)))
    avg_delay = round(sum(delays) / len(delays)) if delays else 0
    pool = get_pool()
    verified_today = 0
    async with pool.acquire() as conn:
        verified_today = await conn.fetchval(
            """
            SELECT COUNT(*)::int FROM gate_verifications
            WHERE verified_at IS NOT NULL AND verified_at::date = $1::date
            """,
            today,
        )
    exited_today = sum(
        1
        for v in vehicles
        if v.get("status") == "EXITED" and v.get("exit_time") and str(v["exit_time"])[:10] == today_str
    )
    return {
        "gateId": gate_id,
        "kpis": {
            "vehiclesWaiting": len(waiting),
            "avgExitDelay": avg_delay,
            "exitApprovedToday": verified_today or 0,
            "exitedToday": exited_today,
        },
    }


async def list_exit_holding(gate_id: str = "G1") -> list[dict[str, Any]]:
    vehicles, _ = await list_vehicles()
    appointments, _ = await list_appointments()
    queues, _ = await list_queue_entries()
    events, _ = await list_yard_events()
    pool = get_pool()
    rows = []
    for v in vehicles:
        if v.get("status") not in {"EXIT_HOLDING", "EXIT_VERIFIED"}:
            continue
        appt = next((a for a in appointments if a["vehicle_id"] == v["id"]), None)
        queue = next((q for q in queues if q["vehicle_id"] == v["id"]), None)
        dock = None
        if queue and queue.get("dock_id"):
            try:
                dock = await get_dock(queue["dock_id"])
            except HTTPException:
                dock = None
        completed_at = _completed_at_for_vehicle(v, events)
        async with pool.acquire() as conn:
            verification = await _get_or_create_verification(
                v["id"],
                appt["id"] if appt else None,
                gate_id,
                conn=conn,
            )
        rows.append({
            "vehicleId": v["id"],
            "plate": v.get("vehicle_number"),
            "vehicleReference": v.get("vehicle_reference"),
            "appointment": appt.get("booking_reference") if appt else "—",
            "appointmentId": appt["id"] if appt else None,
            "queueNumber": queue.get("queue_number") if queue else "—",
            "queueEntryId": queue["id"] if queue else None,
            "dockCode": dock.get("dock_code") if dock else "—",
            "dockId": dock.get("id") if dock else None,
            "completedAt": completed_at,
            "waitingMinutes": _waiting_minutes(completed_at),
            "verifiedBy": verification.get("verified_by"),
            "verifiedAt": verification.get("verified_at"),
            "status": v.get("status"),
            "transporter": v.get("transporter_name"),
            "driver": v.get("driver_name"),
            "verification": verification,
        })
    rows.sort(key=lambda r: r.get("completedAt") or "", reverse=True)
    return rows


async def get_exit_verification_detail(vehicle_id: str, gate_id: str = "G1") -> dict[str, Any]:
    vehicle = await get_vehicle(vehicle_id)
    if vehicle["status"] not in {"EXIT_HOLDING", "EXIT_VERIFIED", "EXITED"}:
        raise HTTPException(
            status_code=409,
            detail=f"Vehicle not in exit workflow (status={vehicle['status']})",
        )
    appointment = await _fetch_latest_appointment_for_vehicle(vehicle_id)
    queue = await _fetch_latest_queue_for_vehicle(vehicle_id)
    journey = await get_vehicle_journey(vehicle_id)
    events, _ = await list_yard_events()
    exit_events = [
        e
        for e in events
        if e.get("vehicle_id") == vehicle_id
        and e.get("event_type") in GATE_EVENT_TYPES | {"LOADING_COMPLETED", "VEHICLE_STATUS_CHANGED"}
    ]
    exit_events.sort(key=lambda e: e.get("event_time") or "", reverse=True)
    pool = get_pool()
    async with pool.acquire() as conn:
        verification = await _get_or_create_verification(
            vehicle_id,
            appointment["id"] if appointment else None,
            gate_id,
            conn=conn,
        )
    exit_checks = _build_exit_checks(verification)
    completed_at = _completed_at_for_vehicle(vehicle, events)
    return {
        "vehicle": vehicle,
        "appointment": appointment,
        "queueEntry": queue,
        "journey": journey,
        "verification": verification,
        "exitChecks": exit_checks,
        "exitApproved": _exit_approved(exit_checks),
        "exitAudit": exit_events[:50],
        "completedAt": completed_at,
        "waitingMinutes": _waiting_minutes(completed_at),
        "gateId": gate_id,
        "canVerifyExit": vehicle["status"] == "EXIT_HOLDING" and _exit_approved(exit_checks),
        "canGateOut": vehicle["status"] == "EXIT_VERIFIED",
    }


async def update_exit_checklist(
    vehicle_id: str,
    *,
    loading_completed_verified: bool | None = None,
    appointment_completed_verified: bool | None = None,
    vehicle_verified: bool | None = None,
    delivery_document_verified: bool | None = None,
    gate_pass_approved: bool | None = None,
    invoice_approved: bool | None = None,
    security_cleared: bool | None = None,
    gate_id: str = "G1",
) -> dict[str, Any]:
    vehicle = await get_vehicle(vehicle_id)
    if vehicle["status"] not in {"EXIT_HOLDING", "EXIT_VERIFIED"}:
        raise HTTPException(status_code=409, detail="Vehicle not in exit holding")
    appointment = await _fetch_latest_appointment_for_vehicle(vehicle_id)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            ver = await _get_or_create_verification(
                vehicle_id,
                appointment["id"] if appointment else None,
                gate_id,
                conn=conn,
            )
            await conn.execute(
                """
                UPDATE gate_verifications SET
                    loading_completed_verified = COALESCE($2, loading_completed_verified),
                    appointment_completed_verified = COALESCE($3, appointment_completed_verified),
                    vehicle_verified = COALESCE($4, vehicle_verified),
                    delivery_document_verified = COALESCE($5, delivery_document_verified),
                    gate_pass_approved = COALESCE($6, gate_pass_approved),
                    invoice_approved = COALESCE($7, invoice_approved),
                    security_cleared = COALESCE($8, security_cleared),
                    updated_at = NOW()
                WHERE id = $1::uuid
                """,
                ver["id"],
                loading_completed_verified,
                appointment_completed_verified,
                vehicle_verified,
                delivery_document_verified,
                gate_pass_approved,
                invoice_approved,
                security_cleared,
            )
    return await get_exit_verification_detail(vehicle_id, gate_id)


async def verify_exit(
    vehicle_id: str,
    gate_id: str,
    created_by: str,
    *,
    remarks: str | None = None,
) -> dict[str, Any]:
    """EXIT_HOLDING → EXIT_VERIFIED after manual checklist completion."""
    detail = await get_exit_verification_detail(vehicle_id, gate_id)
    vehicle = detail["vehicle"]
    if vehicle["status"] != "EXIT_HOLDING":
        raise HTTPException(status_code=409, detail=f"Cannot verify exit from status {vehicle['status']}")
    if not detail["exitApproved"]:
        failed = [c["label"] for c in detail["exitChecks"] if not c["passed"]]
        raise HTTPException(status_code=409, detail=f"Exit checklist incomplete: {', '.join(failed)}")

    appt = detail.get("appointment")
    queue = detail.get("queueEntry")
    dock_id = queue.get("dock_id") if queue else None
    now = _now()

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await transition_vehicle_status(
                vehicle_id,
                "EXIT_VERIFIED",
                f"Exit verified at gate {gate_id}",
                created_by,
                conn=conn,
            )
            await conn.execute(
                """
                UPDATE gate_verifications SET
                    verified_by = $2,
                    verified_at = $3,
                    exit_remarks = COALESCE($4, exit_remarks),
                    exit_approved_at = $3,
                    updated_at = NOW()
                WHERE vehicle_id = $1::uuid
                """,
                vehicle_id,
                created_by,
                now,
                remarks,
            )
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appt["id"] if appt else None,
                queue_entry_id=queue["id"] if queue else None,
                dock_id=dock_id,
                event_type="EXIT_VERIFIED",
                event_note=remarks or f"Exit verified at gate {gate_id}",
                created_by=created_by,
                conn=conn,
            )

    return await get_exit_verification_detail(vehicle_id, gate_id)


async def gate_out(vehicle_id: str, gate_id: str, created_by: str) -> dict[str, Any]:
    """EXIT_VERIFIED → EXITED — physical gate-out."""
    vehicle = await get_vehicle(vehicle_id)
    if vehicle["status"] == "EXITED":
        raise HTTPException(status_code=409, detail="Vehicle already exited")
    if vehicle["status"] != "EXIT_VERIFIED":
        raise HTTPException(
            status_code=409,
            detail=f"Gate out requires EXIT_VERIFIED (current: {vehicle['status']})",
        )

    appointment = await _fetch_latest_appointment_for_vehicle(vehicle_id)
    queue = await _fetch_latest_queue_for_vehicle(vehicle_id)
    dock_id = queue.get("dock_id") if queue else None
    now = _now()

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await transition_vehicle_status(
                vehicle_id,
                "EXITED",
                f"Gate out at {gate_id}",
                created_by,
                conn=conn,
            )
            await conn.execute(
                """
                UPDATE vehicles SET
                    exit_time = $2,
                    exited_by = $3,
                    exit_gate_id = $4,
                    updated_at = NOW()
                WHERE id = $1::uuid
                """,
                vehicle_id,
                now,
                created_by,
                gate_id,
            )
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appointment["id"] if appointment else None,
                queue_entry_id=queue["id"] if queue else None,
                dock_id=dock_id,
                event_type="GATE_OUT_APPROVED",
                event_note=f"Gate out approved at {gate_id}",
                created_by=created_by,
                conn=conn,
            )
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appointment["id"] if appointment else None,
                queue_entry_id=queue["id"] if queue else None,
                dock_id=dock_id,
                event_type="VEHICLE_EXITED",
                event_note=f"Vehicle exited via gate {gate_id}",
                created_by=created_by,
                conn=conn,
            )

    return await get_exit_verification_detail(vehicle_id, gate_id)


async def update_exit_clearances(
    vehicle_id: str,
    *,
    gate_pass_approved: bool | None = None,
    invoice_approved: bool | None = None,
    security_cleared: bool | None = None,
    gate_id: str = "G1",
) -> dict[str, Any]:
    return await update_exit_checklist(
        vehicle_id,
        gate_pass_approved=gate_pass_approved,
        invoice_approved=invoice_approved,
        security_cleared=security_cleared,
        gate_id=gate_id,
    )


async def approve_exit(vehicle_id: str, gate_id: str, created_by: str) -> dict[str, Any]:
    """Legacy: verify + gate out in one step if already verified."""
    vehicle = await get_vehicle(vehicle_id)
    if vehicle["status"] == "EXIT_VERIFIED":
        return await gate_out(vehicle_id, gate_id, created_by)
    return await verify_exit(vehicle_id, gate_id, created_by)


async def reject_exit(vehicle_id: str, gate_id: str, reason: str, created_by: str) -> None:
    vehicle = await get_vehicle(vehicle_id)
    appts, _ = await list_appointments()
    appointment = next((a for a in appts if a["vehicle_id"] == vehicle_id), None)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            if appointment:
                await conn.execute(
                    """
                    UPDATE gate_verifications SET exit_rejected_at = NOW(), updated_at = NOW()
                    WHERE vehicle_id = $1::uuid AND appointment_id = $2::uuid
                    """,
                    vehicle_id,
                    appointment["id"],
                )
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appointment["id"] if appointment else None,
                queue_entry_id=None,
                dock_id=None,
                event_type="EXIT_REJECTED",
                event_note=f"Gate {gate_id}: {reason}",
                created_by=created_by,
                conn=conn,
            )
