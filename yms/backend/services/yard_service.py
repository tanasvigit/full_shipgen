"""Yard zone master, vehicle movement, capacity, and zone rules."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from db import get_pool
from enums import MANDATORY_YARD_ZONE_TYPES, YARD_ZONE_STATUSES, YARD_ZONE_TYPES

# Vehicle status → yard zone type (single source of truth for Yard Map placement).
STATUS_ZONE_TYPE: dict[str, str | None] = {
    "SCHEDULED": "GATE_IN",
    "DRAFT": "GATE_IN",
    "ARRIVED": "GATE_IN",
    "CHECKED_IN": "WAITING_AREA",
    "WAITING": "WAITING_AREA",
    "CALLED": "STAGING",
    "DOCK_ASSIGNED": "LOADING",
    "RESOURCE_PENDING": "LOADING",
    "READY_FOR_LOADING": "LOADING",
    "LOADING": "LOADING",
    "UNLOADING": "UNLOADING",
    "COMPLETED": "EXIT_HOLDING",
    "EXIT_HOLDING": "EXIT_HOLDING",
    "EXIT_VERIFIED": "GATE_OUT",
    "EXITED": None,
    "CANCELLED": None,
}

IN_YARD_VEHICLE_STATUSES = frozenset(s for s, zt in STATUS_ZONE_TYPE.items() if zt is not None)


def _to_dict(record: Any) -> dict[str, Any]:
    return dict(record) if record is not None else {}


def _db(conn: Any | None) -> Any:
    return conn if conn is not None else get_pool()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _validate_zone_type(zone_type: str) -> None:
    if zone_type not in YARD_ZONE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported zone type '{zone_type}'")


def _validate_zone_status(status: str) -> None:
    if status not in YARD_ZONE_STATUSES:
        raise HTTPException(status_code=400, detail=f"Unsupported zone status '{status}'")


async def _generate_zone_code(conn: Any) -> str:
    max_num = await conn.fetchval(
        """
        SELECT COALESCE(MAX(
            CASE WHEN zone_code ~ '^ZN-[0-9]+$'
            THEN CAST(SUBSTRING(zone_code FROM 4) AS INTEGER)
            ELSE 0 END
        ), 0)
        FROM yard_zones
        """
    )
    for n in range(int(max_num) + 1, int(max_num) + 500):
        code = f"ZN-{n:03d}"
        taken = await conn.fetchval("SELECT 1 FROM yard_zones WHERE zone_code = $1", code)
        if not taken:
            return code
    raise HTTPException(status_code=500, detail="Could not generate zone code")


async def _zone_occupancy(zone_id: str, conn: Any | None = None) -> int:
    db = _db(conn)
    return int(
        await db.fetchval(
            "SELECT COUNT(*)::int FROM vehicles WHERE current_zone_id = $1::uuid",
            zone_id,
        )
        or 0
    )


async def _enrich_zone(row: Any, conn: Any | None = None) -> dict[str, Any]:
    data = _to_dict(row)
    occ = await _zone_occupancy(str(data["id"]), conn=conn)
    cap = int(data["max_capacity"])
    available = max(0, cap - occ)
    pct = min(100, round((occ / cap) * 100)) if cap else 0
    status = data["status"]
    if status == "ACTIVE" and occ >= cap:
        status = "FULL"
    return {
        **data,
        "currentOccupancy": occ,
        "availableSlots": available,
        "occupancyPct": pct,
        "status": status,
    }


async def _log_zone_event(
    *,
    zone_id: str | None,
    vehicle_id: str | None,
    event_type: str,
    event_note: str | None,
    created_by: str,
    conn: Any,
) -> None:
    from services.yms_service import create_yard_event

    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=None,
        queue_entry_id=None,
        dock_id=None,
        event_type=event_type,
        event_note=event_note,
        created_by=created_by,
        conn=conn,
    )


def _cargo_blob(appointment: dict[str, Any] | None, dock: dict[str, Any] | None = None) -> str:
    parts = []
    if appointment:
        parts.extend(
            [
                appointment.get("shipment_reference"),
                appointment.get("remarks"),
                appointment.get("customer_name"),
            ]
        )
    if dock:
        parts.extend([dock.get("dock_type"), dock.get("dock_name")])
        parts.extend(dock.get("supported_cargo_types") or [])
    return " ".join(str(p) for p in parts if p).lower()


async def _get_vehicle_context(vehicle_id: str, conn: Any) -> tuple[dict, dict | None, dict | None]:
    vehicle = await conn.fetchrow("SELECT * FROM vehicles WHERE id = $1::uuid", vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle_d = _to_dict(vehicle)
    appt = await conn.fetchrow(
        """
        SELECT * FROM appointments WHERE vehicle_id = $1::uuid
        ORDER BY created_at DESC LIMIT 1
        """,
        vehicle_id,
    )
    queue = await conn.fetchrow(
        """
        SELECT * FROM queue_entries WHERE vehicle_id = $1::uuid
        ORDER BY created_at DESC LIMIT 1
        """,
        vehicle_id,
    )
    dock = None
    if queue and queue.get("dock_id"):
        dock = await conn.fetchrow("SELECT * FROM docks WHERE id = $1::uuid", queue["dock_id"])
    return vehicle_d, _to_dict(appt) if appt else None, _to_dict(dock) if dock else None


async def validate_zone_rules(
    vehicle_id: str,
    zone: dict[str, Any],
    *,
    conn: Any,
) -> tuple[bool, str | None]:
    """Return (ok, violation_reason)."""
    _, appointment, dock = await _get_vehicle_context(vehicle_id, conn)
    vehicle = await conn.fetchrow("SELECT status FROM vehicles WHERE id = $1::uuid", vehicle_id)
    status = vehicle["status"] if vehicle else ""
    blob = _cargo_blob(appointment, dock)
    ztype = zone["zone_type"]

    rules = await conn.fetch(
        "SELECT * FROM zone_rules WHERE zone_type = $1 AND active = TRUE",
        ztype,
    )
    for rule in rules:
        key = rule["rule_key"]
        pattern = rule["rule_value"]
        if key == "cargo_match":
            if ztype in {"HAZMAT", "COLD_CHAIN"} and not re.search(pattern, blob, re.I):
                return False, f"{ztype} zone requires matching cargo profile"
        elif key == "vehicle_status":
            allowed = set(pattern.split("|"))
            if status not in allowed and ztype in {"DOCUMENTATION", "GATE_IN", "EXIT_HOLDING", "GATE_OUT"}:
                if ztype == "GATE_OUT" and status not in {"COMPLETED", "EXITED"}:
                    return False, f"Vehicle status {status} not allowed in {ztype} zone"
                elif ztype != "GATE_OUT" and status not in allowed:
                    return False, f"Vehicle status {status} not allowed in {ztype} zone"

    if ztype == "HAZMAT" and not re.search(r"hazmat|hazard|chem|class\s*3|flamm", blob, re.I):
        return False, "HAZMAT cargo required for this zone"
    if ztype == "COLD_CHAIN" and not re.search(r"cold|pharma|refrig|freezer|reefer|chilled", blob, re.I):
        return False, "Cold chain cargo required for this zone"

    return True, None


async def list_yard_zones(
    *,
    q: str | None = None,
    status: str | None = None,
    zone_type: str | None = None,
    skip: int = 0,
    limit: int | None = None,
) -> tuple[list[dict[str, Any]], int]:
    pool = get_pool()
    conditions = ["1=1"]
    params: list[Any] = []
    idx = 1
    if q:
        conditions.append(
            f"(zone_name ILIKE ${idx} OR zone_code ILIKE ${idx} OR zone_type ILIKE ${idx})"
        )
        params.append(f"%{q}%")
        idx += 1
    if status:
        conditions.append(f"status = ${idx}")
        params.append(status)
        idx += 1
    if zone_type:
        conditions.append(f"zone_type = ${idx}")
        params.append(zone_type)
        idx += 1
    where = " AND ".join(conditions)
    async with pool.acquire() as conn:
        total = await conn.fetchval(f"SELECT COUNT(*)::int FROM yard_zones WHERE {where}", *params)
        query = f"SELECT * FROM yard_zones WHERE {where} ORDER BY map_code NULLS LAST, zone_name"
        if limit:
            query += f" LIMIT ${idx} OFFSET ${idx + 1}"
            params.extend([limit, skip])
        elif skip:
            query += f" OFFSET ${idx}"
            params.append(skip)
        rows = await conn.fetch(query, *params)
        enriched = [await _enrich_zone(_to_dict(r), conn=conn) for r in rows]
    return enriched, int(total or 0)


async def get_yard_zone(zone_id: str, conn: Any | None = None) -> dict[str, Any]:
    db = _db(conn)
    row = await db.fetchrow("SELECT * FROM yard_zones WHERE id = $1::uuid", zone_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Zone not found")
    zone = await _enrich_zone(_to_dict(row), conn=conn)
    vehicles = await db.fetch(
        """
        SELECT id, vehicle_number, status, transporter_name
        FROM vehicles WHERE current_zone_id = $1::uuid
        ORDER BY updated_at DESC
        """,
        zone_id,
    )
    zone["vehiclesPresent"] = [_to_dict(v) for v in vehicles]
    return zone


async def create_yard_zone(payload: dict[str, Any]) -> dict[str, Any]:
    _validate_zone_type(payload["zone_type"])
    status = payload.get("status", "ACTIVE")
    _validate_zone_status(status)
    pool = get_pool()
    zone_id = str(uuid.uuid4())
    async with pool.acquire() as conn:
        async with conn.transaction():
            zone_code = payload.get("zone_code") or await _generate_zone_code(conn)
            row = await conn.fetchrow(
                """
                INSERT INTO yard_zones (
                    id, zone_code, zone_name, zone_type, max_capacity, status,
                    description, remarks, map_code, linked_dock_id, is_mandatory,
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::uuid, FALSE, NOW(), NOW())
                RETURNING *
                """,
                zone_id,
                zone_code,
                payload["zone_name"].strip(),
                payload["zone_type"],
                payload.get("max_capacity", 1),
                status,
                payload.get("description"),
                payload.get("remarks"),
                payload.get("map_code"),
                payload.get("linked_dock_id"),
            )
            await _log_zone_event(
                zone_id=zone_id,
                vehicle_id=None,
                event_type="ZONE_CREATED",
                event_note=f"Zone {zone_code} · {payload['zone_name']} created",
                created_by=payload.get("created_by", "yard-ui"),
                conn=conn,
            )
    return await get_yard_zone(zone_id)


async def update_yard_zone(zone_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            current_row = await conn.fetchrow("SELECT * FROM yard_zones WHERE id = $1::uuid", zone_id)
            if not current_row:
                raise HTTPException(status_code=404, detail="Zone not found")
            current = _to_dict(current_row)
            if payload.get("zone_type"):
                _validate_zone_type(payload["zone_type"])
            if payload.get("status"):
                _validate_zone_status(payload["status"])
            merged = {**current, **payload}
            row = await conn.fetchrow(
                """
                UPDATE yard_zones SET
                    zone_name = $2,
                    zone_type = $3,
                    max_capacity = $4,
                    status = $5,
                    description = $6,
                    remarks = $7,
                    map_code = $8,
                    linked_dock_id = $9::uuid,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                zone_id,
                merged["zone_name"],
                merged["zone_type"],
                merged["max_capacity"],
                merged["status"],
                merged.get("description"),
                merged.get("remarks"),
                merged.get("map_code"),
                merged.get("linked_dock_id"),
            )
            if not row:
                raise HTTPException(status_code=404, detail="Zone not found")
            if payload.get("status") and payload["status"] != current["status"]:
                await _log_zone_event(
                    zone_id=zone_id,
                    vehicle_id=None,
                    event_type="ZONE_STATUS_CHANGED",
                    event_note=f"Status {current['status']} → {payload['status']}",
                    created_by=payload.get("created_by", "yard-ui"),
                    conn=conn,
                )
            await _log_zone_event(
                zone_id=zone_id,
                vehicle_id=None,
                event_type="ZONE_UPDATED",
                event_note=payload.get("event_note") or f"Zone {current['zone_code']} updated",
                created_by=payload.get("created_by", "yard-ui"),
                conn=conn,
            )
    return await get_yard_zone(zone_id)


