"""Dock-centric resource assignment — single source of truth for labor/equipment at a dock."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from db import get_pool
from services.yms_service import _to_dict

ACTIVE_DOCK_STATUSES = frozenset({"OCCUPIED"})
ACTIVE_QUEUE_STATUSES = frozenset(
    {"DOCK_ASSIGNED", "LOADING", "RESOURCE_PENDING", "READY_FOR_LOADING"}
)


async def is_dock_active(dock_id: str, conn: Any) -> bool:
    """A dock is active when occupied or has a vehicle at the bay."""
    row = await conn.fetchrow(
        "SELECT status, current_vehicle_id FROM docks WHERE id = $1::uuid",
        dock_id,
    )
    if row is None:
        return False
    if row.get("current_vehicle_id"):
        return True
    return row["status"] in ACTIVE_DOCK_STATUSES


async def resolve_dock_assignment_context(dock_id: str, conn: Any) -> dict[str, Any]:
    """Resolve vehicle, queue, and appointment from current dock state."""
    dock_row = await conn.fetchrow("SELECT * FROM docks WHERE id = $1::uuid", dock_id)
    if dock_row is None:
        raise HTTPException(status_code=404, detail="Dock not found")
    dock = _to_dict(dock_row)

    vehicle_id = str(dock["current_vehicle_id"]) if dock.get("current_vehicle_id") else None
    queue_entry_id: str | None = None
    appointment_id: str | None = None

    queue_row = await conn.fetchrow(
        """
        SELECT * FROM queue_entries
        WHERE dock_id = $1::uuid AND status = ANY($2::text[])
        ORDER BY dock_assigned_time DESC NULLS LAST, updated_at DESC
        LIMIT 1
        """,
        dock_id,
        list(ACTIVE_QUEUE_STATUSES),
    )
    if queue_row:
        queue_entry_id = str(queue_row["id"])
        if not vehicle_id and queue_row.get("vehicle_id"):
            vehicle_id = str(queue_row["vehicle_id"])
        if queue_row.get("appointment_id"):
            appointment_id = str(queue_row["appointment_id"])

    if vehicle_id and not appointment_id:
        appt_row = await conn.fetchrow(
            """
            SELECT id FROM appointments
            WHERE vehicle_id = $1::uuid
            ORDER BY created_at DESC
            LIMIT 1
            """,
            vehicle_id,
        )
        if appt_row:
            appointment_id = str(appt_row["id"])

    return {
        "dock": dock,
        "dock_id": str(dock_id),
        "vehicle_id": vehicle_id,
        "queue_entry_id": queue_entry_id,
        "appointment_id": appointment_id,
    }


async def enrich_assignment_from_dock(
    dock_id: str,
    payload: dict[str, Any],
    conn: Any,
) -> dict[str, Any]:
    """Fill vehicle/queue/appointment from dock when assigning via dock-centric flow."""
    ctx = await resolve_dock_assignment_context(dock_id, conn)
    enriched = dict(payload)
    enriched["dock_id"] = dock_id
    if not enriched.get("vehicle_id") and ctx["vehicle_id"]:
        enriched["vehicle_id"] = ctx["vehicle_id"]
    if not enriched.get("queue_entry_id") and ctx["queue_entry_id"]:
        enriched["queue_entry_id"] = ctx["queue_entry_id"]
    if not enriched.get("appointment_id") and ctx["appointment_id"]:
        enriched["appointment_id"] = ctx["appointment_id"]
    return enriched


async def validate_cross_active_dock_assignment(
    current: dict[str, Any],
    *,
    target_dock_id: str | None,
    conn: Any,
    resource_label: str,
) -> None:
    """Block reassignment when already tied to a different active dock."""
    cur_dock = str(current["assigned_dock_id"]) if current.get("assigned_dock_id") else None
    if not target_dock_id or not cur_dock or cur_dock == target_dock_id:
        return
    if not await is_dock_active(cur_dock, conn):
        return
    dock_row = await conn.fetchrow(
        "SELECT dock_code FROM docks WHERE id = $1::uuid",
        cur_dock,
    )
    code = dock_row["dock_code"] if dock_row else cur_dock
    raise HTTPException(
        status_code=409,
        detail=f"{resource_label} already assigned to active dock {code}. Release before reassigning.",
    )


async def assign_labor_to_dock(dock_id: str, labor_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Dock-centric labor assignment — resolves full dock context then assigns."""
    from services.labor_service import assign_labor_team

    merged = {**payload, "dock_id": dock_id}
    merged.setdefault("created_by", "docks-ui")
    return await assign_labor_team(labor_id, merged)


async def assign_equipment_to_dock(
    dock_id: str,
    equipment_id: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Dock-centric equipment assignment — resolves full dock context then assigns."""
    from services.equipment_service import assign_equipment

    merged = {**payload, "dock_id": dock_id}
    merged.setdefault("created_by", "docks-ui")
    return await assign_equipment(equipment_id, merged)


async def release_dock_resources(
    dock_id: str,
    *,
    conn: Any | None = None,
    created_by: str = "docks-ui",
    event_note: str | None = None,
) -> dict[str, int]:
    """Release all labor and equipment assigned to a dock."""
    from services.equipment_service import release_equipment
    from services.labor_service import release_labor_team

    async def _run(connection: Any) -> dict[str, int]:
        labor_rows = await connection.fetch(
            """
            SELECT id FROM labor_teams
            WHERE assigned_dock_id = $1::uuid AND status = 'ASSIGNED'
            """,
            dock_id,
        )
        equip_rows = await connection.fetch(
            """
            SELECT id FROM equipment
            WHERE assigned_dock_id = $1::uuid AND status IN ('ASSIGNED', 'IN_USE')
            """,
            dock_id,
        )
        note = event_note or "Released from dock"
        for lr in labor_rows:
            await release_labor_team(
                str(lr["id"]),
                created_by=created_by,
                event_note=note,
                conn=connection,
            )
        for er in equip_rows:
            await release_equipment(
                str(er["id"]),
                created_by=created_by,
                event_note=note,
                conn=connection,
            )
        return {"labor_released": len(labor_rows), "equipment_released": len(equip_rows)}

    if conn is not None:
        return await _run(conn)

    pool = get_pool()
    async with pool.acquire() as acquired:
        async with acquired.transaction():
            return await _run(acquired)
