"""Loading operation exceptions — lifecycle + pause/resume with yard_events audit."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from db import get_pool
from services.yms_service import _to_dict, create_yard_event

EXCEPTION_TYPES = frozenset(
    {
        "MATERIAL_SHORTAGE",
        "EQUIPMENT_FAILURE",
        "LABOR_DELAY",
        "DOCUMENTATION_HOLD",
        "SAFETY_HOLD",
        "QUALITY_HOLD",
        "WEATHER_DELAY",
        "GENERIC_DELAY",
    }
)

EXCEPTION_STATUSES = frozenset({"OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"})
ACTIVE_EXCEPTION_STATUSES = frozenset({"OPEN", "IN_PROGRESS"})

CRITICAL_EXCEPTION_TYPES = frozenset({"EQUIPMENT_FAILURE", "SAFETY_HOLD"})

PAUSE_REASONS = frozenset(
    {
        "MATERIAL_SHORTAGE",
        "EQUIPMENT_FAILURE",
        "DOCUMENTATION_HOLD",
        "SAFETY_HOLD",
        "QUALITY_HOLD",
        "WEATHER_DELAY",
        "OTHER",
    }
)

PAUSE_REASON_LABELS = {
    "MATERIAL_SHORTAGE": "Material Shortage",
    "EQUIPMENT_FAILURE": "Equipment Failure",
    "DOCUMENTATION_HOLD": "Documentation Hold",
    "SAFETY_HOLD": "Safety Hold",
    "QUALITY_HOLD": "Quality Hold",
    "WEATHER_DELAY": "Weather Delay",
    "OTHER": "Other",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _coerce_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _minutes_since(start: Any, *, now: datetime | None = None) -> int:
    start_dt = _coerce_datetime(start)
    if not start_dt:
        return 0
    end = now or _now()
    return max(0, int((end - start_dt).total_seconds() // 60))


def _audit_note(**fields: Any) -> str:
    return json.dumps({k: v for k, v in fields.items() if v is not None})


async def _emit_audit_event(
    *,
    event_type: str,
    vehicle_id: str | None,
    appointment_id: str | None,
    queue_entry_id: str | None,
    dock_id: str | None,
    created_by: str,
    note: str,
    conn: Any | None = None,
) -> None:
    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=appointment_id,
        queue_entry_id=queue_entry_id,
        dock_id=dock_id,
        event_type=event_type,
        event_note=note,
        created_by=created_by,
        conn=conn,
    )


async def list_loading_exceptions(
    *,
    status: str | None = None,
    vehicle_id: str | None = None,
    queue_entry_id: str | None = None,
    active_only: bool = False,
    limit: int = 500,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    idx = 1

    if active_only:
        clauses.append(f"status = ANY(${idx}::text[])")
        params.append(list(ACTIVE_EXCEPTION_STATUSES))
        idx += 1
    elif status:
        if status not in EXCEPTION_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status '{status}'")
        clauses.append(f"status = ${idx}")
        params.append(status)
        idx += 1

    if vehicle_id:
        clauses.append(f"vehicle_id = ${idx}::uuid")
        params.append(vehicle_id)
        idx += 1

    if queue_entry_id:
        clauses.append(f"queue_entry_id = ${idx}::uuid")
        params.append(queue_entry_id)
        idx += 1

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    params.append(limit)
    pool = get_pool()
    rows = await pool.fetch(
        f"""
        SELECT * FROM loading_operation_exceptions
        {where}
        ORDER BY created_at DESC
        LIMIT ${idx}
        """,
        *params,
    )
    return [_to_dict(r) for r in rows]


async def get_loading_exception(exception_id: str) -> dict[str, Any]:
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT * FROM loading_operation_exceptions WHERE id = $1::uuid",
        exception_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Exception not found")
    return _to_dict(row)


async def create_loading_exception(
    *,
    vehicle_id: str | None,
    appointment_id: str | None,
    queue_entry_id: str | None,
    dock_id: str | None,
    exception_type: str,
    description: str | None,
    created_by: str,
) -> dict[str, Any]:
    if exception_type not in EXCEPTION_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid exception_type '{exception_type}'")

    exception_id = str(uuid.uuid4())
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """
                INSERT INTO loading_operation_exceptions (
                    id, vehicle_id, appointment_id, queue_entry_id, dock_id,
                    exception_type, status, description, created_by, created_at, updated_at
                )
                VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, 'OPEN', $7, $8, NOW(), NOW())
                RETURNING *
                """,
                exception_id,
                vehicle_id,
                appointment_id,
                queue_entry_id,
                dock_id,
                exception_type,
                description,
                created_by,
            )
            await _emit_audit_event(
                event_type="EXCEPTION_CREATED",
                vehicle_id=vehicle_id,
                appointment_id=appointment_id,
                queue_entry_id=queue_entry_id,
                dock_id=dock_id,
                created_by=created_by,
                note=_audit_note(
                    exception_id=exception_id,
                    exception_type=exception_type,
                    description=description,
                ),
                conn=conn,
            )
    return _to_dict(row)


async def assign_loading_exception(
    exception_id: str,
    *,
    assigned_to: str,
    created_by: str,
) -> dict[str, Any]:
    if not assigned_to or not assigned_to.strip():
        raise HTTPException(status_code=400, detail="assigned_to is required")

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await conn.fetchrow(
                "SELECT * FROM loading_operation_exceptions WHERE id = $1::uuid FOR UPDATE",
                exception_id,
            )
            if not current:
                raise HTTPException(status_code=404, detail="Exception not found")
            if current["status"] != "OPEN":
                raise HTTPException(status_code=409, detail="Only OPEN exceptions can be assigned")

            row = await conn.fetchrow(
                """
                UPDATE loading_operation_exceptions
                SET status = 'IN_PROGRESS', assigned_to = $2, updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                exception_id,
                assigned_to.strip(),
            )
            await _emit_audit_event(
                event_type="EXCEPTION_ASSIGNED",
                vehicle_id=str(current["vehicle_id"]) if current["vehicle_id"] else None,
                appointment_id=str(current["appointment_id"]) if current["appointment_id"] else None,
                queue_entry_id=str(current["queue_entry_id"]) if current["queue_entry_id"] else None,
                dock_id=str(current["dock_id"]) if current["dock_id"] else None,
                created_by=created_by,
                note=_audit_note(
                    exception_id=exception_id,
                    exception_type=current["exception_type"],
                    assigned_to=assigned_to.strip(),
                ),
                conn=conn,
            )
    return _to_dict(row)