async def delete_yard_zone(zone_id: str, *, created_by: str = "yard-ui") -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            zone = await conn.fetchrow("SELECT * FROM yard_zones WHERE id = $1::uuid", zone_id)
            if not zone:
                raise HTTPException(status_code=404, detail="Zone not found")
            if zone["is_mandatory"]:
                raise HTTPException(status_code=409, detail="Cannot delete a mandatory system zone")
            occ = await _zone_occupancy(zone_id, conn=conn)
            if occ > 0:
                raise HTTPException(status_code=409, detail="Cannot delete zone with vehicles inside")
            if zone.get("linked_dock_id"):
                active = await conn.fetchval(
                    """
                    SELECT 1 FROM docks
                    WHERE id = $1::uuid AND status IN ('OCCUPIED', 'BLOCKED')
                    LIMIT 1
                    """,
                    zone["linked_dock_id"],
                )
                if active:
                    raise HTTPException(status_code=409, detail="Cannot delete zone with active linked dock")
            active_queue = await conn.fetchval(
                """
                SELECT 1 FROM queue_entries qe
                INNER JOIN vehicles v ON v.id = qe.vehicle_id
                WHERE v.current_zone_id = $1::uuid
                  AND qe.status IN ('DOCK_ASSIGNED', 'LOADING', 'CALLED', 'WAITING')
                LIMIT 1
                """,
                zone_id,
            )
            if active_queue:
                raise HTTPException(status_code=409, detail="Cannot delete zone with active queue entries")
            await _log_zone_event(
                zone_id=zone_id,
                vehicle_id=None,
                event_type="ZONE_DELETED",
                event_note=f"Zone {zone['zone_code']} deleted",
                created_by=created_by,
                conn=conn,
            )
            await conn.execute("UPDATE vehicles SET current_zone_id = NULL WHERE current_zone_id = $1::uuid", zone_id)
            await conn.execute("DELETE FROM yard_zones WHERE id = $1::uuid", zone_id)


