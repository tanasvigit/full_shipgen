import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from db import get_pool
from enums import (
    EQUIPMENT_MIN_ASSIGN_BATTERY,
    EQUIPMENT_STATUSES,
    EQUIPMENT_STATUS_TRANSITIONS,
    EQUIPMENT_TYPES,
)
from services.yms_service import _to_dict, create_yard_event


def _validate_equipment_status(status: str) -> None:
    if status not in EQUIPMENT_STATUSES:
        raise HTTPException(status_code=400, detail=f"Unsupported equipment status '{status}'")


def _validate_equipment_type(equipment_type: str) -> None:
    if equipment_type not in EQUIPMENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported equipment type '{equipment_type}'")


def _validate_equipment_transition(current: str, next_status: str) -> None:
    allowed = EQUIPMENT_STATUS_TRANSITIONS.get(current, set())
    if next_status not in allowed and next_status != current:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid equipment status transition from '{current}' to '{next_status}'",
        )


def _check_battery_for_assign(battery_level: int | None) -> None:
    if battery_level is not None and battery_level < EQUIPMENT_MIN_ASSIGN_BATTERY:
        raise HTTPException(
            status_code=409,
            detail=f"Battery too low ({battery_level}%). Minimum {EQUIPMENT_MIN_ASSIGN_BATTERY}% required to assign.",
        )


def _validate_assignment_conflict(
    current: dict[str, Any],
    *,
    dock_id: str | None,
    vehicle_id: str | None,
) -> None:
    cur_dock = str(current["assigned_dock_id"]) if current.get("assigned_dock_id") else None
    cur_vehicle = str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None
    if dock_id and cur_dock and dock_id != cur_dock:
        raise HTTPException(
            status_code=409,
            detail="Equipment already assigned to another dock. Release before reassigning.",
        )
    if vehicle_id and cur_vehicle and vehicle_id != cur_vehicle:
        raise HTTPException(
            status_code=409,
            detail="Equipment already assigned to another vehicle. Release before reassigning.",
        )


async def _generate_equipment_code(conn: Any) -> str:
    max_num = await conn.fetchval(
        """
        SELECT COALESCE(MAX(
            CASE WHEN equipment_code ~ '^EQ-[0-9]+$'
            THEN CAST(SUBSTRING(equipment_code FROM 4) AS INTEGER)
            ELSE 0 END
        ), 0)
        FROM equipment
        """
    )
    for n in range(int(max_num) + 1, int(max_num) + 200):
        code = f"EQ-{n:03d}"
        taken = await conn.fetchval("SELECT 1 FROM equipment WHERE equipment_code = $1", code)
        if not taken:
            return code
    raise HTTPException(status_code=500, detail="Could not generate equipment code")


