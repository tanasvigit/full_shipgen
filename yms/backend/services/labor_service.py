import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from db import get_pool
from enums import LABOR_MATERIAL_TYPES, LABOR_STATUSES, LABOR_STATUS_TRANSITIONS
from services.yms_service import _to_dict, create_yard_event


def _validate_labor_status(status: str) -> None:
    if status not in LABOR_STATUSES:
        raise HTTPException(status_code=400, detail=f"Unsupported labor status '{status}'")


def _validate_material_type(material_type: str) -> None:
    if material_type not in LABOR_MATERIAL_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported material type '{material_type}'")


def _resolve_material_type(row: dict[str, Any]) -> str:
    return row.get("material_type") or row.get("team_type") or "GENERAL"


async def _generate_team_code(conn: Any) -> str:
    max_num = await conn.fetchval(
        """
        SELECT COALESCE(MAX(
            CASE WHEN team_code ~ '^LT[0-9]+$'
            THEN CAST(SUBSTRING(team_code FROM 3) AS INTEGER)
            ELSE 0 END
        ), 0)
        FROM labor_teams
        """
    )
    for n in range(int(max_num) + 1, int(max_num) + 200):
        code = f"LT{n:03d}"
        taken = await conn.fetchval("SELECT 1 FROM labor_teams WHERE team_code = $1", code)
        if not taken:
            return code
    raise HTTPException(status_code=500, detail="Could not generate team code")


def _validate_assignment_conflict(
    current: dict[str, Any],
    *,
    dock_id: str | None,
    vehicle_id: str | None,
) -> None:
    """Prevent simultaneous assignment to multiple docks or vehicles."""
    cur_dock = str(current["assigned_dock_id"]) if current.get("assigned_dock_id") else None
    cur_vehicle = str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None

    if dock_id and cur_dock and dock_id != cur_dock:
        raise HTTPException(
            status_code=409,
            detail=f"Team already assigned to dock {current.get('current_assignment') or cur_dock}. Release before reassigning.",
        )
    if vehicle_id and cur_vehicle and vehicle_id != cur_vehicle:
        raise HTTPException(
            status_code=409,
            detail="Team already assigned to another vehicle. Release before reassigning.",
        )


def _validate_labor_transition(current: str, next_status: str) -> None:
    allowed = LABOR_STATUS_TRANSITIONS.get(current, set())
    if next_status not in allowed and next_status != current:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid labor status transition from '{current}' to '{next_status}'",
        )


def _sync_counts(members: int, assigned: int) -> tuple[int, int]:
    assigned = max(0, min(members, assigned))
    available = max(0, members - assigned)
    return assigned, available


async def _get_labor_row(labor_id: str, conn: Any | None = None) -> dict[str, Any]:
    db = conn if conn is not None else get_pool()
    row = await db.fetchrow("SELECT * FROM labor_teams WHERE id = $1::uuid", labor_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Labor team not found")
    return _to_dict(row)


async def _log_labor_event(
    *,
    labor_id: str,
    event_type: str,
    event_note: str | None,
    created_by: str,
    dock_id: str | None = None,
    vehicle_id: str | None = None,
    conn: Any,
) -> None:
    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=None,
        queue_entry_id=None,
        dock_id=dock_id,
        equipment_id=None,
        labor_id=labor_id,
        event_type=event_type,
        event_note=event_note,
        created_by=created_by,
        conn=conn,
    )


def _status_event_type(_old_status: str, _new_status: str) -> str:
    return "TEAM_STATUS_CHANGED"


