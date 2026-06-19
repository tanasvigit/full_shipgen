"""Resource gating — unified readiness validation and automatic status sync."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException

from db import get_pool
from enums import ACTIVE_DOCK_QUEUE_STATUSES, DOCK_INACTIVE_FOR_LOADING

logger = logging.getLogger(__name__)

_ACTIVE_QUEUE_STATUS_SQL = "', '".join(ACTIVE_DOCK_QUEUE_STATUSES)


def _db(conn: Any | None) -> Any:
    return conn if conn is not None else get_pool()


async def validate_resource_readiness_for_loading(
    vehicle_id: str,
    *,
    conn: Any | None = None,
    enforce_queue_dock: bool = True,
) -> dict[str, Any]:
    """
    Evaluate dock, labor, and equipment readiness for a vehicle.

    When enforce_queue_dock is True (loading transition), also requires an active
    queue entry with dock_id and an assignable dock status.
    """
    from services.equipment_service import check_equipment_readiness
    from services.labor_service import check_labor_readiness
    from services.yms_service import check_dock_readiness

    missing: list[str] = []

    if enforce_queue_dock:
        db = _db(conn)
        queue_row = await db.fetchrow(
            f"""
            SELECT qe.id, qe.dock_id, d.status AS dock_status
            FROM queue_entries qe
            LEFT JOIN docks d ON d.id = qe.dock_id
            WHERE qe.vehicle_id = $1::uuid
              AND qe.status IN ('{_ACTIVE_QUEUE_STATUS_SQL}')
            ORDER BY qe.dock_assigned_time DESC NULLS LAST
            LIMIT 1
            """,
            vehicle_id,
        )
        if queue_row is None:
            missing.append("dock")
        elif not queue_row["dock_id"]:
            missing.append("dock")
        elif queue_row["dock_status"] in DOCK_INACTIVE_FOR_LOADING:
            missing.append("dock")

    dock = await check_dock_readiness(vehicle_id, conn=conn)
    labor = await check_labor_readiness(vehicle_id, conn=conn)
    equipment = await check_equipment_readiness(vehicle_id, conn=conn)

    # Mandatory for READY_FOR_LOADING / start loading: dock + labor only.
    # Equipment is optional — informational in UI, never blocks readiness.
    if not dock.get("dockAssigned") and "dock" not in missing:
        missing.append("dock")
    if not labor.get("laborAssigned"):
        missing.append("labor")

    equipment_assigned = bool(equipment.get("equipmentAssigned"))
    ready = len(missing) == 0
    return {
        "ready": ready,
        "missing": missing,
        "dockAssigned": bool(dock.get("dockAssigned")),
        "laborAssigned": bool(labor.get("laborAssigned")),
        "equipmentAssigned": equipment_assigned,
        "equipmentOptional": True,
        "equipmentRecommended": not equipment_assigned,
        "dockId": dock.get("dockId"),
        "dockCode": dock.get("dockCode"),
        "dockName": dock.get("dockName"),
        "teamId": labor.get("teamId"),
        "teamName": labor.get("teamName"),
        "teamCode": labor.get("teamCode"),
        "equipmentId": equipment.get("equipmentId"),
        "equipmentCode": equipment.get("equipmentCode"),
        "equipmentName": equipment.get("equipmentName"),
    }


def raise_resource_gating_error(missing: list[str]) -> None:
    raise HTTPException(
        status_code=409,
        detail={
            "error": "RESOURCE_GATING_FAILED",
            "message": "Cannot start loading.",
            "missing": missing,
        },
    )


async def log_resource_gate_blocked(
    *,
    vehicle_id: str,
    dock_id: str | None,
    missing: list[str],
    created_by: str,
    conn: Any | None = None,
) -> None:
    from services.yms_service import create_yard_event

    note = f"Loading blocked — missing: {', '.join(missing)}"
    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=None,
        queue_entry_id=None,
        dock_id=dock_id,
        event_type="RESOURCE_GATE_BLOCKED",
        event_note=note,
        created_by=created_by,
        conn=conn,
    )


async def _resolve_vehicle_at_dock(dock_id: str, conn: Any | None = None) -> str | None:
    db = _db(conn)
    row = await db.fetchrow(
        f"""
        SELECT vehicle_id
        FROM queue_entries
        WHERE dock_id = $1::uuid
          AND status IN ('{_ACTIVE_QUEUE_STATUS_SQL}')
        ORDER BY dock_assigned_time DESC NULLS LAST
        LIMIT 1
        """,
        dock_id,
    )
    if row and row["vehicle_id"]:
        return str(row["vehicle_id"])
    vehicle_id = await db.fetchval(
        "SELECT current_vehicle_id FROM docks WHERE id = $1::uuid",
        dock_id,
    )
    return str(vehicle_id) if vehicle_id else None


async def _sync_vehicle_readiness_status_impl(
    vehicle_id: str,
    *,
    conn: Any,
    created_by: str,
) -> dict[str, Any] | None:
    from services.yms_service import (
        _to_dict,
        _validate_transition,
        create_yard_event,
        get_vehicle,
        update_appointment,
        update_queue_entry,
        update_vehicle,
    )

    db = conn
    row = await db.fetchrow("SELECT * FROM vehicles WHERE id = $1::uuid", vehicle_id)
    if row is None:
        return None
    vehicle = _to_dict(row)
    current = vehicle["status"]
    if current not in {"DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING"}:
        return vehicle

    result = await validate_resource_readiness_for_loading(
        vehicle_id, conn=conn, enforce_queue_dock=False
    )
    target = "READY_FOR_LOADING" if result["ready"] else "RESOURCE_PENDING"
    logger.info(
        "sync_vehicle_readiness_status vehicle=%s current=%s target=%s ready=%s missing=%s",
        vehicle_id,
        current,
        target,
        result["ready"],
        result["missing"],
    )

    appointment_row = await db.fetchrow(
        """
        SELECT id FROM appointments
        WHERE vehicle_id = $1::uuid
        ORDER BY created_at DESC
        LIMIT 1
        """,
        vehicle_id,
    )
    queue_row = await db.fetchrow(
        """
        SELECT id, dock_id, status FROM queue_entries
        WHERE vehicle_id = $1::uuid
        ORDER BY created_at DESC
        LIMIT 1
        """,
        vehicle_id,
    )
    dock_id = str(queue_row["dock_id"]) if queue_row and queue_row["dock_id"] else result.get("dockId")

    if current == target:
        updated = vehicle
    else:
        _validate_transition(current, target)
        updated = await update_vehicle(
            vehicle_id, {"status": target}, conn=conn, internal=True
        )

    appt_aligned = False
    if appointment_row:
        appt_id = str(appointment_row["id"])
        appt = await db.fetchrow("SELECT status FROM appointments WHERE id = $1::uuid", appt_id)
        if appt and appt["status"] != target:
            await update_appointment(appt_id, {"status": target}, conn=conn, internal=True)
            appt_aligned = True

    queue_aligned = False
    if queue_row and queue_row.get("status") != target:
        if queue_row["status"] in ACTIVE_DOCK_QUEUE_STATUSES or target in ACTIVE_DOCK_QUEUE_STATUSES:
            try:
                await update_queue_entry(
                    str(queue_row["id"]), {"status": target}, conn=conn, internal=True
                )
                queue_aligned = True
            except HTTPException as exc:
                logger.warning(
                    "sync_vehicle_readiness_status queue status skip entry=%s %s→%s: %s",
                    queue_row["id"],
                    queue_row["status"],
                    target,
                    exc.detail,
                )

    if current != target or appt_aligned or queue_aligned:
        note = f"Resource readiness: {target}"
        if result["missing"]:
            note += f" (missing: {', '.join(result['missing'])})"
        await create_yard_event(
            vehicle_id=vehicle_id,
            appointment_id=str(appointment_row["id"]) if appointment_row else None,
            queue_entry_id=str(queue_row["id"]) if queue_row else None,
            dock_id=dock_id,
            event_type="RESOURCE_READINESS_UPDATED",
            event_note=note,
            created_by=created_by,
            conn=conn,
        )
    return updated if isinstance(updated, dict) and updated.get("status") else await get_vehicle(vehicle_id, conn=conn)


async def sync_vehicle_readiness_status(
    vehicle_id: str,
    *,
    conn: Any | None = None,
    created_by: str = "system",
) -> dict[str, Any] | None:
    """
    Move vehicle between RESOURCE_PENDING and READY_FOR_LOADING based on assignments.
    Called after dock/labor/equipment assign or release — does not start loading.
    """
    if conn is not None:
        return await _sync_vehicle_readiness_status_impl(
            vehicle_id, conn=conn, created_by=created_by
        )
    pool = get_pool()
    async with pool.acquire() as acquired:
        async with acquired.transaction():
            return await _sync_vehicle_readiness_status_impl(
                vehicle_id, conn=acquired, created_by=created_by
            )


async def sync_readiness_after_resource_change(
    *,
    vehicle_id: str | None = None,
    dock_id: str | None = None,
    conn: Any | None = None,
    created_by: str = "system",
) -> None:
    """Recalculate readiness for the vehicle at a dock or the given vehicle."""
    vid = vehicle_id
    if not vid and dock_id:
        vid = await _resolve_vehicle_at_dock(dock_id, conn=conn)
    if vid:
        await sync_vehicle_readiness_status(vid, conn=conn, created_by=created_by)


async def release_loading_resources(
    vehicle_id: str,
    dock_id: str | None,
    *,
    conn: Any,
    created_by: str,
) -> None:
    """Auto-release labor and equipment tied to a vehicle/dock when loading completes."""
    from services.equipment_service import _log_equipment_event
    from services.labor_service import _log_labor_event

    labor_rows = await conn.fetch(
        """
        SELECT id, team_code, status, members_count, assigned_dock_id, assigned_vehicle_id
        FROM labor_teams
        WHERE status = 'ASSIGNED'
          AND (
            assigned_vehicle_id = $1::uuid
            OR ($2::uuid IS NOT NULL AND assigned_dock_id = $2::uuid)
          )
        """,
        vehicle_id,
        dock_id,
    )
    for lr in labor_rows:
        lid = str(lr["id"])
        members = lr["members_count"]
        team_status = "OFF_DUTY" if lr["status"] == "OFF_DUTY" else "AVAILABLE"
        await conn.execute(
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
            """,
            lid,
            team_status,
            0 if team_status == "OFF_DUTY" else members,
        )
        await _log_labor_event(
            labor_id=lid,
            event_type="TEAM_RELEASED",
            event_note=f"Team {lr['team_code']} auto-released after loading complete",
            created_by=created_by,
            dock_id=str(lr["assigned_dock_id"]) if lr["assigned_dock_id"] else dock_id,
            vehicle_id=vehicle_id,
            conn=conn,
        )

    equip_rows = await conn.fetch(
        """
        SELECT id, equipment_code, assigned_dock_id, assigned_vehicle_id
        FROM equipment
        WHERE status IN ('ASSIGNED', 'IN_USE')
          AND (
            assigned_vehicle_id = $1::uuid
            OR ($2::uuid IS NOT NULL AND assigned_dock_id = $2::uuid)
          )
        """,
        vehicle_id,
        dock_id,
    )
    for er in equip_rows:
        eid = str(er["id"])
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
            WHERE id = $1::uuid
            """,
            eid,
        )
        await _log_equipment_event(
            equipment_id=eid,
            event_type="EQUIPMENT_RELEASED",
            event_note=f"Equipment {er['equipment_code']} auto-released after loading complete",
            created_by=created_by,
            dock_id=str(er["assigned_dock_id"]) if er["assigned_dock_id"] else dock_id,
            vehicle_id=vehicle_id,
            conn=conn,
        )