async def resolve_loading_exception(
    exception_id: str,
    *,
    resolved_by: str,
    resolution_notes: str | None,
    created_by: str,
) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await conn.fetchrow(
                "SELECT * FROM loading_operation_exceptions WHERE id = $1::uuid FOR UPDATE",
                exception_id,
            )
            if not current:
                raise HTTPException(status_code=404, detail="Exception not found")
            if current["status"] not in {"OPEN", "IN_PROGRESS"}:
                raise HTTPException(status_code=409, detail="Exception cannot be resolved from current status")

            row = await conn.fetchrow(
                """
                UPDATE loading_operation_exceptions
                SET status = 'RESOLVED',
                    resolved_at = NOW(),
                    resolved_by = $2,
                    resolution_notes = $3,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                exception_id,
                resolved_by,
                resolution_notes,
            )
            await _emit_audit_event(
                event_type="EXCEPTION_RESOLVED",
                vehicle_id=str(current["vehicle_id"]) if current["vehicle_id"] else None,
                appointment_id=str(current["appointment_id"]) if current["appointment_id"] else None,
                queue_entry_id=str(current["queue_entry_id"]) if current["queue_entry_id"] else None,
                dock_id=str(current["dock_id"]) if current["dock_id"] else None,
                created_by=created_by,
                note=_audit_note(
                    exception_id=exception_id,
                    exception_type=current["exception_type"],
                    resolved_by=resolved_by,
                    resolution_notes=resolution_notes,
                ),
                conn=conn,
            )
    return _to_dict(row)


async def close_loading_exception(
    exception_id: str,
    *,
    closed_by: str,
    created_by: str,
) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await conn.fetchrow(
                "SELECT * FROM loading_operation_exceptions WHERE id = $1::uuid FOR UPDATE",
                exception_id,
            )
            if not current:
                raise HTTPException(status_code=404, detail="Exception not found")
            if current["status"] != "RESOLVED":
                raise HTTPException(status_code=409, detail="Only RESOLVED exceptions can be closed")

            row = await conn.fetchrow(
                """
                UPDATE loading_operation_exceptions
                SET status = 'CLOSED',
                    closed_at = NOW(),
                    closed_by = $2,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                exception_id,
                closed_by,
            )
            await _emit_audit_event(
                event_type="EXCEPTION_CLOSED",
                vehicle_id=str(current["vehicle_id"]) if current["vehicle_id"] else None,
                appointment_id=str(current["appointment_id"]) if current["appointment_id"] else None,
                queue_entry_id=str(current["queue_entry_id"]) if current["queue_entry_id"] else None,
                dock_id=str(current["dock_id"]) if current["dock_id"] else None,
                created_by=created_by,
                note=_audit_note(
                    exception_id=exception_id,
                    exception_type=current["exception_type"],
                    closed_by=closed_by,
                ),
                conn=conn,
            )
    return _to_dict(row)


