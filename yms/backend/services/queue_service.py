"""Virtual queue metrics, display status, dock recommendation, and supervisor overrides."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException

from db import get_pool
from services.yms_service import (
    calculate_priority_score,
    create_yard_event,
    get_appointment,
    get_dock,
    get_queue_entry,
    get_vehicle,
    list_queue_entries,
    update_queue_entry,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _waiting_minutes(checkin_time: datetime | None) -> int:
    if not checkin_time:
        return 0
    mins = int((_now() - checkin_time).total_seconds() // 60)
    return max(mins, 0)


def detention_cost_inr(waiting_min: int, queue_status: str) -> int:
    rate = 35
    multiplier = 1.0 if queue_status == "WAITING" else 0.6 if queue_status == "CALLED" else 0.4
    return int(waiting_min * rate * multiplier)


def detention_risk_level(waiting_min: int, cost: int) -> str:
    if waiting_min >= 120 or cost >= 5000:
        return "CRITICAL"
    if waiting_min >= 60 or cost >= 3000:
        return "HIGH"
    if waiting_min >= 30 or cost >= 1000:
        return "MEDIUM"
    return "LOW"


def queue_aging_level(waiting_min: int) -> str:
    if waiting_min >= 90:
        return "CRITICAL"
    if waiting_min >= 45:
        return "WARNING"
    return "NORMAL"


def derive_display_status(
    queue_status: str,
    vehicle_status: str | None,
    *,
    rank: int,
    priority_score: int,
) -> str:
    if vehicle_status == "RESOURCE_PENDING":
        return "RESOURCE_PENDING"
    if vehicle_status == "READY_FOR_LOADING":
        return "READY_FOR_LOADING"
    if queue_status == "DOCK_ASSIGNED" or vehicle_status == "DOCK_ASSIGNED":
        return "DOCK_ASSIGNED"
    if queue_status == "CALLED" or vehicle_status == "CALLED":
        return "REPORTING_TO_DOCK" if queue_status == "CALLED" else "CALLED"
    if queue_status == "WAITING":
        if rank <= 2 and priority_score >= 60:
            return "READY_TO_CALL"
        return "WAITING"
    return queue_status or vehicle_status or "WAITING"


def expected_call_time(rank: int, avg_turnaround_min: int = 15) -> datetime | None:
    if rank <= 1:
        return _now()
    return _now() + timedelta(minutes=(rank - 1) * avg_turnaround_min)


def _cargo_tokens(appointment: dict[str, Any] | None) -> set[str]:
    if not appointment:
        return set()
    blob = " ".join(
        str(appointment.get(k) or "")
        for k in ("shipment_reference", "remarks", "customer_name")
    ).lower()
    tokens = set()
    mapping = {
        "hazmat": "HAZMAT",
        "pharma": "COLD_CHAIN",
        "cold": "COLD_CHAIN",
        "steel": "STEEL",
        "chemical": "CHEMICALS",
        "container": "CONTAINERS",
        "fmcg": "GENERAL",
    }
    for word, cargo in mapping.items():
        if word in blob:
            tokens.add(cargo)
    if not tokens:
        tokens.add("GENERAL")
    return tokens


def _dock_occupancy(dock: dict[str, Any], queue_rows: list[dict[str, Any]] | None = None) -> int:
    dock_id = str(dock["id"])
    active = 0
    for q in queue_rows or []:
        if str(q.get("dock_id") or "") != dock_id:
            continue
        if q.get("status") in {"DOCK_ASSIGNED", "LOADING", "CALLED"}:
            active += 1
    if dock.get("current_vehicle_id") and active == 0:
        active = 1
    return active


def _dock_has_capacity(dock: dict[str, Any], queue_rows: list[dict[str, Any]] | None = None) -> bool:
    max_cap = int(dock.get("max_capacity") or 1)
    return _dock_occupancy(dock, queue_rows) < max_cap


def _vehicle_type_tokens(vehicle: dict[str, Any] | None) -> set[str]:
    vt = str((vehicle or {}).get("vehicle_type") or "").upper().replace(" ", "_")
    if not vt:
        return set()
    mapping = {
        "TRUCK": "TRUCK",
        "TRAILER": "TRAILER",
        "CONTAINER": "CONTAINER",
        "TANKER": "TANKER",
        "LCV": "LCV",
        "TEMPO": "TEMPO",
        "CUSTOM": "CUSTOM",
    }
    for key, val in mapping.items():
        if key in vt:
            return {val}
    return {vt}


def recommend_dock(
    *,
    appointment: dict[str, Any] | None,
    vehicle: dict[str, Any] | None = None,
    docks: list[dict[str, Any]],
    labor_rows: list[dict[str, Any]],
    equipment_rows: list[dict[str, Any]],
    queue_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    cargo = _cargo_tokens(appointment)
    vehicle_types = _vehicle_type_tokens(vehicle)
    candidates = []
    for dock in docks:
        if dock.get("status") not in {"AVAILABLE"}:
            continue
        if not _dock_has_capacity(dock, queue_rows):
            continue
        supported = {str(c).upper() for c in (dock.get("supported_cargo_types") or [])}
        supported_vehicles = {str(v).upper() for v in (dock.get("supported_vehicle_types") or [])}
        material_match = bool(cargo & supported) or "GENERAL" in supported
        vehicle_match = not vehicle_types or bool(vehicle_types & supported_vehicles) or "CUSTOM" in supported_vehicles
        dock_type = str(dock.get("dock_type") or "").upper()
        type_match = (
            ("HAZMAT" in cargo and dock_type == "HAZMAT")
            or ("COLD_CHAIN" in cargo and dock_type == "COLD_CHAIN")
            or ("CONTAINERS" in cargo and dock_type == "CONTAINER")
            or dock_type in {"GENERAL", "LOADING", "MIXED"}
        )
        dock_id = str(dock["id"])
        labor_avail = any(
            str(r.get("assigned_dock_id") or "") == dock_id
            or str(r.get("id") or "") == str(dock.get("default_labor_id") or "")
            or r.get("status") in {"ON_DUTY", "AVAILABLE"}
            for r in labor_rows
        )
        equip_avail = any(
            str(r.get("assigned_dock_id") or "") == dock_id
            or str(r.get("id") or "") == str(dock.get("default_equipment_id") or "")
            or r.get("status") in {"IDLE", "ASSIGNED"}
            for r in equipment_rows
        )
        score = 0
        reasons: list[str] = []
        if material_match or type_match:
            score += 40
            reasons.append("Material Match")
        if vehicle_match:
            score += 15
            reasons.append("Vehicle Match")
        reasons.append("Dock Available")
        score += 20
        if _dock_has_capacity(dock, queue_rows):
            reasons.append("Capacity Available")
            score += 15
        if labor_avail:
            score += 15
            reasons.append("Labor Available")
        if equip_avail:
            score += 15
            reasons.append("Equipment Available")
        if score > 0:
            candidates.append(
                {
                    "dockId": dock_id,
                    "dockCode": dock.get("dock_code"),
                    "dockName": dock.get("dock_name"),
                    "score": score,
                    "materialMatch": material_match,
                    "vehicleMatch": vehicle_match,
                    "laborAvailable": labor_avail,
                    "equipmentAvailable": equip_avail,
                    "reasons": reasons,
                    "reason": " · ".join(reasons) if reasons else "Best available dock",
                }
            )
    if not candidates:
        return None
    best = max(candidates, key=lambda c: c["score"])
    return best


async def _maybe_emit_wait_alert(
    *,
    queue_entry_id: str,
    vehicle_id: str,
    appointment_id: str,
    waiting_min: int,
    aging: str,
    conn: Any,
) -> None:
    if aging == "WARNING":
        event_type = "QUEUE_DELAY_WARNING"
    elif aging == "CRITICAL":
        event_type = "QUEUE_CRITICAL_WAIT"
    else:
        return
    recent = await conn.fetchval(
        """
        SELECT 1 FROM yard_events
        WHERE queue_entry_id = $1::uuid
          AND event_type = $2
          AND event_time > NOW() - INTERVAL '30 minutes'
        LIMIT 1
        """,
        queue_entry_id,
        event_type,
    )
    if recent:
        return
    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=appointment_id,
        queue_entry_id=queue_entry_id,
        dock_id=None,
        event_type=event_type,
        event_note=f"Queue wait {waiting_min} min — {aging}",
        created_by="queue-engine",
        conn=conn,
    )


def _enrich_row(
    entry: dict[str, Any],
    *,
    vehicle: dict[str, Any] | None,
    appointment: dict[str, Any] | None,
    dock: dict[str, Any] | None,
    rank: int,
    labor_label: str | None,
    equipment_label: str | None,
    recommendation: dict[str, Any] | None,
) -> dict[str, Any]:
    waiting_min = _waiting_minutes(entry.get("checkin_time"))
    cost = detention_cost_inr(waiting_min, entry.get("status", "WAITING"))
    vehicle_status = (vehicle or {}).get("status")
    display_status = derive_display_status(
        entry.get("status", "WAITING"),
        vehicle_status,
        rank=rank,
        priority_score=int(entry.get("priority_score") or 0),
    )
    aging = queue_aging_level(waiting_min)
    risk = detention_risk_level(waiting_min, cost)
    eta = expected_call_time(rank)
    return {
        "queueEntryId": str(entry["id"]),
        "vehicleId": str(entry["vehicle_id"]),
        "appointmentId": str(entry["appointment_id"]),
        "dockId": str(entry["dock_id"]) if entry.get("dock_id") else None,
        "plate": (vehicle or {}).get("vehicle_number"),
        "transporter": (vehicle or {}).get("transporter_name"),
        "vehicleStatus": vehicle_status,
        "displayStatus": display_status,
        "queueRank": rank,
        "waitingMin": waiting_min,
        "detentionCost": cost,
        "detentionRisk": risk,
        "queueAging": aging,
        "priorityScore": int(entry.get("priority_score") or 0),
        "expectedCallTime": eta.isoformat() if eta else None,
        "dockCode": (dock or {}).get("dock_code"),
        "dockAssignedSince": (dock or {}).get("assigned_since"),
        "laborTeam": labor_label,
        "equipment": equipment_label,
        "material": (appointment or {}).get("shipment_reference"),
        "bookingRef": (appointment or {}).get("booking_reference"),
        "vehicleType": (vehicle or {}).get("vehicle_type"),
        "gateNumber": (appointment or {}).get("gate_number"),
        "recommendedDock": recommendation,
        "queueNumber": entry.get("queue_number"),
        "queueType": entry.get("queue_type"),
        "status": entry.get("status"),
        "checkinTime": entry.get("checkin_time"),
        "category":
            "Company"
            if (vehicle or {}).get("ownership_type") == "company"
            else "Contract"
            if (vehicle or {}).get("ownership_type") == "contract"
            else "Outside",
    }


async def build_queue_bundle() -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        entries, _ = await list_queue_entries()
        active = [e for e in entries if e["status"] not in {"COMPLETED", "EXITED", "CANCELLED"}]
        active.sort(
            key=lambda e: (-int(e.get("priority_score") or 0), e.get("created_at") or _now())
        )

        vehicles = await conn.fetch("SELECT * FROM vehicles")
        appointments = await conn.fetch("SELECT * FROM appointments")
        docks = await conn.fetch("SELECT * FROM docks")
        labor = await conn.fetch("SELECT * FROM labor_teams")
        equipment = await conn.fetch("SELECT * FROM equipment")

        vehicle_map = {str(v["id"]): dict(v) for v in vehicles}
        appt_map = {str(a["id"]): dict(a) for a in appointments}
        dock_map = {str(d["id"]): dict(d) for d in docks}
        labor_by_dock = {str(l["assigned_dock_id"]): l for l in labor if l.get("assigned_dock_id")}
        equip_by_dock = {str(e["assigned_dock_id"]): e for e in equipment if e.get("assigned_dock_id")}

        enriched = []
        for idx, entry in enumerate(active):
            rank = idx + 1
            vid = str(entry["vehicle_id"])
            vehicle = vehicle_map.get(vid)
            appt = appt_map.get(str(entry["appointment_id"]))
            dock = dock_map.get(str(entry["dock_id"])) if entry.get("dock_id") else None
            labor_row = labor_by_dock.get(str(entry["dock_id"])) if entry.get("dock_id") else None
            equip_row = equip_by_dock.get(str(entry["dock_id"])) if entry.get("dock_id") else None
            rec = recommend_dock(
                appointment=appt,
                vehicle=vehicle,
                docks=[dict(d) for d in docks],
                labor_rows=[dict(l) for l in labor],
                equipment_rows=[dict(e) for e in equipment],
                queue_rows=[dict(e) for e in active],
            )
            waiting_min = _waiting_minutes(entry.get("checkin_time"))
            await _maybe_emit_wait_alert(
                queue_entry_id=str(entry["id"]),
                vehicle_id=vid,
                appointment_id=str(entry["appointment_id"]),
                waiting_min=waiting_min,
                aging=queue_aging_level(waiting_min),
                conn=conn,
            )
            enriched.append(
                _enrich_row(
                    entry,
                    vehicle=vehicle,
                    appointment=appt,
                    dock=dock,
                    rank=rank,
                    labor_label=labor_row["team_name"] if labor_row else None,
                    equipment_label=equip_row["equipment_name"] if equip_row else None,
                    recommendation=rec,
                )
            )

        waiting = [r for r in enriched if r.get("displayStatus") in {"WAITING", "READY_TO_CALL"}]
        avg_wait = round(sum(r["waitingMin"] for r in enriched) / len(enriched)) if enriched else 0
        total_detention = sum(r["detentionCost"] for r in enriched)

        return {
            "entries": enriched,
            "summary": {
                "inQueue": len(enriched),
                "avgWaitMin": avg_wait,
                "totalDetentionCost": total_detention,
                "highPriority": sum(1 for r in enriched if r["priorityScore"] >= 70),
                "readyToCall": sum(1 for r in waiting if r["displayStatus"] == "READY_TO_CALL"),
                "criticalWait": sum(1 for r in enriched if r["queueAging"] == "CRITICAL"),
                "engineNote": "Scores combine appointment priority, wait time, detention exposure, dock availability, and vehicle category.",
            },
        }


async def get_queue_entry_detail(queue_entry_id: str) -> dict[str, Any]:
    from services.resource_gating_service import validate_resource_readiness_for_loading

    entry = await get_queue_entry(queue_entry_id)
    vehicle = await get_vehicle(str(entry["vehicle_id"]))
    appointment = await get_appointment(str(entry["appointment_id"]))
    dock = await get_dock(str(entry["dock_id"])) if entry.get("dock_id") else None
    readiness = await validate_resource_readiness_for_loading(
        str(entry["vehicle_id"]), enforce_queue_dock=False
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        all_entries, _ = await list_queue_entries()
        active = [e for e in all_entries if e["status"] not in {"COMPLETED", "EXITED", "CANCELLED"}]
        active.sort(key=lambda e: (-int(e.get("priority_score") or 0), e.get("created_at") or _now()))
        rank = next((i + 1 for i, e in enumerate(active) if str(e["id"]) == queue_entry_id), 0)
        docks = await conn.fetch("SELECT * FROM docks")
        labor = await conn.fetch("SELECT * FROM labor_teams")
        equipment = await conn.fetch("SELECT * FROM equipment")
        rec = recommend_dock(
            appointment=appointment,
            vehicle=vehicle,
            docks=[dict(d) for d in docks],
            labor_rows=[dict(l) for l in labor],
            equipment_rows=[dict(e) for e in equipment],
            queue_rows=[dict(e) for e in active],
        )
        labor_row = None
        equip_row = None
        if entry.get("dock_id"):
            labor_row = await conn.fetchrow(
                "SELECT * FROM labor_teams WHERE assigned_dock_id = $1::uuid LIMIT 1",
                entry["dock_id"],
            )
            equip_row = await conn.fetchrow(
                "SELECT * FROM equipment WHERE assigned_dock_id = $1::uuid LIMIT 1",
                entry["dock_id"],
            )

    metrics = _enrich_row(
        entry,
        vehicle=vehicle,
        appointment=appointment,
        dock=dock,
        rank=rank,
        labor_label=labor_row["team_name"] if labor_row else readiness.get("teamName"),
        equipment_label=equip_row["equipment_name"] if equip_row else readiness.get("equipmentName"),
        recommendation=rec,
    )
    return {
        "entry": entry,
        "vehicle": vehicle,
        "appointment": appointment,
        "dock": dock,
        "readiness": readiness,
        "metrics": metrics,
        "labor": dict(labor_row) if labor_row else None,
        "equipment": dict(equip_row) if equip_row else None,
        "recommendedDock": rec,
    }


async def override_queue_priority(
    queue_entry_id: str,
    *,
    target_rank: int,
    reason: str,
    supervisor: str,
    created_by: str = "supervisor",
) -> dict[str, Any]:
    if not reason.strip():
        raise HTTPException(status_code=400, detail="Override reason is required")
    if not supervisor.strip():
        raise HTTPException(status_code=400, detail="Supervisor name is required")
    if target_rank < 1:
        raise HTTPException(status_code=400, detail="Target rank must be at least 1")

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            entries, _ = await list_queue_entries()
            active = [e for e in entries if e["status"] not in {"COMPLETED", "EXITED", "CANCELLED"}]
            active.sort(key=lambda e: (-int(e.get("priority_score") or 0), e.get("created_at") or _now()))
            if not any(str(e["id"]) == queue_entry_id for e in active):
                raise HTTPException(status_code=404, detail="Queue entry not in active queue")

            target_idx = min(target_rank - 1, len(active) - 1)
            moved = next(e for e in active if str(e["id"]) == queue_entry_id)
            others = [e for e in active if str(e["id"]) != queue_entry_id]
            others.insert(target_idx, moved)
            old_score = int(moved.get("priority_score") or 0)

            for idx, entry in enumerate(others):
                new_score = max(100 - idx * 5, 5)
                if int(entry.get("priority_score") or 0) != new_score:
                    await update_queue_entry(
                        str(entry["id"]),
                        {"priority_score": new_score},
                        conn=conn,
                    )
                    if str(entry["id"]) == queue_entry_id:
                        await create_yard_event(
                            vehicle_id=str(entry["vehicle_id"]),
                            appointment_id=str(entry["appointment_id"]),
                            queue_entry_id=str(entry["id"]),
                            dock_id=str(entry["dock_id"]) if entry.get("dock_id") else None,
                            event_type="QUEUE_PRIORITY_CHANGED",
                            event_note=f"Priority {old_score} → {new_score} (rank {target_rank})",
                            created_by=created_by,
                            conn=conn,
                        )

            await create_yard_event(
                vehicle_id=str(moved["vehicle_id"]),
                appointment_id=str(moved["appointment_id"]),
                queue_entry_id=queue_entry_id,
                dock_id=str(moved["dock_id"]) if moved.get("dock_id") else None,
                event_type="QUEUE_OVERRIDE",
                event_note=f"Supervisor {supervisor}: {reason.strip()} — moved to rank {target_rank}",
                created_by=created_by,
                conn=conn,
            )

    return await get_queue_entry_detail(queue_entry_id)