async def _get_equipment_row(equipment_id: str, conn: Any | None = None) -> dict[str, Any]:
    db = conn if conn is not None else get_pool()
    row = await db.fetchrow("SELECT * FROM equipment WHERE id = $1::uuid", equipment_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return _to_dict(row)


async def _log_equipment_event(
    *,
    equipment_id: str,
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
        equipment_id=equipment_id,
        event_type=event_type,
        event_note=event_note,
        created_by=created_by,
        conn=conn,
    )


def _status_event_type(_old_status: str, _new_status: str) -> str:
    return "EQUIPMENT_STATUS_CHANGED"


async def create_equipment(payload: dict[str, Any]) -> dict[str, Any]:
    status = payload.get("status", "IDLE")
    _validate_equipment_status(status)
    equipment_type = payload["equipment_type"]
    _validate_equipment_type(equipment_type)
    model = (payload.get("model") or "—").strip() or "—"

    pool = get_pool()
    equipment_id = str(uuid.uuid4())
    async with pool.acquire() as conn:
        async with conn.transaction():
            equipment_code = await _generate_equipment_code(conn)
            try:
                row = await conn.fetchrow(
                    """
                    INSERT INTO equipment (
                        id, equipment_code, equipment_name, equipment_type, model, status,
                        battery_level, operator_name, asset_number, current_location,
                        assigned_dock_id, assigned_vehicle_id, assigned_queue_entry_id,
                        assigned_since, maintenance_due, notes
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                        NULL, NULL, NULL, NULL, $11, $12
                    )
                    RETURNING *
                    """,
                    equipment_id,
                    equipment_code,
                    payload["equipment_name"].strip(),
                    equipment_type,
                    model,
                    status,
                    payload.get("battery_level"),
                    payload.get("operator_name"),
                    payload.get("asset_number"),
                    payload.get("current_location"),
                    payload.get("maintenance_due"),
                    payload.get("notes"),
                )
            except Exception as exc:
                if "equipment_equipment_code_key" in str(exc):
                    raise HTTPException(status_code=409, detail="Equipment code already exists") from exc
                raise
            await _log_equipment_event(
                equipment_id=equipment_id,
                event_type="EQUIPMENT_CREATED",
                event_note=payload.get("notes") or f"Equipment {equipment_code} · {payload['equipment_name']} created",
                created_by=payload.get("created_by", "equipment-ui"),
                conn=conn,
            )
    return _to_dict(row)


async def list_equipment(
    *,
    q: str | None = None,
    status: str | None = None,
    category: str | None = None,
    skip: int = 0,
    limit: int | None = None,
) -> tuple[list[dict[str, Any]], int]:
    from services.list_filters import query_rows

    eq = {}
    if status:
        eq["status"] = status
    if category:
        eq["equipment_type"] = category
    return await query_rows(
        "equipment",
        "equipment_code ASC",
        search_columns=[
            "equipment_code",
            "equipment_name",
            "equipment_type",
            "model",
            "status",
            "operator_name",
            "asset_number",
            "current_location",
        ],
        q=q,
        eq_filters=eq,
        skip=skip,
        limit=limit,
    )


async def get_equipment(equipment_id: str) -> dict[str, Any]:
    return await _get_equipment_row(equipment_id)


async def update_equipment(equipment_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_equipment_row(equipment_id, conn)
            if "status" in payload and payload["status"] is not None:
                _validate_equipment_status(payload["status"])
                _validate_equipment_transition(current["status"], payload["status"])
            if "equipment_type" in payload and payload["equipment_type"] is not None:
                _validate_equipment_type(payload["equipment_type"])
            merged = {**current, **payload}
            row = await conn.fetchrow(
                """
                UPDATE equipment SET
                    equipment_name = $2,
                    equipment_type = $3,
                    model = $4,
                    status = $5,
                    battery_level = $6,
                    operator_name = $7,
                    asset_number = $8,
                    current_location = $9,
                    assigned_dock_id = $10::uuid,
                    assigned_vehicle_id = $11::uuid,
                    maintenance_due = $12,
                    notes = $13,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                equipment_id,
                merged.get("equipment_name", current.get("equipment_name") or current["equipment_code"]),
                merged.get("equipment_type", current["equipment_type"]),
                merged.get("model", current["model"]),
                merged.get("status", current["status"]),
                merged.get("battery_level", current["battery_level"]),
                merged.get("operator_name", current.get("operator_name")),
                merged.get("asset_number", current.get("asset_number")),
                merged.get("current_location", current.get("current_location")),
                merged.get("assigned_dock_id", current["assigned_dock_id"]),
                merged.get("assigned_vehicle_id", current["assigned_vehicle_id"]),
                merged.get("maintenance_due", current["maintenance_due"]),
                merged.get("notes", current["notes"]),
            )
            await _log_equipment_event(
                equipment_id=equipment_id,
                event_type="EQUIPMENT_UPDATED",
                event_note=payload.get("event_note") or f"Equipment {current['equipment_code']} updated",
                created_by=payload.get("created_by", "equipment-ui"),
                dock_id=str(current["assigned_dock_id"]) if current.get("assigned_dock_id") else None,
                vehicle_id=str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None,
                conn=conn,
            )
            new_status = merged.get("status", current["status"])
            if new_status != current["status"]:
                await _log_equipment_event(
                    equipment_id=equipment_id,
                    event_type="EQUIPMENT_STATUS_CHANGED",
                    event_note=f"Status {current['status']} → {new_status}",
                    created_by=payload.get("created_by", "equipment-ui"),
                    conn=conn,
                )
    return _to_dict(row)


async def update_equipment_status(
    equipment_id: str,
    status: str,
    *,
    event_note: str | None = None,
    created_by: str = "equipment-ui",
) -> dict[str, Any]:
    _validate_equipment_status(status)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_equipment_row(equipment_id, conn)
            old_status = current["status"]
            _validate_equipment_transition(old_status, status)
            row = await conn.fetchrow(
                """
                UPDATE equipment SET status = $2, updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                equipment_id,
                status,
            )
            await _log_equipment_event(
                equipment_id=equipment_id,
                event_type=_status_event_type(old_status, status),
                event_note=event_note or f"Status {old_status} → {status}",
                created_by=created_by,
                dock_id=str(current["assigned_dock_id"]) if current.get("assigned_dock_id") else None,
                vehicle_id=str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None,
                conn=conn,
            )
    return _to_dict(row)


async def delete_equipment(equipment_id: str, *, created_by: str = "equipment-ui") -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_equipment_row(equipment_id, conn)
            if (
                current.get("assigned_dock_id")
                or current.get("assigned_vehicle_id")
                or current["status"] in {"ASSIGNED", "IN_USE"}
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Cannot delete equipment while assigned or in use.",
                )
            await _log_equipment_event(
                equipment_id=equipment_id,
                event_type="EQUIPMENT_DELETED",
                event_note=f"Equipment {current['equipment_code']} deleted",
                created_by=created_by,
                conn=conn,
            )
            result = await conn.execute("DELETE FROM equipment WHERE id = $1::uuid", equipment_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Equipment not found")


async def assign_equipment(equipment_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    dock_id = payload.get("dock_id")
    vehicle_id = payload.get("vehicle_id")
    queue_entry_id = payload.get("queue_entry_id")
    appointment_id = payload.get("appointment_id")
    if not dock_id and not vehicle_id and not queue_entry_id:
        raise HTTPException(
            status_code=400,
            detail="dock_id, vehicle_id, or queue_entry_id required for assignment",
        )

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            if dock_id:
                from services.dock_resource_service import enrich_assignment_from_dock

                payload = await enrich_assignment_from_dock(dock_id, payload, conn)
                dock_id = payload.get("dock_id")
                vehicle_id = payload.get("vehicle_id")
                queue_entry_id = payload.get("queue_entry_id")
                appointment_id = payload.get("appointment_id") or appointment_id

            current = await _get_equipment_row(equipment_id, conn)
            if current["status"] in {"MAINTENANCE", "OUT_OF_SERVICE", "CHARGING"}:
                raise HTTPException(status_code=409, detail=f"Cannot assign equipment in {current['status']} status")
            _check_battery_for_assign(current.get("battery_level"))
            if dock_id:
                from services.dock_resource_service import validate_cross_active_dock_assignment

                await validate_cross_active_dock_assignment(
                    current,
                    target_dock_id=dock_id,
                    conn=conn,
                    resource_label="Equipment",
                )
            _validate_assignment_conflict(current, dock_id=dock_id, vehicle_id=vehicle_id)

            dock = None
            vehicle = None
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

            if dock_id:
                dock = await conn.fetchrow("SELECT * FROM docks WHERE id = $1::uuid", dock_id)
                if dock is None:
                    raise HTTPException(status_code=404, detail="Dock not found")
                await conn.execute(
                    """
                    UPDATE equipment SET
                        assigned_dock_id = NULL,
                        assigned_vehicle_id = NULL,
                        assigned_queue_entry_id = NULL,
                        assigned_appointment_id = NULL,
                        assigned_since = NULL,
                        status = 'IDLE',
                        updated_at = NOW()
                    WHERE assigned_dock_id = $1::uuid AND id != $2::uuid
                    """,
                    dock_id,
                    equipment_id,
                )

            if vehicle_id:
                vehicle = await conn.fetchrow("SELECT * FROM vehicles WHERE id = $1::uuid", vehicle_id)
                if vehicle is None:
                    raise HTTPException(status_code=404, detail="Vehicle not found")
                other = await conn.fetchrow(
                    """
                    SELECT id, equipment_code FROM equipment
                    WHERE assigned_vehicle_id = $1::uuid AND id != $2::uuid
                      AND status IN ('ASSIGNED', 'IN_USE')
                    LIMIT 1
                    """,
                    vehicle_id,
                    equipment_id,
                )
                if other:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Vehicle already has equipment {other['equipment_code']} assigned",
                    )

            new_status = "IN_USE" if payload.get("set_in_use") else "ASSIGNED"
            _validate_equipment_transition(current["status"], new_status)
            now = datetime.now(timezone.utc)
            location = payload.get("current_location")
            if not location and dock:
                location = f"Dock {dock['dock_code']}"

            row = await conn.fetchrow(
                """
                UPDATE equipment SET
                    assigned_dock_id = COALESCE($2::uuid, assigned_dock_id),
                    assigned_vehicle_id = COALESCE($3::uuid, assigned_vehicle_id),
                    assigned_queue_entry_id = COALESCE($4::uuid, assigned_queue_entry_id),
                    assigned_appointment_id = COALESCE($5::uuid, assigned_appointment_id),
                    current_location = COALESCE($6, current_location),
                    status = $7,
                    assigned_since = $8,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                equipment_id,
                dock_id,
                vehicle_id,
                queue_entry_id,
                appointment_id,
                location,
                new_status,
                now,
            )
            note_parts = []
            if dock:
                note_parts.append(f"dock {dock['dock_code']}")
            if vehicle:
                note_parts.append(f"vehicle {vehicle['vehicle_number']}")
            await _log_equipment_event(
                equipment_id=equipment_id,
                event_type="EQUIPMENT_ASSIGNED",
                event_note=payload.get("event_note") or f"Assigned to {' · '.join(note_parts)}",
                created_by=payload.get("created_by", "equipment-ui"),
                dock_id=dock_id,
                vehicle_id=vehicle_id,
                conn=conn,
            )
            from services.resource_gating_service import sync_readiness_after_resource_change

            await sync_readiness_after_resource_change(
                vehicle_id=str(vehicle_id) if vehicle_id else None,
                dock_id=str(dock_id) if dock_id else None,
                conn=conn,
                created_by=payload.get("created_by", "equipment-ui"),
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
                resolved_vehicle_id, created_by=payload.get("created_by", "equipment-ui")
            )
        except Exception:
            logging.getLogger(__name__).exception(
                "Post-commit readiness sync failed for vehicle %s after equipment assign",
                resolved_vehicle_id,
            )
    return result


async def release_equipment(
    equipment_id: str,
    *,
    created_by: str = "equipment-ui",
    event_note: str | None = None,
    conn: Any | None = None,
) -> dict[str, Any]:
    async def _run(connection: Any) -> dict[str, Any]:
        current = await _get_equipment_row(equipment_id, connection)
        dock_id = str(current["assigned_dock_id"]) if current.get("assigned_dock_id") else None
        vehicle_id = str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None
        row = await connection.fetchrow(
            """
            UPDATE equipment SET
                assigned_dock_id = NULL,
                assigned_vehicle_id = NULL,
                assigned_queue_entry_id = NULL,
                assigned_appointment_id = NULL,
                assigned_since = NULL,
                status = 'IDLE',
                updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING *
            """,
            equipment_id,
        )
        await _log_equipment_event(
            equipment_id=equipment_id,
            event_type="EQUIPMENT_RELEASED",
            event_note=event_note or f"Equipment {current['equipment_code']} released",
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


async def mark_equipment_in_use(equipment_id: str, *, created_by: str = "equipment-ui") -> dict[str, Any]:
    return await update_equipment_status(equipment_id, "IN_USE", event_note="Equipment in use", created_by=created_by)


async def mark_equipment_idle(equipment_id: str, *, created_by: str = "equipment-ui") -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_equipment_row(equipment_id, conn)
            row = await conn.fetchrow(
                """
                UPDATE equipment SET
                    status = 'IDLE',
                    assigned_dock_id = NULL,
                    assigned_vehicle_id = NULL,
                    assigned_queue_entry_id = NULL,
                    assigned_appointment_id = NULL,
                    assigned_since = NULL,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                equipment_id,
            )
            await _log_equipment_event(
                equipment_id=equipment_id,
                event_type="EQUIPMENT_RELEASED",
                event_note=f"Equipment {current['equipment_code']} marked idle",
                created_by=created_by,
                conn=conn,
            )
    return _to_dict(row)


async def mark_equipment_maintenance(
    equipment_id: str, *, created_by: str = "equipment-ui", event_note: str | None = None
) -> dict[str, Any]:
    from services.resource_gating_service import sync_readiness_after_resource_change

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_equipment_row(equipment_id, conn)
            _validate_equipment_transition(current["status"], "MAINTENANCE")
            released_vehicle_id = (
                str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None
            )
            row = await conn.fetchrow(
                """
                UPDATE equipment SET
                    status = 'MAINTENANCE',
                    assigned_dock_id = NULL,
                    assigned_vehicle_id = NULL,
                    assigned_queue_entry_id = NULL,
                    assigned_since = NULL,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                equipment_id,
            )
            await _log_equipment_event(
                equipment_id=equipment_id,
                event_type="EQUIPMENT_STATUS_CHANGED",
                event_note=event_note or f"Maintenance started for {current['equipment_code']}",
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


async def mark_equipment_charging(equipment_id: str, *, created_by: str = "equipment-ui") -> dict[str, Any]:
    from services.resource_gating_service import sync_readiness_after_resource_change

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current = await _get_equipment_row(equipment_id, conn)
            _validate_equipment_transition(current["status"], "CHARGING")
            released_vehicle_id = (
                str(current["assigned_vehicle_id"]) if current.get("assigned_vehicle_id") else None
            )
            row = await conn.fetchrow(
                """
                UPDATE equipment SET
                    status = 'CHARGING',
                    assigned_dock_id = NULL,
                    assigned_vehicle_id = NULL,
                    assigned_queue_entry_id = NULL,
                    assigned_since = NULL,
                    current_location = COALESCE(current_location, 'Charge bay'),
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                equipment_id,
            )
            await _log_equipment_event(
                equipment_id=equipment_id,
                event_type="EQUIPMENT_STATUS_CHANGED",
                event_note=f"Equipment {current['equipment_code']} charging",
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


async def complete_equipment_maintenance(equipment_id: str, *, created_by: str = "equipment-ui") -> dict[str, Any]:
    current = await _get_equipment_row(equipment_id)
    if current["status"] != "MAINTENANCE":
        raise HTTPException(status_code=409, detail="Equipment is not in maintenance")
    return await update_equipment_status(
        equipment_id,
        "IDLE",
        event_note=f"Maintenance completed for {current['equipment_code']}",
        created_by=created_by,
    )


async def check_equipment_readiness(vehicle_id: str, conn: Any | None = None) -> dict[str, Any]:
    """
    Resource gating foundation — whether equipment is assigned for loading readiness.
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
        SELECT id, equipment_name, equipment_code
        FROM equipment
        WHERE assigned_vehicle_id = $1::uuid AND status IN ('ASSIGNED', 'IN_USE')
        LIMIT 1
        """,
        vehicle_id,
    )
    if row:
        return {
            "equipmentAssigned": True,
            "equipmentId": str(row["id"]),
            "equipmentCode": row["equipment_code"],
            "equipmentName": row.get("equipment_name") or row["equipment_code"],
        }

    row = await db.fetchrow(
        f"""
        SELECT e.id, e.equipment_name, e.equipment_code
        FROM equipment e
        INNER JOIN queue_entries qe ON qe.dock_id = e.assigned_dock_id
        WHERE qe.vehicle_id = $1::uuid
          AND e.status IN ('ASSIGNED', 'IN_USE')
          AND e.assigned_dock_id IS NOT NULL
          AND qe.status IN ('{active_queue_sql}')
        ORDER BY qe.dock_assigned_time DESC NULLS LAST
        LIMIT 1
        """,
        vehicle_id,
    )
    if row:
        return {
            "equipmentAssigned": True,
            "equipmentId": str(row["id"]),
            "equipmentCode": row["equipment_code"],
            "equipmentName": row.get("equipment_name") or row["equipment_code"],
        }

    return {"equipmentAssigned": False}