def _filter_loading_events(
    events: list[dict[str, Any]],
    *,
    vehicle_id: str | None,
    queue_entry_id: str | None,
) -> list[dict[str, Any]]:
    rows = []
    for event in events:
        if vehicle_id and str(event.get("vehicle_id") or "") == str(vehicle_id):
            rows.append(event)
            continue
        if queue_entry_id and str(event.get("queue_entry_id") or "") == str(queue_entry_id):
            rows.append(event)
    rows.sort(key=lambda e: _coerce_datetime(e.get("event_time")) or datetime.min.replace(tzinfo=timezone.utc))
    return rows


def compute_pause_state(
    events: list[dict[str, Any]],
    *,
    vehicle_id: str | None,
    queue_entry_id: str | None,
    now: datetime | None = None,
) -> dict[str, Any]:
    now = now or _now()
    relevant = [
        e
        for e in _filter_loading_events(events, vehicle_id=vehicle_id, queue_entry_id=queue_entry_id)
        if e.get("event_type") in {"LOADING_PAUSED", "LOADING_RESUMED"}
    ]

    intervals: list[dict[str, Any]] = []
    open_pause: dict[str, Any] | None = None
    total_paused_min = 0

    for event in relevant:
        if event["event_type"] == "LOADING_PAUSED":
            open_pause = event
        elif event["event_type"] == "LOADING_RESUMED" and open_pause:
            start = _coerce_datetime(open_pause["event_time"])
            end = _coerce_datetime(event["event_time"])
            if start and end:
                minutes = max(0, int((end - start).total_seconds() // 60))
                total_paused_min += minutes
                intervals.append(
                    {
                        "started_at": open_pause["event_time"],
                        "resumed_at": event["event_time"],
                        "reason": open_pause.get("event_note"),
                        "duration_min": minutes,
                    }
                )
            open_pause = None

    paused = open_pause is not None
    current_pause_min = 0
    if paused and open_pause:
        current_pause_min = _minutes_since(open_pause.get("event_time"), now=now)
        total_paused_min += current_pause_min

    return {
        "paused": paused,
        "paused_since": open_pause.get("event_time") if open_pause else None,
        "pause_reason": open_pause.get("event_note") if open_pause else None,
        "paused_duration_min": current_pause_min,
        "total_paused_min": total_paused_min,
        "intervals": intervals,
    }


async def pause_loading_operation(
    *,
    vehicle_id: str | None,
    appointment_id: str | None,
    queue_entry_id: str | None,
    dock_id: str | None,
    reason_code: str,
    note: str | None,
    created_by: str,
) -> dict[str, Any]:
    if reason_code not in PAUSE_REASONS:
        raise HTTPException(status_code=400, detail=f"Invalid pause reason '{reason_code}'")

    label = PAUSE_REASON_LABELS.get(reason_code, reason_code)
    event_note = note.strip() if note and note.strip() else label

    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=appointment_id,
        queue_entry_id=queue_entry_id,
        dock_id=dock_id,
        event_type="LOADING_PAUSED",
        event_note=event_note,
        created_by=created_by,
    )

    return {
        "paused": True,
        "pause_reason": event_note,
        "reason_code": reason_code,
        "paused_since": _now().isoformat(),
    }


async def resume_loading_operation(
    *,
    vehicle_id: str | None,
    appointment_id: str | None,
    queue_entry_id: str | None,
    dock_id: str | None,
    events: list[dict[str, Any]],
    created_by: str,
) -> dict[str, Any]:
    pause_state = compute_pause_state(
        events,
        vehicle_id=vehicle_id,
        queue_entry_id=queue_entry_id,
    )
    if not pause_state["paused"]:
        raise HTTPException(status_code=409, detail="No active pause to resume")

    total_after = pause_state["total_paused_min"]
    event_note = f"Operation resumed · total paused {total_after} min"

    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=appointment_id,
        queue_entry_id=queue_entry_id,
        dock_id=dock_id,
        event_type="LOADING_RESUMED",
        event_note=event_note,
        created_by=created_by,
    )

    return {
        "paused": False,
        "total_paused_min": total_after,
        "resume_time": _now().isoformat(),
    }


def exception_severity(exception_type: str) -> str:
    if exception_type in CRITICAL_EXCEPTION_TYPES:
        return "CRITICAL"
    return "WARNING"