async def get_vehicle_zone_history(vehicle_id: str, limit: int = 50) -> list[dict[str, Any]]:
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT h.*,
               pz.zone_name AS previous_zone_name,
               pz.zone_code AS previous_zone_code,
               nz.zone_name AS new_zone_name,
               nz.zone_code AS new_zone_code
        FROM vehicle_zone_history h
        LEFT JOIN yard_zones pz ON pz.id = h.previous_zone_id
        LEFT JOIN yard_zones nz ON nz.id = h.new_zone_id
        WHERE h.vehicle_id = $1::uuid
        ORDER BY h.moved_at DESC
        LIMIT $2
        """,
        vehicle_id,
        limit,
    )
    return [_to_dict(r) for r in rows]


async def build_yard_dashboard() -> dict[str, Any]:
    zones, _ = await list_yard_zones()
    total_capacity = sum(z["max_capacity"] for z in zones)
    total_occupancy = sum(z["currentOccupancy"] for z in zones)
    return {
        "totalZones": len(zones),
        "activeZones": sum(1 for z in zones if z["status"] == "ACTIVE"),
        "blockedZones": sum(1 for z in zones if z["status"] == "BLOCKED"),
        "fullZones": sum(1 for z in zones if z["status"] == "FULL" or z["currentOccupancy"] >= z["max_capacity"]),
        "maintenanceZones": sum(1 for z in zones if z["status"] == "MAINTENANCE"),
        "totalCapacity": total_capacity,
        "currentOccupancy": total_occupancy,
        "availableSlots": max(0, total_capacity - total_occupancy),
        "yardUtilizationPct": round((total_occupancy / total_capacity) * 100, 1) if total_capacity else 0,
    }


async def find_zone_by_type(zone_type: str, conn: Any | None = None) -> dict[str, Any] | None:
    db = _db(conn)
    row = await db.fetchrow(
        """
        SELECT * FROM yard_zones
        WHERE zone_type = $1 AND status IN ('ACTIVE', 'FULL')
        ORDER BY is_mandatory DESC, zone_name
        LIMIT 1
        """,
        zone_type,
    )
    return _to_dict(row) if row else None


async def find_zone_by_map_code(map_code: str, conn: Any | None = None) -> dict[str, Any] | None:
    db = _db(conn)
    row = await db.fetchrow(
        "SELECT * FROM yard_zones WHERE map_code = $1 LIMIT 1",
        map_code,
    )
    return _to_dict(row) if row else None


async def move_vehicle_to_zone(
    vehicle_id: str,
    zone_id: str,
    *,
    reason: str | None = None,
    created_by: str = "yard-ui",
    conn: Any | None = None,
    skip_capacity: bool = False,
    skip_rules: bool = False,
) -> dict[str, Any]:
    """Move vehicle to zone with capacity and rule validation."""

    async def _run(db: Any) -> dict[str, Any]:
        vehicle = await db.fetchrow("SELECT * FROM vehicles WHERE id = $1::uuid", vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        zone_row = await db.fetchrow("SELECT * FROM yard_zones WHERE id = $1::uuid", zone_id)
        if not zone_row:
            raise HTTPException(status_code=404, detail="Zone not found")
        zone = _to_dict(zone_row)
        if zone["status"] in {"BLOCKED", "MAINTENANCE"}:
            raise HTTPException(status_code=409, detail=f"Zone is {zone['status']}")

        prev_id = str(vehicle["current_zone_id"]) if vehicle.get("current_zone_id") else None
        if prev_id == zone_id:
            return await get_yard_zone(zone_id, conn=db)

        occ = await _zone_occupancy(zone_id, conn=db)
        if not skip_capacity and occ >= zone["max_capacity"]:
            await _log_zone_event(
                zone_id=zone_id,
                vehicle_id=vehicle_id,
                event_type="ZONE_CAPACITY_EXCEEDED",
                event_note=f"Blocked entry to {zone['zone_code']}: at capacity ({occ}/{zone['max_capacity']})",
                created_by=created_by,
                conn=db,
            )
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "ZONE_CAPACITY_EXCEEDED",
                    "message": f"Zone {zone['zone_name']} is full.",
                    "zoneId": zone_id,
                },
            )

        if not skip_rules:
            ok, violation = await validate_zone_rules(vehicle_id, zone, conn=db)
            if not ok:
                await _log_zone_event(
                    zone_id=zone_id,
                    vehicle_id=vehicle_id,
                    event_type="ZONE_RULE_VIOLATION",
                    event_note=violation or "Zone rule violation",
                    created_by=created_by,
                    conn=db,
                )
                raise HTTPException(
                    status_code=409,
                    detail={
                        "error": "ZONE_RULE_VIOLATION",
                        "message": violation or "Vehicle not allowed in this zone",
                        "zoneId": zone_id,
                    },
                )

        await db.execute(
            "UPDATE vehicles SET current_zone_id = $2::uuid, updated_at = NOW() WHERE id = $1::uuid",
            vehicle_id,
            zone_id,
        )
        await db.execute(
            """
            INSERT INTO vehicle_zone_history (
                id, vehicle_id, previous_zone_id, new_zone_id, moved_by, moved_at, reason
            )
            VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7)
            """,
            str(uuid.uuid4()),
            vehicle_id,
            prev_id,
            zone_id,
            created_by,
            _now(),
            reason,
        )

        if prev_id:
            prev = await db.fetchrow("SELECT zone_code FROM yard_zones WHERE id = $1::uuid", prev_id)
            await _log_zone_event(
                zone_id=prev_id,
                vehicle_id=vehicle_id,
                event_type="VEHICLE_EXITED_ZONE",
                event_note=f"Exited {prev['zone_code'] if prev else prev_id}" + (f" — {reason}" if reason else ""),
                created_by=created_by,
                conn=db,
            )
        await _log_zone_event(
            zone_id=zone_id,
            vehicle_id=vehicle_id,
            event_type="VEHICLE_ENTERED_ZONE",
            event_note=f"Entered {zone['zone_code']}" + (f" — {reason}" if reason else ""),
            created_by=created_by,
            conn=db,
        )
        if prev_id:
            await _log_zone_event(
                zone_id=zone_id,
                vehicle_id=vehicle_id,
                event_type="ZONE_TRANSFERRED",
                event_note=f"Transferred to {zone['zone_code']}" + (f" — {reason}" if reason else ""),
                created_by=created_by,
                conn=db,
            )

        new_occ = await _zone_occupancy(zone_id, conn=db)
        if new_occ >= zone["max_capacity"]:
            await db.execute(
                "UPDATE yard_zones SET status = 'FULL', updated_at = NOW() WHERE id = $1::uuid AND status = 'ACTIVE'",
                zone_id,
            )
        if prev_id:
            prev_occ = await _zone_occupancy(prev_id, conn=db)
            prev_zone = await db.fetchrow("SELECT max_capacity, status FROM yard_zones WHERE id = $1::uuid", prev_id)
            if prev_zone and prev_zone["status"] == "FULL" and prev_occ < prev_zone["max_capacity"]:
                await db.execute(
                    "UPDATE yard_zones SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1::uuid",
                    prev_id,
                )

        return {"vehicleId": vehicle_id, "zoneId": zone_id, "previousZoneId": prev_id}

    if conn is not None:
        return await _run(conn)
    pool = get_pool()
    async with pool.acquire() as acquired:
        async with acquired.transaction():
            return await _run(acquired)


async def sync_vehicle_zone_for_status(
    vehicle_id: str,
    status: str,
    *,
    reason: str,
    created_by: str = "system",
    conn: Any | None = None,
    skip_rules: bool = True,
) -> None:
    """Assign vehicles.current_zone_id from lifecycle status (Yard Map source of truth)."""
    zone_type = STATUS_ZONE_TYPE.get(status)
    if zone_type is None:
        db = _db(conn)

        async def _clear(connection: Any) -> None:
            await connection.execute(
                "UPDATE vehicles SET current_zone_id = NULL, updated_at = NOW() WHERE id = $1::uuid",
                vehicle_id,
            )

        if conn is not None:
            await _clear(conn)
        else:
            pool = get_pool()
            async with pool.acquire() as acquired:
                await _clear(acquired)
        return

    zone = await find_zone_by_type(zone_type, conn=conn)
    if not zone and zone_type == "LOADING":
        zone = await find_zone_by_map_code("A", conn=conn)
    if not zone:
        return
    await move_vehicle_to_zone(
        vehicle_id,
        str(zone["id"]),
        reason=reason,
        created_by=created_by,
        conn=conn,
        skip_rules=skip_rules,
    )


async def reconcile_vehicle_zones(conn: Any | None = None) -> int:
    """Backfill current_zone_id for in-yard vehicles missing zone assignment."""
    db = _db(conn)
    rows = await db.fetch(
        """
        SELECT id, status FROM vehicles
        WHERE current_zone_id IS NULL
          AND status = ANY($1::text[])
        """,
        list(IN_YARD_VEHICLE_STATUSES),
    )
    count = 0
    for row in rows:
        await sync_vehicle_zone_for_status(
            str(row["id"]),
            row["status"],
            reason=f"Reconciled zone for status {row['status']}",
            created_by="yard-reconcile",
            conn=conn,
        )
        count += 1
    return count


async def auto_move_vehicle_by_type(
    vehicle_id: str,
    zone_type: str,
    *,
    reason: str,
    created_by: str = "system",
    conn: Any | None = None,
    skip_rules: bool = False,
) -> None:
    """Flow integration helper — move vehicle to first zone of given type."""
    db = _db(conn) if conn else get_pool()
    if conn is None:
        async with db.acquire() as acquired:
            async with acquired.transaction():
                zone = await find_zone_by_type(zone_type, conn=acquired)
                if zone:
                    await move_vehicle_to_zone(
                        vehicle_id,
                        str(zone["id"]),
                        reason=reason,
                        created_by=created_by,
                        conn=acquired,
                        skip_rules=skip_rules,
                    )
        return
    zone = await find_zone_by_type(zone_type, conn=conn)
    if zone:
        await move_vehicle_to_zone(
            vehicle_id,
            str(zone["id"]),
            reason=reason,
            created_by=created_by,
            conn=conn,
            skip_rules=skip_rules,
        )


async def resolve_operation_zone_type(vehicle_id: str, conn: Any) -> str:
    """LOADING vs UNLOADING zone type from queue/appointment."""
    _, appointment, queue = await _get_vehicle_context(vehicle_id, conn)
    qt = (queue or {}).get("queue_type", "").lower()
    if "unload" in qt:
        return "UNLOADING"
    ref = (appointment or {}).get("shipment_reference", "") or ""
    if ref.lower().startswith("unloading") or "unload" in ref.lower():
        return "UNLOADING"
    return "LOADING"


async def sync_vehicle_zone_from_cargo(vehicle_id: str, conn: Any) -> None:
    """Assign HAZMAT/COLD_CHAIN map zones when cargo requires."""
    _, appointment, dock = await _get_vehicle_context(vehicle_id, conn)
    blob = _cargo_blob(appointment, dock)
    if re.search(r"hazmat|hazard|chem|class\s*3|flamm", blob, re.I):
        z = await find_zone_by_map_code("D", conn=conn)
        if z:
            await move_vehicle_to_zone(
                vehicle_id, str(z["id"]), reason="Hazmat cargo routing", created_by="yard-system", conn=conn, skip_rules=True
            )
            return
    if re.search(r"cold|pharma|refrig|freezer|reefer|chilled", blob, re.I):
        z = await find_zone_by_map_code("E", conn=conn)
        if z:
            await move_vehicle_to_zone(
                vehicle_id, str(z["id"]), reason="Cold chain routing", created_by="yard-system", conn=conn, skip_rules=True
            )