async def create_labor_team(payload: dict[str, Any]) -> dict[str, Any]:
    status = payload.get("status", "ON_DUTY")
    _validate_labor_status(status)
    material_type = payload.get("material_type", "GENERAL")
    _validate_material_type(material_type)
    members = payload["members_count"]
    assigned, available = _sync_counts(members, 0)
    if status in {"ON_DUTY", "AVAILABLE"}:
        available = members

    pool = get_pool()
    labor_id = str(uuid.uuid4())
    async with pool.acquire() as conn:
        async with conn.transaction():
            team_code = await _generate_team_code(conn)
            try:
                row = await conn.fetchrow(
                    """
                    INSERT INTO labor_teams (
                        id, team_code, team_name, shift_start, shift_end,
                        members_count, available_count, assigned_count, status,
                        supervisor_name, supervisor_phone, team_type, material_type, skills,
                        current_assignment, current_location,
                        assigned_dock_id, assigned_vehicle_id, assigned_queue_entry_id,
                        assigned_since, notes
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, '{}',
                        $14, $15, $16::uuid, $17::uuid, $18::uuid, $19, $20
                    )
                    RETURNING *
                    """,
                    labor_id,
                    team_code,
                    payload["team_name"].strip(),
                    payload["shift_start"],
                    payload["shift_end"],
                    members,
                    available,
                    assigned,
                    status,
                    payload.get("supervisor_name"),
                    payload.get("supervisor_phone"),
                    material_type,
                    material_type,
                    payload.get("current_assignment") or "—",
                    payload.get("current_location") or "—",
                    payload.get("assigned_dock_id"),
                    payload.get("assigned_vehicle_id"),
                    payload.get("assigned_queue_entry_id"),
                    None,
                    payload.get("notes"),
                )
            except Exception as exc:
                if "labor_teams_team_code_key" in str(exc):
                    raise HTTPException(status_code=409, detail="Team code already exists") from exc
                raise
            await _log_labor_event(
                labor_id=labor_id,
                event_type="TEAM_CREATED",
                event_note=payload.get("notes") or f"Team {team_code} · {payload['team_name']} created",
                created_by=payload.get("created_by", "labor-api"),
                conn=conn,
            )
    return _to_dict(row)


async def list_labor_teams(
    *,
    q: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int | None = None,
) -> tuple[list[dict[str, Any]], int]:
    from services.list_filters import query_rows

    eq = {}
    if status:
        eq["status"] = status
    return await query_rows(
        "labor_teams",
        "team_code ASC",
        search_columns=[
            "team_code",
            "team_name",
            "shift_start",
            "shift_end",
            "status",
            "material_type",
            "team_type",
            "supervisor_name",
        ],
        q=q,
        eq_filters=eq,
        skip=skip,
        limit=limit,
    )


async def get_labor_team(labor_id: str) -> dict[str, Any]:
    return await _get_labor_row(labor_id)


async def update_labor_team(labor_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_labor_row(labor_id, conn)
            if "status" in payload and payload["status"] is not None:
                _validate_labor_status(payload["status"])
                _validate_labor_transition(current["status"], payload["status"])
            material_type = payload.get("material_type")
            if material_type is not None:
                _validate_material_type(material_type)
            merged = {**current, **payload}
            members = merged.get("members_count", current["members_count"])
            assigned = merged.get("assigned_count", current["assigned_count"])
            available = merged.get("available_count", current["available_count"])
            assigned, available = _sync_counts(members, assigned)
            mat = _resolve_material_type(merged)
            row = await conn.fetchrow(
                """
                UPDATE labor_teams SET
                    team_name = $2,
                    shift_start = $3,
                    shift_end = $4,
                    members_count = $5,
                    available_count = $6,
                    assigned_count = $7,
                    status = $8,
                    supervisor_name = $9,
                    supervisor_phone = $10,
                    team_type = $11,
                    material_type = $11,
                    current_assignment = $12,
                    current_location = $13,
                    assigned_dock_id = $14::uuid,
                    assigned_vehicle_id = $15::uuid,
                    assigned_queue_entry_id = $16::uuid,
                    notes = $17,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                labor_id,
                merged.get("team_name", current["team_name"]),
                merged.get("shift_start", current["shift_start"]),
                merged.get("shift_end", current["shift_end"]),
                members,
                available,
                assigned,
                merged.get("status", current["status"]),
                merged.get("supervisor_name", current.get("supervisor_name")),
                merged.get("supervisor_phone", current.get("supervisor_phone")),
                mat,
                merged.get("current_assignment", current["current_assignment"]),
                merged.get("current_location", current["current_location"]),
                merged.get("assigned_dock_id", current["assigned_dock_id"]),
                merged.get("assigned_vehicle_id", current["assigned_vehicle_id"]),
                merged.get("assigned_queue_entry_id", current.get("assigned_queue_entry_id")),
                merged.get("notes", current["notes"]),
            )
            await _log_labor_event(
                labor_id=labor_id,
                event_type="TEAM_UPDATED",
                event_note=payload.get("event_note") or f"Team {current['team_code']} updated",
                created_by=payload.get("created_by", "labor-ui"),
                conn=conn,
            )
            new_status = merged.get("status", current["status"])
            if new_status != current["status"]:
                await _log_labor_event(
                    labor_id=labor_id,
                    event_type="TEAM_STATUS_CHANGED",
                    event_note=f"Status {current['status']} → {new_status}",
                    created_by=payload.get("created_by", "labor-ui"),
                    conn=conn,
                )
    return _to_dict(row)


async def update_labor_status(
    labor_id: str,
    status: str,
    *,
    event_note: str | None = None,
    created_by: str = "labor-ui",
) -> dict[str, Any]:
    _validate_labor_status(status)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_labor_row(labor_id, conn)
            old_status = current["status"]
            _validate_labor_transition(old_status, status)

            members = current["members_count"]
            assigned = current["assigned_count"]
            available = current["available_count"]
            if status == "OFF_DUTY":
                assigned, available = 0, 0
            elif status == "ON_DUTY" and old_status == "OFF_DUTY":
                assigned, available = 0, members
            elif status == "AVAILABLE":
                assigned, available = 0, members
            elif status == "BREAK":
                pass
            elif status == "UNAVAILABLE":
                assigned, available = 0, 0

            row = await conn.fetchrow(
                """
                UPDATE labor_teams SET
                    status = $2,
                    available_count = $3,
                    assigned_count = $4,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                labor_id,
                status,
                available,
                assigned,
            )
            await _log_labor_event(
                labor_id=labor_id,
                event_type=_status_event_type(old_status, status),
                event_note=event_note or f"Status {old_status} → {status}",
                created_by=created_by,
                dock_id=str(current["assigned_dock_id"]) if current.get("assigned_dock_id") else None,
                vehicle_id=str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None,
                conn=conn,
            )
    return _to_dict(row)


async def delete_labor_team(labor_id: str, *, created_by: str = "labor-ui") -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_labor_row(labor_id, conn)
            if current.get("assigned_dock_id") or current.get("assigned_vehicle_id"):
                raise HTTPException(
                    status_code=409,
                    detail="Cannot delete a team that is currently assigned.",
                )
            await _log_labor_event(
                labor_id=labor_id,
                event_type="TEAM_DELETED",
                event_note=f"Team {current['team_code']} deleted",
                created_by=created_by,
                conn=conn,
            )
            result = await conn.execute("DELETE FROM labor_teams WHERE id = $1::uuid", labor_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Labor team not found")


async def assign_labor_team(labor_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    dock_id = payload.get("dock_id")
    vehicle_id = payload.get("vehicle_id")
    queue_entry_id = payload.get("queue_entry_id")
    appointment_id = payload.get("appointment_id")
    if not dock_id and not vehicle_id and not queue_entry_id:
        raise HTTPException(status_code=400, detail="dock_id, vehicle_id, or queue_entry_id required for assignment")

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            if dock_id:
                from services.dock_resource_service import (
                    enrich_assignment_from_dock,
                    validate_cross_active_dock_assignment,
                )

                payload = await enrich_assignment_from_dock(dock_id, payload, conn)
                dock_id = payload.get("dock_id")
                vehicle_id = payload.get("vehicle_id")
                queue_entry_id = payload.get("queue_entry_id")
                appointment_id = payload.get("appointment_id") or appointment_id

            current = await _get_labor_row(labor_id, conn)
            if current["status"] in {"OFF_DUTY", "UNAVAILABLE", "BREAK"}:
                raise HTTPException(status_code=409, detail=f"Cannot assign team in {current['status']} status")

            if dock_id:
                await validate_cross_active_dock_assignment(
                    current,
                    target_dock_id=dock_id,
                    conn=conn,
                    resource_label="Labor team",
                )
            _validate_assignment_conflict(current, dock_id=dock_id, vehicle_id=vehicle_id)

            dock = None
            vehicle = None
            queue_entry = None
            if dock_id:
                dock = await conn.fetchrow("SELECT * FROM docks WHERE id = $1::uuid", dock_id)
                if dock is None:
                    raise HTTPException(status_code=404, detail="Dock not found")
                await conn.execute(
                    """
                    UPDATE labor_teams SET
                        assigned_dock_id = NULL,
                        assigned_vehicle_id = NULL,
                        assigned_queue_entry_id = NULL,
                        assigned_appointment_id = NULL,
                        assigned_since = NULL,
                        status = 'AVAILABLE',
                        current_assignment = '—',
                        assigned_count = 0,
                        available_count = members_count,
                        updated_at = NOW()
                    WHERE assigned_dock_id = $1::uuid AND id != $2::uuid
                    """,
                    dock_id,
                    labor_id,
                )
            if vehicle_id:
                vehicle = await conn.fetchrow("SELECT * FROM vehicles WHERE id = $1::uuid", vehicle_id)
                if vehicle is None:
                    raise HTTPException(status_code=404, detail="Vehicle not found")
                other = await conn.fetchrow(
                    """
                    SELECT id, team_code FROM labor_teams
                    WHERE assigned_vehicle_id = $1::uuid AND id != $2::uuid AND status = 'ASSIGNED'
                    LIMIT 1
                    """,
                    vehicle_id,
                    labor_id,
                )
                if other:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Vehicle already has labor team {other['team_code']} assigned",
                    )
            if queue_entry_id:
                queue_entry = await conn.fetchrow(
                    "SELECT * FROM queue_entries WHERE id = $1::uuid", queue_entry_id
                )
                if queue_entry is None:
                    raise HTTPException(status_code=404, detail="Queue entry not found")
                if not dock_id and queue_entry.get("dock_id"):
                    dock_id = str(queue_entry["dock_id"])
                if not vehicle_id and queue_entry.get("vehicle_id"):
                    vehicle_id = str(queue_entry["vehicle_id"])
                if not appointment_id and queue_entry.get("appointment_id"):
                    appointment_id = str(queue_entry["appointment_id"])

            members = current["members_count"]
            workers = payload.get("workers_assigned") or max(1, min(members, 2))
            workers = max(1, min(members, workers))
            assigned, available = workers, members - workers

            assignment_label = payload.get("current_assignment")
            if not assignment_label:
                if dock:
                    assignment_label = f"Dock {dock['dock_code']}"
                elif vehicle:
                    assignment_label = f"Vehicle {vehicle['vehicle_number']}"
                elif queue_entry:
                    assignment_label = f"Queue {queue_entry['queue_number']}"
            location = payload.get("current_location") or (
                f"Dock {dock['dock_code']}" if dock else current.get("current_location")
            )

            _validate_labor_transition(current["status"], "ASSIGNED")
            now = datetime.now(timezone.utc)
            row = await conn.fetchrow(
                """
                UPDATE labor_teams SET
                    assigned_dock_id = COALESCE($2::uuid, assigned_dock_id),
                    assigned_vehicle_id = COALESCE($3::uuid, assigned_vehicle_id),
                    assigned_queue_entry_id = COALESCE($4::uuid, assigned_queue_entry_id),
                    assigned_appointment_id = COALESCE($5::uuid, assigned_appointment_id),
                    current_assignment = $6,
                    current_location = $7,
                    status = 'ASSIGNED',
                    assigned_count = $8,
                    available_count = $9,
                    assigned_since = $10,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                labor_id,
                dock_id,
                vehicle_id,
                queue_entry_id,
                appointment_id,
                assignment_label,
                location,
                assigned,
                available,
                now,
            )
            note_parts = []
            if dock:
                note_parts.append(f"dock {dock['dock_code']}")
            if vehicle:
                note_parts.append(f"vehicle {vehicle['vehicle_number']}")
            if queue_entry:
                note_parts.append(f"queue {queue_entry['queue_number']}")
            await _log_labor_event(
                labor_id=labor_id,
                event_type="TEAM_ASSIGNED",
                event_note=payload.get("event_note") or f"Assigned to {' · '.join(note_parts)}",
                created_by=payload.get("created_by", "labor-ui"),
                dock_id=dock_id,
                vehicle_id=vehicle_id,
                conn=conn,
            )
            from services.resource_gating_service import sync_readiness_after_resource_change

            await sync_readiness_after_resource_change(
                vehicle_id=str(vehicle_id) if vehicle_id else None,
                dock_id=str(dock_id) if dock_id else None,
                conn=conn,
                created_by=payload.get("created_by", "labor-ui"),
            )
    result = _to_dict(row)
    resolved_vehicle_id = str(vehicle_id) if vehicle_id else None
    if not resolved_vehicle_id and dock_id:
        from services.resource_gating_service import _resolve_vehicle_at_dock, sync_vehicle_readiness_status

        resolved_vehicle_id = await _resolve_vehicle_at_dock(str(dock_id))
    if resolved_vehicle_id:
        import logging

        try:
            await sync_vehicle_readiness_status(
                resolved_vehicle_id, created_by=payload.get("created_by", "labor-ui")
            )
        except Exception:
            logging.getLogger(__name__).exception(
                "Post-commit readiness sync failed for vehicle %s after labor assign",
                resolved_vehicle_id,
            )
    return result


async def release_labor_team(
    labor_id: str,
    *,
    created_by: str = "labor-ui",
    event_note: str | None = None,
    conn: Any | None = None,
) -> dict[str, Any]:
    async def _run(connection: Any) -> dict[str, Any]:
        current = await _get_labor_row(labor_id, connection)
        dock_id = str(current["assigned_dock_id"]) if current.get("assigned_dock_id") else None
        vehicle_id = str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None
        members = current["members_count"]
        if current["status"] == "OFF_DUTY":
            status = "OFF_DUTY"
            available = 0
        else:
            status = "AVAILABLE"
            available = members
        row = await connection.fetchrow(
            """
            UPDATE labor_teams SET
                assigned_dock_id = NULL,
                assigned_vehicle_id = NULL,
                assigned_queue_entry_id = NULL,
                assigned_appointment_id = NULL,
                assigned_since = NULL,
                current_assignment = '—',
                status = $2,
                assigned_count = 0,
                available_count = $3,
                updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING *
            """,
            labor_id,
            status,
            available,
        )
        await _log_labor_event(
            labor_id=labor_id,
            event_type="TEAM_RELEASED",
            event_note=event_note or f"Team {current['team_code']} released",
            created_by=created_by,
            dock_id=dock_id,
            vehicle_id=vehicle_id,
            conn=connection,
        )
        from services.resource_gating_service import sync_readiness_after_resource_change

        await sync_readiness_after_resource_change(
            vehicle_id=vehicle_id,
            dock_id=dock_id,
            conn=connection,
            created_by=created_by,
        )
        return _to_dict(row)

    if conn is not None:
        return await _run(conn)

    pool = get_pool()
    async with pool.acquire() as acquired:
        async with acquired.transaction():
            return await _run(acquired)


async def mark_labor_on_duty(labor_id: str, *, created_by: str = "labor-ui") -> dict[str, Any]:
    current = await _get_labor_row(labor_id)
    return await update_labor_status(
        labor_id,
        "ON_DUTY",
        event_note=f"Team {current['team_code']} on duty",
        created_by=created_by,
    )


async def mark_labor_off_duty(labor_id: str, *, created_by: str = "labor-ui") -> dict[str, Any]:
    from services.resource_gating_service import sync_readiness_after_resource_change

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_labor_row(labor_id, conn)
            released_vehicle_id = (
                str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None
            )
            row = await conn.fetchrow(
                """
                UPDATE labor_teams SET
                    status = 'OFF_DUTY',
                    assigned_dock_id = NULL,
                    assigned_vehicle_id = NULL,
                    assigned_queue_entry_id = NULL,
                    assigned_since = NULL,
                    current_assignment = '—',
                    assigned_count = 0,
                    available_count = 0,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                labor_id,
            )
            await _log_labor_event(
                labor_id=labor_id,
                event_type="TEAM_STATUS_CHANGED",
                event_note=f"Team {current['team_code']} off duty",
                created_by=created_by,
                conn=conn,
            )
            if released_vehicle_id:
                await sync_readiness_after_resource_change(
                    vehicle_id=released_vehicle_id,
                    conn=conn,
                    created_by=created_by,
                )
    return _to_dict(row)


async def mark_labor_break(labor_id: str, *, created_by: str = "labor-ui") -> dict[str, Any]:
    current = await _get_labor_row(labor_id)
    return await update_labor_status(
        labor_id,
        "BREAK",
        event_note=f"Team {current['team_code']} on break",
        created_by=created_by,
    )


async def end_labor_break(labor_id: str, *, created_by: str = "labor-ui") -> dict[str, Any]:
    current = await _get_labor_row(labor_id)
    next_status = "ASSIGNED" if current.get("assigned_dock_id") else "ON_DUTY"
    return await update_labor_status(
        labor_id,
        next_status,
        event_note=f"Team {current['team_code']} break ended",
        created_by=created_by,
    )


async def mark_labor_unavailable(labor_id: str, *, created_by: str = "labor-ui", event_note: str | None = None) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_labor_row(labor_id, conn)
            _validate_labor_transition(current["status"], "UNAVAILABLE")
            row = await conn.fetchrow(
                """
                UPDATE labor_teams SET
                    status = 'UNAVAILABLE',
                    assigned_dock_id = NULL,
                    assigned_vehicle_id = NULL,
                    assigned_queue_entry_id = NULL,
                    assigned_since = NULL,
                    current_assignment = '—',
                    assigned_count = 0,
                    available_count = 0,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                labor_id,
            )
            await _log_labor_event(
                labor_id=labor_id,
                event_type="TEAM_STATUS_CHANGED",
                event_note=event_note or f"Team {current['team_code']} unavailable",
                created_by=created_by,
                conn=conn,
            )
    return _to_dict(row)


async def check_labor_readiness(vehicle_id: str, conn: Any | None = None) -> dict[str, Any]:
    """
    Resource gating foundation — whether a labor team is assigned for loading readiness.
    Checks direct vehicle assignment and dock assignment via active queue entry.
    """
    from enums import ACTIVE_DOCK_QUEUE_STATUSES

    db = conn if conn is not None else get_pool()
    active_queue_sql = "', '".join(ACTIVE_DOCK_QUEUE_STATUSES)
    vehicle_exists = await db.fetchval(
        "SELECT 1 FROM vehicles WHERE id = $1::uuid", vehicle_id
    )
    if not vehicle_exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    row = await db.fetchrow(
        """
        SELECT id, team_name, team_code
        FROM labor_teams
        WHERE assigned_vehicle_id = $1::uuid AND status = 'ASSIGNED'
        LIMIT 1
        """,
        vehicle_id,
    )
    if row:
        return {
            "laborAssigned": True,
            "teamId": str(row["id"]),
            "teamName": row["team_name"],
            "teamCode": row["team_code"],
        }

    row = await db.fetchrow(
        f"""
        SELECT lt.id, lt.team_name, lt.team_code
        FROM labor_teams lt
        INNER JOIN queue_entries qe ON qe.dock_id = lt.assigned_dock_id
        WHERE qe.vehicle_id = $1::uuid
          AND lt.status = 'ASSIGNED'
          AND lt.assigned_dock_id IS NOT NULL
          AND qe.status IN ('{active_queue_sql}')
        ORDER BY qe.dock_assigned_time DESC NULLS LAST
        LIMIT 1
        """,
        vehicle_id,
    )
    if row:
        return {
            "laborAssigned": True,
            "teamId": str(row["id"]),
            "teamName": row["team_name"],
            "teamCode": row["team_code"],
        }

    return {"laborAssigned": False}
