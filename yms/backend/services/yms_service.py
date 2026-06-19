import logging
import uuid
from datetime import date, datetime, timezone
from typing import Any

from fastapi import HTTPException

from db import get_pool
from enums import (
    DIRECT_PATCH_STATUS_TARGETS,
    DOCK_MATERIAL_TYPES,
    DOCK_STATUSES,
    DOCK_TYPES,
    DOCK_VEHICLE_TYPES,
    DOCK_ZONES,
    OPERATION_TYPES,
    OPERATIONAL_LIFECYCLE_STATUSES,
    OWNERSHIP_TYPES,
    REGISTRATION_SOURCES,
    STATUS_TRANSITIONS,
    VEHICLE_STAGE_LABELS,
    YMS_STATUSES,
)


logger = logging.getLogger(__name__)


def _to_dict(record: Any) -> dict[str, Any]:
    return dict(record) if record is not None else {}


def _db(conn: Any | None) -> Any:
    return conn if conn is not None else get_pool()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _validate_status(status: str) -> None:
    if status not in YMS_STATUSES:
        raise HTTPException(status_code=400, detail=f"Unsupported status '{status}'")


def _validate_ownership(ownership_type: str) -> None:
    if ownership_type not in OWNERSHIP_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported ownership_type '{ownership_type}'")


def _validate_vehicle_type(vehicle_type: str) -> None:
    code = str(vehicle_type).strip().upper()
    if code not in DOCK_VEHICLE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported vehicle type '{vehicle_type}'")


def _validate_operation_type(operation_type: str) -> None:
    if operation_type not in OPERATION_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported operation_type '{operation_type}'")


def _validate_registration_source(source: str) -> None:
    if source not in REGISTRATION_SOURCES:
        raise HTTPException(status_code=400, detail=f"Unsupported registration_source '{source}'")


def _guard_direct_lifecycle_status_patch(
    current_status: str,
    payload: dict[str, Any],
    *,
    internal: bool,
    entity: str,
) -> None:
    """Block direct PATCH status changes into/out of operational lifecycle states."""
    if internal or "status" not in payload:
        return
    next_status = payload["status"]
    if next_status == current_status:
        return
    if next_status in DIRECT_PATCH_STATUS_TARGETS:
        return
    if (
        current_status in OPERATIONAL_LIFECYCLE_STATUSES
        or next_status in OPERATIONAL_LIFECYCLE_STATUSES
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot change {entity} status from '{current_status}' to '{next_status}' via direct update. "
                "Use gate entry, queue call, dock assignment, resource readiness, loading flow, "
                "or exit verification workflows."
            ),
        )


ACTIVE_APPOINTMENT_RESOLUTION_STATUSES = (
    "ARRIVED",
    "CHECKED_IN",
    "WAITING",
    "CALLED",
    "DOCK_ASSIGNED",
    "RESOURCE_PENDING",
    "READY_FOR_LOADING",
    "LOADING",
    "COMPLETED",
    "EXIT_HOLDING",
    "EXIT_VERIFIED",
)

ACTIVE_QUEUE_RESOLUTION_STATUSES = (
    "WAITING",
    "CHECKED_IN",
    "CALLED",
    "DOCK_ASSIGNED",
    "RESOURCE_PENDING",
    "READY_FOR_LOADING",
    "LOADING",
    "EXIT_HOLDING",
    "EXIT_VERIFIED",
)

async def resolve_active_appointment_for_vehicle(
    vehicle_id: str, conn: Any
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        SELECT *
        FROM appointments
        WHERE vehicle_id = $1::uuid
          AND status = ANY($2::text[])
        ORDER BY
          CASE status
            WHEN 'EXIT_VERIFIED' THEN 1
            WHEN 'EXIT_HOLDING' THEN 2
            WHEN 'COMPLETED' THEN 3
            WHEN 'LOADING' THEN 4
            WHEN 'READY_FOR_LOADING' THEN 5
            WHEN 'RESOURCE_PENDING' THEN 6
            WHEN 'DOCK_ASSIGNED' THEN 7
            WHEN 'CALLED' THEN 8
            WHEN 'WAITING' THEN 9
            WHEN 'CHECKED_IN' THEN 10
            WHEN 'ARRIVED' THEN 11
            ELSE 99
          END,
          created_at DESC
        LIMIT 1
        """,
        vehicle_id,
        list(ACTIVE_APPOINTMENT_RESOLUTION_STATUSES),
    )
    if row is None:
        row = await conn.fetchrow(
            """
            SELECT *
            FROM appointments
            WHERE vehicle_id = $1::uuid
              AND status <> 'CANCELLED'
            ORDER BY created_at DESC
            LIMIT 1
            """,
            vehicle_id,
        )
    return _to_dict(row) if row else None


async def resolve_active_queue_for_vehicle(vehicle_id: str, conn: Any) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        SELECT *
        FROM queue_entries
        WHERE vehicle_id = $1::uuid
          AND status = ANY($2::text[])
        ORDER BY
          CASE status
            WHEN 'EXIT_VERIFIED' THEN 1
            WHEN 'EXIT_HOLDING' THEN 2
            WHEN 'LOADING' THEN 3
            WHEN 'READY_FOR_LOADING' THEN 4
            WHEN 'RESOURCE_PENDING' THEN 5
            WHEN 'DOCK_ASSIGNED' THEN 6
            WHEN 'CALLED' THEN 7
            WHEN 'WAITING' THEN 8
            WHEN 'CHECKED_IN' THEN 9
            ELSE 99
          END,
          created_at DESC
        LIMIT 1
        """,
        vehicle_id,
        list(ACTIVE_QUEUE_RESOLUTION_STATUSES),
    )
    if row is None:
        row = await conn.fetchrow(
            """
            SELECT *
            FROM queue_entries
            WHERE vehicle_id = $1::uuid
              AND status NOT IN ('EXITED', 'CANCELLED', 'COMPLETED')
            ORDER BY created_at DESC
            LIMIT 1
            """,
            vehicle_id,
        )
    return _to_dict(row) if row else None


def _validate_dock_status_invariants(merged: dict[str, Any], current: dict[str, Any]) -> str | None:
    status = merged.get("status", current["status"])
    if "current_vehicle_id" in merged:
        cvid = merged.get("current_vehicle_id")
    else:
        cvid = current.get("current_vehicle_id")

    if status == "AVAILABLE" and cvid:
        raise HTTPException(
            status_code=409,
            detail="Invalid dock update: AVAILABLE dock cannot have current_vehicle_id",
        )
    if status == "OCCUPIED" and not cvid:
        raise HTTPException(
            status_code=409,
            detail="Invalid dock update: OCCUPIED dock requires current_vehicle_id",
        )
    return str(cvid) if cvid else None


async def _validate_dock_queue_linkage(dock_id: str, vehicle_id: str, conn: Any) -> None:
    queue_row = await resolve_active_queue_for_vehicle(vehicle_id, conn)
    if queue_row and queue_row.get("dock_id") and str(queue_row["dock_id"]) != str(dock_id):
        raise HTTPException(
            status_code=409,
            detail="Invalid dock update: vehicle queue assignment points to a different dock",
        )


async def _generate_vehicle_reference(conn: Any) -> str:
    today = date.today().strftime("%Y%m%d")
    prefix = f"VEH-{today}-"
    # Use char_length($2) on prefix string — asyncpg cannot bind integer to SUBSTRING(... FROM n).
    max_num = await conn.fetchval(
        """
        SELECT COALESCE(MAX(
            CASE WHEN vehicle_reference ~ $1
            THEN CAST(SUBSTRING(vehicle_reference FROM char_length($2) + 1) AS INTEGER)
            ELSE 0 END
        ), 0)
        FROM vehicles
        WHERE vehicle_reference LIKE $3
        """,
        f"^VEH-{today}-[0-9]+$",
        prefix,
        f"{prefix}%",
    )
    for n in range(int(max_num) + 1, int(max_num) + 500):
        ref = f"{prefix}{n:03d}"
        taken = await conn.fetchval("SELECT 1 FROM vehicles WHERE vehicle_reference = $1", ref)
        if not taken:
            return ref
    raise HTTPException(status_code=500, detail="Could not generate vehicle reference")


def _derive_current_stage(vehicle: dict[str, Any], appointment: dict[str, Any] | None) -> str:
    status = vehicle.get("status") or "SCHEDULED"
    if status != "SCHEDULED":
        return VEHICLE_STAGE_LABELS.get(status, status.replace("_", " ").title())
    reporting = None
    if appointment:
        reporting = appointment.get("reporting_time") or appointment.get("expected_arrival")
    if not reporting:
        reporting = vehicle.get("expected_arrival")
    if reporting:
        try:
            eta = reporting if isinstance(reporting, datetime) else datetime.fromisoformat(str(reporting).replace("Z", "+00:00"))
            if eta.tzinfo is None:
                eta = eta.replace(tzinfo=timezone.utc)
            mins = (eta - _now()).total_seconds() / 60
            if mins <= 30:
                return VEHICLE_STAGE_LABELS["APPROACHING"]
            if mins <= 120:
                return VEHICLE_STAGE_LABELS["EN_ROUTE"]
        except (TypeError, ValueError):
            pass
    return VEHICLE_STAGE_LABELS["SCHEDULED"]


def _validate_dock_status(status: str) -> None:
    if status not in DOCK_STATUSES:
        raise HTTPException(status_code=400, detail=f"Unsupported dock status '{status}'")


def _validate_dock_type(dock_type: str) -> None:
    if dock_type not in DOCK_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported dock type '{dock_type}'")


def _validate_dock_zone(zone: str) -> None:
    if zone not in DOCK_ZONES:
        raise HTTPException(status_code=400, detail=f"Unsupported zone '{zone}'")


_DOCK_TYPE_RESERVED = {"CUSTOM"}
_STANDARD_DOCK_VEHICLE_TYPES = DOCK_VEHICLE_TYPES - _DOCK_TYPE_RESERVED
_STANDARD_DOCK_MATERIAL_TYPES = DOCK_MATERIAL_TYPES - _DOCK_TYPE_RESERVED


def _normalize_dock_type_label(value: str) -> str:
    return " ".join(str(value or "").strip().upper().split())


def _is_valid_custom_dock_type(code: str) -> bool:
    if len(code) < 2 or len(code) > 64:
        return False
    if code in _DOCK_TYPE_RESERVED:
        return False
    return bool(__import__("re").match(r"^[A-Z0-9][A-Z0-9 \-]*[A-Z0-9]$|^[A-Z0-9]{2}$", code))


def _validate_dock_vehicle_types(types: list[str]) -> list[str]:
    if not types:
        raise HTTPException(status_code=400, detail="At least one supported vehicle type is required")
    cleaned: list[str] = []
    for t in types:
        code = _normalize_dock_type_label(t)
        if not code or code in _DOCK_TYPE_RESERVED:
            continue
        if code in _STANDARD_DOCK_VEHICLE_TYPES:
            pass
        elif not _is_valid_custom_dock_type(code):
            raise HTTPException(status_code=400, detail=f"Invalid vehicle type '{t}'")
        if code not in cleaned:
            cleaned.append(code)
    if not cleaned:
        raise HTTPException(status_code=400, detail="At least one supported vehicle type is required")
    return cleaned


def _validate_dock_material_types(types: list[str]) -> list[str]:
    if not types:
        raise HTTPException(status_code=400, detail="At least one supported material type is required")
    cleaned: list[str] = []
    for t in types:
        code = _normalize_dock_type_label(t)
        if not code or code in _DOCK_TYPE_RESERVED:
            continue
        if code in _STANDARD_DOCK_MATERIAL_TYPES:
            pass
        elif not _is_valid_custom_dock_type(code):
            raise HTTPException(status_code=400, detail=f"Invalid material type '{t}'")
        if code not in cleaned:
            cleaned.append(code)
    if not cleaned:
        raise HTTPException(status_code=400, detail="At least one supported material type is required")
    return cleaned


_DOCK_NON_ASSIGNABLE = {"MAINTENANCE", "BLOCKED", "OUT_OF_SERVICE", "RESOURCE_PENDING", "READY_FOR_LOADING"}


async def _generate_dock_code(conn: Any) -> str:
    # Only count sequential DK-NNN codes; ignore legacy timestamp codes (e.g. DK-20260602152409).
    max_num = await conn.fetchval(
        """
        SELECT COALESCE(MAX(
            CASE WHEN dock_code ~ '^DK-[0-9]{1,4}$'
                 AND LENGTH(SUBSTRING(dock_code FROM 4)) <= 4
            THEN CAST(SUBSTRING(dock_code FROM 4) AS INTEGER)
            ELSE 0 END
        ), 0)
        FROM docks
        """
    )
    for n in range(int(max_num) + 1, int(max_num) + 200):
        code = f"DK-{n:03d}"
        taken = await conn.fetchval("SELECT 1 FROM docks WHERE dock_code = $1", code)
        if not taken:
            return code
    raise HTTPException(status_code=500, detail="Could not generate dock code")


async def _log_dock_event(
    *,
    dock_id: str,
    event_type: str,
    event_note: str | None,
    created_by: str,
    vehicle_id: str | None = None,
    queue_entry_id: str | None = None,
    conn: Any,
) -> None:
    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=None,
        queue_entry_id=queue_entry_id,
        dock_id=dock_id,
        event_type=event_type,
        event_note=event_note,
        created_by=created_by,
        conn=conn,
    )


async def _release_vehicle_dock_assignments(
    vehicle_id: str,
    *,
    conn: Any,
    created_by: str,
    queue_entry_id: str | None = None,
    explicit_dock_id: str | None = None,
    lifecycle_status: str,
) -> None:
    """Release dock occupancy by queue dock_id and/or docks.current_vehicle_id."""
    dock_ids: set[str] = set()
    if explicit_dock_id:
        dock_ids.add(str(explicit_dock_id))
    if queue_entry_id:
        row = await conn.fetchrow(
            "SELECT dock_id FROM queue_entries WHERE id = $1::uuid",
            queue_entry_id,
        )
        if row and row.get("dock_id"):
            dock_ids.add(str(row["dock_id"]))
    occupied = await conn.fetch(
        "SELECT id FROM docks WHERE current_vehicle_id = $1::uuid",
        vehicle_id,
    )
    for row in occupied:
        dock_ids.add(str(row["id"]))

    for dock_id in dock_ids:
        dock = await get_dock(dock_id, conn=conn)
        await conn.execute(
            """
            UPDATE docks SET
                status = 'AVAILABLE',
                current_vehicle_id = NULL,
                assigned_since = NULL,
                updated_at = NOW()
            WHERE id = $1::uuid
            """,
            dock_id,
        )
        await _log_dock_event(
            dock_id=dock_id,
            event_type="DOCK_RELEASED",
            event_note=f"Dock {dock['dock_code']} released after vehicle {lifecycle_status.lower()}",
            created_by=created_by,
            vehicle_id=vehicle_id,
            queue_entry_id=queue_entry_id,
            conn=conn,
        )

    await conn.execute(
        """
        UPDATE queue_entries SET
            dock_id = NULL,
            updated_at = NOW()
        WHERE vehicle_id = $1::uuid
          AND dock_id IS NOT NULL
        """,
        vehicle_id,
    )


def _validate_transition(current_status: str, next_status: str) -> None:
    allowed = STATUS_TRANSITIONS.get(current_status, set())
    if next_status not in allowed and next_status != current_status:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid status transition from '{current_status}' to '{next_status}'",
        )


async def create_yard_event(
    *,
    vehicle_id: str | None,
    appointment_id: str | None,
    queue_entry_id: str | None,
    dock_id: str | None,
    equipment_id: str | None = None,
    labor_id: str | None = None,
    event_type: str,
    event_note: str | None,
    created_by: str,
    event_time: datetime | None = None,
    conn: Any | None = None,
) -> dict[str, Any]:
    db = _db(conn)
    event_id = str(uuid.uuid4())
    timestamp = event_time or _now()
    row = await db.fetchrow(
        """
        INSERT INTO yard_events (
            id, vehicle_id, appointment_id, queue_entry_id, dock_id, equipment_id, labor_id,
            event_type, event_time, event_note, created_by, created_at, updated_at
        )
        VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
        """,
        event_id,
        vehicle_id,
        appointment_id,
        queue_entry_id,
        dock_id,
        equipment_id,
        labor_id,
        event_type,
        timestamp,
        event_note,
        created_by,
    )
    return _to_dict(row)


async def create_vehicle(payload: dict[str, Any]) -> dict[str, Any]:
    logger.info(
        "create_vehicle start plate=%s source=%s operation=%s",
        payload.get("vehicle_number"),
        payload.get("registration_source"),
        payload.get("operation_type"),
    )
    try:
        _validate_ownership(payload["ownership_type"])
        _validate_status(payload["status"])
        vehicle_type = str(payload["vehicle_type"]).strip().upper()
        _validate_vehicle_type(vehicle_type)
        operation_type = payload.get("operation_type", "Loading")
        _validate_operation_type(operation_type)
        registration_source = payload.get("registration_source", "manual")
        _validate_registration_source(registration_source)
        material_type = str(payload.get("material_type", "GENERAL")).strip().upper()
        if material_type not in DOCK_MATERIAL_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported material_type '{material_type}'")

        driver_name = (payload.get("driver_name") or "").strip() or None
        driver_phone = (payload.get("driver_phone") or "").strip() or None
        display_name = (payload.get("display_name") or "").strip() or payload["vehicle_number"].strip()

        pool = get_pool()
        vehicle_id = str(uuid.uuid4())
        async with pool.acquire() as conn:
            async with conn.transaction():
                vehicle_reference = await _generate_vehicle_reference(conn)
                logger.debug(
                    "create_vehicle generated reference=%s for plate=%s",
                    vehicle_reference,
                    payload.get("vehicle_number"),
                )
                try:
                    row = await conn.fetchrow(
                        """
                        INSERT INTO vehicles (
                            id, vehicle_reference, vehicle_number, display_name,
                            vehicle_type, ownership_type, operation_type, material_type,
                            transporter_name, driver_name, driver_phone,
                            expected_arrival, remarks, registration_source,
                            status, created_at, updated_at
                        )
                        VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                            $12, $13, $14, $15, NOW(), NOW()
                        )
                        RETURNING *
                        """,
                        vehicle_id,
                        vehicle_reference,
                        payload["vehicle_number"].strip().upper(),
                        display_name,
                        vehicle_type,
                        payload["ownership_type"],
                        operation_type,
                        material_type,
                        payload["transporter_name"].strip(),
                        driver_name,
                        driver_phone,
                        payload.get("expected_arrival"),
                        payload.get("remarks"),
                        registration_source,
                        payload["status"],
                    )
                except Exception as exc:
                    logger.exception(
                        "create_vehicle INSERT failed plate=%s reference=%s",
                        payload.get("vehicle_number"),
                        vehicle_reference,
                    )
                    if "vehicles_vehicle_number_key" in str(exc):
                        raise HTTPException(status_code=409, detail="Vehicle number already exists") from exc
                    if "vehicles_vehicle_reference_key" in str(exc):
                        raise HTTPException(status_code=409, detail="Vehicle reference collision") from exc
                    raise
                await create_yard_event(
                    vehicle_id=vehicle_id,
                    appointment_id=None,
                    queue_entry_id=None,
                    dock_id=None,
                    event_type="VEHICLE_CREATED",
                    event_note=f"{vehicle_reference} · {payload['vehicle_number']} registered ({registration_source})",
                    created_by=payload.get("created_by", "system"),
                    conn=conn,
                )
                from services.yard_service import sync_vehicle_zone_for_status

                await sync_vehicle_zone_for_status(
                    vehicle_id,
                    payload["status"],
                    reason="Vehicle registered",
                    created_by=payload.get("created_by", "system"),
                    conn=conn,
                )
        result = _to_dict(row)
        logger.info(
            "create_vehicle success id=%s reference=%s plate=%s",
            result.get("id"),
            result.get("vehicle_reference"),
            result.get("vehicle_number"),
        )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("create_vehicle failed plate=%s", payload.get("vehicle_number"))
        raise


async def list_vehicles(
    *,
    q: str | None = None,
    status: str | None = None,
    ownership_type: str | None = None,
    skip: int = 0,
    limit: int | None = None,
) -> tuple[list[dict[str, Any]], int]:
    from services.list_filters import query_rows

    eq = {}
    if status:
        eq["status"] = status
    if ownership_type:
        eq["ownership_type"] = ownership_type
    return await query_rows(
        "vehicles",
        "updated_at DESC",
        search_columns=[
            "vehicle_reference",
            "vehicle_number",
            "display_name",
            "transporter_name",
            "driver_name",
            "driver_phone",
            "status",
            "material_type",
            "operation_type",
        ],
        q=q,
        eq_filters=eq,
        skip=skip,
        limit=limit,
    )


async def get_vehicle_journey(vehicle_id: str) -> dict[str, Any]:
    vehicle = await get_vehicle(vehicle_id)
    pool = get_pool()
    async with pool.acquire() as conn:
        appointment = await conn.fetchrow(
            """
            SELECT * FROM appointments
            WHERE vehicle_id = $1::uuid
            ORDER BY created_at DESC
            LIMIT 1
            """,
            vehicle_id,
        )
        queue_entry = await conn.fetchrow(
            """
            SELECT * FROM queue_entries
            WHERE vehicle_id = $1::uuid
            ORDER BY created_at DESC
            LIMIT 1
            """,
            vehicle_id,
        )
        dock = None
        if queue_entry and queue_entry.get("dock_id"):
            dock = await conn.fetchrow("SELECT * FROM docks WHERE id = $1::uuid", queue_entry["dock_id"])
        if dock is None:
            dock = await conn.fetchrow(
                "SELECT * FROM docks WHERE current_vehicle_id = $1::uuid LIMIT 1",
                vehicle_id,
            )
        labor = await conn.fetchrow(
            "SELECT * FROM labor_teams WHERE assigned_vehicle_id = $1::uuid LIMIT 1",
            vehicle_id,
        )
        equipment = await conn.fetchrow(
            "SELECT * FROM equipment WHERE assigned_vehicle_id = $1::uuid LIMIT 1",
            vehicle_id,
        )
        zone_row = None
        if vehicle.get("current_zone_id"):
            zone_row = await conn.fetchrow(
                "SELECT zone_name, zone_code FROM yard_zones WHERE id = $1::uuid",
                vehicle["current_zone_id"],
            )
        appt_id = str(appointment["id"]) if appointment else None
        queue_id = str(queue_entry["id"]) if queue_entry else None
        event_rows = await conn.fetch(
            """
            SELECT * FROM yard_events
            WHERE vehicle_id = $1::uuid
               OR ($2::uuid IS NOT NULL AND appointment_id = $2::uuid)
               OR ($3::uuid IS NOT NULL AND queue_entry_id = $3::uuid)
            ORDER BY event_time ASC
            """,
            vehicle_id,
            appt_id,
            queue_id,
        )

    from services.resource_gating_service import validate_resource_readiness_for_loading

    readiness = await validate_resource_readiness_for_loading(vehicle_id, enforce_queue_dock=False)
    appt_dict = _to_dict(appointment) if appointment else None
    queue_dict = _to_dict(queue_entry) if queue_entry else None
    dock_dict = _to_dict(dock) if dock else None
    events = [_to_dict(e) for e in event_rows]

    loading_started = next((e for e in reversed(events) if e.get("event_type") == "LOADING_STARTED"), None)
    loading_completed = next((e for e in reversed(events) if e.get("event_type") == "LOADING_COMPLETED"), None)
    loading = None
    if queue_dict or loading_started:
        progress_pct = 0
        if vehicle.get("status") == "LOADING":
            progress_pct = 45
        elif vehicle.get("status") in {"COMPLETED", "EXITED"}:
            progress_pct = 100
        elif vehicle.get("status") == "READY_FOR_LOADING":
            progress_pct = 10
        loading = {
            "jobRef": queue_dict.get("queue_number") if queue_dict else None,
            "operationType": vehicle.get("operation_type") or "Loading",
            "progressPct": progress_pct,
            "startedAt": loading_started.get("event_time") if loading_started else queue_dict.get("dock_assigned_time") if queue_dict else None,
            "completedAt": loading_completed.get("event_time") if loading_completed else None,
            "status": vehicle.get("status"),
        }

    return {
        "vehicle": vehicle,
        "appointment": appt_dict,
        "queue_entry": queue_dict,
        "dock": dock_dict,
        "labor": _to_dict(labor) if labor else None,
        "equipment": _to_dict(equipment) if equipment else None,
        "readiness": readiness,
        "zone_name": zone_row["zone_name"] if zone_row else None,
        "zone_code": zone_row["zone_code"] if zone_row else None,
        "events": events,
        "loading": loading,
        "current_stage": _derive_current_stage(vehicle, appt_dict),
        "queue_status": queue_dict.get("status") if queue_dict else None,
    }


async def get_vehicle(vehicle_id: str, conn: Any | None = None) -> dict[str, Any]:
    db = _db(conn)
    row = await db.fetchrow("SELECT * FROM vehicles WHERE id = $1::uuid", vehicle_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return _to_dict(row)


async def update_vehicle(
    vehicle_id: str,
    payload: dict[str, Any],
    conn: Any | None = None,
    *,
    internal: bool = False,
) -> dict[str, Any]:
    db = _db(conn)
    current_row = await db.fetchrow("SELECT * FROM vehicles WHERE id = $1::uuid", vehicle_id)
    if current_row is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    current = _to_dict(current_row)
    _guard_direct_lifecycle_status_patch(
        current["status"], payload, internal=internal, entity="vehicle"
    )
    next_status = payload.get("status", current["status"])
    _validate_status(next_status)
    if "status" in payload:
        _validate_transition(current["status"], next_status)
    if "ownership_type" in payload:
        _validate_ownership(payload["ownership_type"])

    merged = {**current, **payload}
    try:
        row = await db.fetchrow(
            """
            UPDATE vehicles
            SET vehicle_type = $2,
                ownership_type = $3,
                transporter_name = $4,
                driver_name = $5,
                driver_phone = $6,
                status = $7,
                updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING *
            """,
            vehicle_id,
            merged["vehicle_type"],
            merged["ownership_type"],
            merged["transporter_name"],
            merged["driver_name"],
            merged["driver_phone"],
            merged["status"],
        )
    except Exception as exc:
        if "vehicles_vehicle_number_key" in str(exc):
            raise HTTPException(status_code=409, detail="Vehicle number already exists") from exc
        raise
    if payload.get("status") and payload["status"] != current["status"]:
        await create_yard_event(
            vehicle_id=vehicle_id,
            appointment_id=None,
            queue_entry_id=None,
            dock_id=None,
            event_type="VEHICLE_STATUS_CHANGED",
            event_note=f"{current['status']} -> {payload['status']}",
            created_by="system",
            conn=conn,
        )
        from services.yard_service import sync_vehicle_zone_for_status

        await sync_vehicle_zone_for_status(
            vehicle_id,
            payload["status"],
            reason=f"Status {current['status']} → {payload['status']}",
            created_by=payload.get("created_by", "system"),
            conn=conn,
        )
    return _to_dict(row)


async def create_appointment(payload: dict[str, Any]) -> dict[str, Any]:
    logger.info(
        "create_appointment start booking_ref=%s vehicle_id=%s gate=%s slot=%s",
        payload.get("booking_reference"),
        payload.get("vehicle_id"),
        payload.get("gate_number"),
        payload.get("scheduled_slot"),
    )
    try:
        _validate_status(payload["status"])
        pool = get_pool()
        appointment_id = str(uuid.uuid4())
        async with pool.acquire() as conn:
            async with conn.transaction():
                vehicle_row = await conn.fetchrow("SELECT id FROM vehicles WHERE id = $1::uuid", payload["vehicle_id"])
                if vehicle_row is None:
                    logger.warning(
                        "create_appointment vehicle not found vehicle_id=%s booking_ref=%s",
                        payload.get("vehicle_id"),
                        payload.get("booking_reference"),
                    )
                    raise HTTPException(status_code=404, detail="Vehicle not found")
                try:
                    row = await conn.fetchrow(
                        """
                        INSERT INTO appointments (
                            id, booking_reference, vehicle_id, customer_name, shipment_reference,
                            booking_date, reporting_time, scheduled_slot, gate_number, priority,
                            status, remarks, created_at, updated_at
                        )
                        VALUES (
                            $1, $2, $3::uuid, $4, $5,
                            $6, $7, $8, $9, $10,
                            $11, $12, NOW(), NOW()
                        )
                        RETURNING *
                        """,
                        appointment_id,
                        payload["booking_reference"],
                        payload["vehicle_id"],
                        payload["customer_name"],
                        payload["shipment_reference"],
                        payload["booking_date"],
                        payload["reporting_time"],
                        payload["scheduled_slot"],
                        payload["gate_number"],
                        payload["priority"],
                        payload["status"],
                        payload.get("remarks"),
                    )
                except Exception as exc:
                    logger.exception(
                        "create_appointment INSERT failed booking_ref=%s vehicle_id=%s",
                        payload.get("booking_reference"),
                        payload.get("vehicle_id"),
                    )
                    if "appointments_booking_reference_key" in str(exc):
                        raise HTTPException(status_code=409, detail="Booking reference already exists") from exc
                    raise
                created_by = payload.get("created_by", "appointments-ui")
                await create_yard_event(
                    vehicle_id=payload["vehicle_id"],
                    appointment_id=appointment_id,
                    queue_entry_id=None,
                    dock_id=None,
                    event_type="APPOINTMENT_CREATED",
                    event_note=f"Booking {payload['booking_reference']} created",
                    created_by=created_by,
                    conn=conn,
                )
                await create_yard_event(
                    vehicle_id=payload["vehicle_id"],
                    appointment_id=appointment_id,
                    queue_entry_id=None,
                    dock_id=None,
                    event_type="APPOINTMENT_CONFIRMED",
                    event_note=f"Appointment confirmed — {payload['scheduled_slot']} @ {payload['gate_number']}",
                    created_by=created_by,
                    conn=conn,
                )
        result = _to_dict(row)
        logger.info(
            "create_appointment success id=%s booking_ref=%s vehicle_id=%s",
            result.get("id"),
            result.get("booking_reference"),
            result.get("vehicle_id"),
        )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "create_appointment failed booking_ref=%s vehicle_id=%s",
            payload.get("booking_reference"),
            payload.get("vehicle_id"),
        )
        raise


async def list_appointments(
    *,
    q: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> tuple[list[dict[str, Any]], int]:
    from services.list_filters import query_rows

    eq = {}
    if status:
        eq["status"] = status
    return await query_rows(
        "appointments",
        "created_at DESC",
        search_columns=["booking_reference", "customer_name", "shipment_reference", "gate_number", "status"],
        q=q,
        eq_filters=eq,
        skip=skip,
        limit=limit,
        date_column="booking_date" if (date_from or date_to) else None,
        date_from=date_from,
        date_to=date_to,
    )


async def get_appointment(appointment_id: str, conn: Any | None = None) -> dict[str, Any]:
    db = _db(conn)
    row = await db.fetchrow("SELECT * FROM appointments WHERE id = $1::uuid", appointment_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return _to_dict(row)


async def update_appointment(
    appointment_id: str,
    payload: dict[str, Any],
    conn: Any | None = None,
    *,
    internal: bool = False,
) -> dict[str, Any]:
    db = _db(conn)
    current = await get_appointment(appointment_id, conn=conn)
    _guard_direct_lifecycle_status_patch(
        current["status"], payload, internal=internal, entity="appointment"
    )
    next_status = payload.get("status", current["status"])
    _validate_status(next_status)
    if "status" in payload:
        _validate_transition(current["status"], next_status)

    merged = {**current, **payload}
    row = await db.fetchrow(
        """
        UPDATE appointments
        SET customer_name = $2,
            shipment_reference = $3,
            booking_date = $4,
            reporting_time = $5,
            scheduled_slot = $6,
            gate_number = $7,
            priority = $8,
            status = $9,
            remarks = $10,
            updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING *
        """,
        appointment_id,
        merged["customer_name"],
        merged["shipment_reference"],
        merged["booking_date"],
        merged["reporting_time"],
        merged["scheduled_slot"],
        merged["gate_number"],
        merged["priority"],
        merged["status"],
        merged.get("remarks"),
    )
    created_by = payload.get("created_by", "appointments-ui")
    status_changed = payload.get("status") and payload["status"] != current["status"]
    schedule_changed = any(
        payload.get(k) is not None and payload.get(k) != current.get(k)
        for k in ("booking_date", "reporting_time", "scheduled_slot", "gate_number")
    )
    other_changed = any(
        payload.get(k) is not None and payload.get(k) != current.get(k)
        for k in ("customer_name", "shipment_reference", "priority", "remarks")
    )

    if status_changed:
        new_status = payload["status"]
        if new_status == "CANCELLED":
            await create_yard_event(
                vehicle_id=current["vehicle_id"],
                appointment_id=appointment_id,
                queue_entry_id=None,
                dock_id=None,
                event_type="APPOINTMENT_CANCELLED",
                event_note=payload.get("remarks") or f"Appointment {current['booking_reference']} cancelled",
                created_by=created_by,
                conn=conn,
            )
        else:
            await create_yard_event(
                vehicle_id=current["vehicle_id"],
                appointment_id=appointment_id,
                queue_entry_id=None,
                dock_id=None,
                event_type="APPOINTMENT_STATUS_CHANGED",
                event_note=f"{current['status']} -> {new_status}",
                created_by=created_by,
                conn=conn,
            )
    if schedule_changed and not (status_changed and payload.get("status") == "CANCELLED"):
        await create_yard_event(
            vehicle_id=current["vehicle_id"],
            appointment_id=appointment_id,
            queue_entry_id=None,
            dock_id=None,
            event_type="APPOINTMENT_RESCHEDULED",
            event_note=f"Rescheduled to {merged['scheduled_slot']} on {merged['booking_date']} @ {merged['gate_number']}",
            created_by=created_by,
            conn=conn,
        )
    if other_changed and not status_changed and not schedule_changed:
        await create_yard_event(
            vehicle_id=current["vehicle_id"],
            appointment_id=appointment_id,
            queue_entry_id=None,
            dock_id=None,
            event_type="APPOINTMENT_UPDATED",
            event_note=payload.get("remarks") or "Appointment details updated",
            created_by=created_by,
            conn=conn,
        )
    elif other_changed and (status_changed or schedule_changed):
        await create_yard_event(
            vehicle_id=current["vehicle_id"],
            appointment_id=appointment_id,
            queue_entry_id=None,
            dock_id=None,
            event_type="APPOINTMENT_UPDATED",
            event_note="Appointment fields updated",
            created_by=created_by,
            conn=conn,
        )
    return _to_dict(row)


def calculate_priority_score(priority: int, reporting_time: datetime) -> int:
    lateness_minutes = max(int((_now() - reporting_time).total_seconds() // 60), 0)
    return (priority * 10) + min(lateness_minutes, 120)


async def create_queue_entry(payload: dict[str, Any], conn: Any | None = None) -> dict[str, Any]:
    db = _db(conn)
    appointment = await get_appointment(payload["appointment_id"], conn=conn)
    vehicle_id = appointment["vehicle_id"]
    priority_score = calculate_priority_score(appointment["priority"], appointment["reporting_time"])
    status = "WAITING"

    queue_entry_id = str(uuid.uuid4())
    try:
        row = await db.fetchrow(
            """
            INSERT INTO queue_entries (
                id, appointment_id, vehicle_id, queue_number, queue_type,
                priority_score, checkin_time, called_time, dock_assigned_time, dock_id,
                status, created_at, updated_at
            )
            VALUES (
                $1, $2::uuid, $3::uuid, $4, $5,
                $6, $7, NULL, NULL, NULL,
                $8, NOW(), NOW()
            )
            RETURNING *
            """,
            queue_entry_id,
            payload["appointment_id"],
            vehicle_id,
            payload["queue_number"],
            payload["queue_type"],
            priority_score,
            payload.get("checkin_time") or _now(),
            status,
        )
    except Exception as exc:
        if "queue_entries_queue_number_key" in str(exc):
            raise HTTPException(status_code=409, detail="Queue number already exists") from exc
        if "queue_entries_appointment_id_key" in str(exc):
            raise HTTPException(status_code=409, detail="Queue entry already exists for appointment") from exc
        raise

    await update_appointment(
        payload["appointment_id"], {"status": "CHECKED_IN"}, conn=conn, internal=True
    )
    await update_vehicle(vehicle_id, {"status": "CHECKED_IN"}, conn=conn, internal=True)
    await update_appointment(
        payload["appointment_id"], {"status": "WAITING"}, conn=conn, internal=True
    )
    await update_vehicle(vehicle_id, {"status": "WAITING"}, conn=conn, internal=True)
    await create_yard_event(
        vehicle_id=vehicle_id,
        appointment_id=payload["appointment_id"],
        queue_entry_id=queue_entry_id,
        dock_id=None,
        event_type="QUEUE_ENTRY_CREATED",
        event_note=f"Queue {payload['queue_number']} created",
        created_by="system",
        conn=conn,
    )
    return _to_dict(row)


async def list_queue_entries(
    *,
    q: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int | None = None,
    dock_id: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    from services.list_filters import query_rows

    eq = {}
    if status:
        eq["status"] = status
    return await query_rows(
        "queue_entries",
        "priority_score DESC, created_at DESC",
        search_columns=["queue_number", "queue_type", "status"],
        q=q,
        eq_filters=eq,
        skip=skip,
        limit=limit,
        dock_id=dock_id,
    )


async def get_queue_entry(queue_entry_id: str, conn: Any | None = None) -> dict[str, Any]:
    db = _db(conn)
    row = await db.fetchrow("SELECT * FROM queue_entries WHERE id = $1::uuid", queue_entry_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    return _to_dict(row)


async def update_queue_entry(
    queue_entry_id: str,
    payload: dict[str, Any],
    conn: Any | None = None,
    *,
    internal: bool = False,
) -> dict[str, Any]:
    db = _db(conn)
    current = await get_queue_entry(queue_entry_id, conn=conn)
    _guard_direct_lifecycle_status_patch(
        current["status"], payload, internal=internal, entity="queue entry"
    )
    merged = {**current, **payload}
    if "status" in payload:
        _validate_status(payload["status"])
        _validate_transition(current["status"], payload["status"])
    row = await db.fetchrow(
        """
        UPDATE queue_entries
        SET queue_type = $2,
            priority_score = $3,
            called_time = $4,
            dock_assigned_time = $5,
            status = $6,
            updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING *
        """,
        queue_entry_id,
        merged["queue_type"],
        merged["priority_score"],
        merged.get("called_time"),
        merged.get("dock_assigned_time"),
        merged["status"],
    )
    return _to_dict(row)


async def create_dock(payload: dict[str, Any]) -> dict[str, Any]:
    status = payload.get("status", "AVAILABLE")
    _validate_dock_status(status)
    dock_type = payload["dock_type"]
    _validate_dock_type(dock_type)
    zone = payload["zone"]
    _validate_dock_zone(zone)
    vehicle_types = _validate_dock_vehicle_types(payload["supported_vehicle_types"])
    material_types = _validate_dock_material_types(payload["supported_cargo_types"])

    pool = get_pool()
    dock_id = str(uuid.uuid4())
    async with pool.acquire() as conn:
        async with conn.transaction():
            dock_code = await _generate_dock_code(conn)
            try:
                row = await conn.fetchrow(
                    """
                    INSERT INTO docks (
                        id, dock_code, dock_name, dock_type, zone,
                        supported_vehicle_types, supported_cargo_types,
                        max_capacity, status, notes,
                        estimated_service_time_min, default_labor_id, default_equipment_id,
                        current_vehicle_id, assigned_since, created_at, updated_at
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6::text[], $7::text[], $8, $9, $10,
                        $11, $12::uuid, $13::uuid,
                        NULL, NULL, NOW(), NOW()
                    )
                    RETURNING *
                    """,
                    dock_id,
                    dock_code,
                    payload["dock_name"].strip(),
                    dock_type,
                    zone,
                    vehicle_types,
                    material_types,
                    payload.get("max_capacity", 1),
                    status,
                    payload.get("notes"),
                    payload.get("estimated_service_time_min", 90),
                    None,
                    None,
                )
            except Exception as exc:
                if "docks_dock_code_key" in str(exc):
                    raise HTTPException(status_code=409, detail="Dock code already exists") from exc
                raise
            await _log_dock_event(
                dock_id=dock_id,
                event_type="DOCK_CREATED",
                event_note=payload.get("notes") or f"Dock {dock_code} · {payload['dock_name']} created",
                created_by=payload.get("created_by", "docks-ui"),
                conn=conn,
            )
    return _to_dict(row)


async def list_docks(
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
        "docks",
        "dock_code ASC",
        search_columns=["dock_code", "dock_name", "dock_type", "zone", "status"],
        q=q,
        eq_filters=eq,
        skip=skip,
        limit=limit,
    )


async def get_dock(dock_id: str, conn: Any | None = None) -> dict[str, Any]:
    db = _db(conn)
    row = await db.fetchrow("SELECT * FROM docks WHERE id = $1::uuid", dock_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Dock not found")
    return _to_dict(row)


async def update_dock(dock_id: str, payload: dict[str, Any], conn: Any | None = None) -> dict[str, Any]:
    own_conn = conn is None
    pool = get_pool()
    db = conn if conn is not None else pool
    current = await get_dock(dock_id, conn=conn)
    merged = {**current, **payload}
    if "status" in payload and payload["status"] is not None:
        _validate_dock_status(payload["status"])
    if "dock_type" in payload and payload["dock_type"] is not None:
        _validate_dock_type(payload["dock_type"])
    if "zone" in payload and payload["zone"] is not None:
        _validate_dock_zone(payload["zone"])
    if payload.get("supported_vehicle_types") is not None:
        merged["supported_vehicle_types"] = _validate_dock_vehicle_types(payload["supported_vehicle_types"])
    if payload.get("supported_cargo_types") is not None:
        merged["supported_cargo_types"] = _validate_dock_material_types(payload["supported_cargo_types"])
    if merged.get("current_vehicle_id"):
        await get_vehicle(merged["current_vehicle_id"], conn=conn)

    linked_vehicle_id = _validate_dock_status_invariants(merged, current)

    async def _run_update(connection: Any) -> dict[str, Any]:
        if linked_vehicle_id:
            await _validate_dock_queue_linkage(dock_id, linked_vehicle_id, connection)
        row = await connection.fetchrow(
            """
            UPDATE docks
            SET dock_name = $2,
                dock_type = $3,
                zone = $4,
                supported_vehicle_types = $5::text[],
                supported_cargo_types = $6::text[],
                max_capacity = $7,
                status = $8,
                current_vehicle_id = $9::uuid,
                notes = $10,
                estimated_service_time_min = $11,
                default_labor_id = $12::uuid,
                default_equipment_id = $13::uuid,
                updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING *
            """,
            dock_id,
            merged["dock_name"],
            merged["dock_type"],
            merged.get("zone"),
            merged["supported_vehicle_types"],
            merged["supported_cargo_types"],
            merged.get("max_capacity", 1),
            merged["status"],
            merged.get("current_vehicle_id"),
            merged.get("notes"),
            merged.get("estimated_service_time_min", 90),
            merged.get("default_labor_id"),
            merged.get("default_equipment_id"),
        )
        if payload.get("created_by") or payload.get("event_note"):
            await _log_dock_event(
                dock_id=dock_id,
                event_type="DOCK_UPDATED",
                event_note=payload.get("event_note") or f"Dock {current['dock_code']} updated",
                created_by=payload.get("created_by", "docks-ui"),
                vehicle_id=str(current["current_vehicle_id"]) if current.get("current_vehicle_id") else None,
                conn=connection,
            )
            new_status = merged.get("status", current["status"])
            if new_status != current["status"]:
                await _log_dock_event(
                    dock_id=dock_id,
                    event_type="DOCK_STATUS_CHANGED",
                    event_note=f"Status {current['status']} → {new_status}",
                    created_by=payload.get("created_by", "docks-ui"),
                    conn=connection,
                )
        return _to_dict(row)

    if own_conn:
        async with pool.acquire() as acquired:
            async with acquired.transaction():
                return await _run_update(acquired)
    return await _run_update(db)


async def list_yard_events(
    *,
    q: str | None = None,
    skip: int = 0,
    limit: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> tuple[list[dict[str, Any]], int]:
    from services.list_filters import query_rows

    return await query_rows(
        "yard_events",
        "event_time DESC",
        search_columns=["event_type", "event_note", "created_by"],
        q=q,
        skip=skip,
        limit=limit,
        date_column="event_time" if (date_from or date_to) else None,
        date_from=date_from,
        date_to=date_to,
    )


async def get_yard_event(event_id: str) -> dict[str, Any]:
    pool = get_pool()
    row = await pool.fetchrow("SELECT * FROM yard_events WHERE id = $1::uuid", event_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Yard event not found")
    return _to_dict(row)


async def check_in_vehicle(
    appointment_id: str,
    queue_number: str,
    queue_type: str,
    *,
    conn: Any | None = None,
) -> dict[str, Any]:
    async def _run(connection: Any) -> dict[str, Any]:
        queue = await create_queue_entry(
            {
                "appointment_id": appointment_id,
                "queue_number": queue_number,
                "queue_type": queue_type,
                "checkin_time": _now(),
            },
            conn=connection,
        )
        await create_yard_event(
            vehicle_id=queue["vehicle_id"],
            appointment_id=appointment_id,
            queue_entry_id=queue["id"],
            dock_id=None,
            event_type="VEHICLE_CHECKED_IN",
            event_note=f"Checked in with queue {queue_number}",
            created_by="system",
            conn=connection,
        )
        return queue

    if conn is not None:
        return await _run(conn)
    pool = get_pool()
    async with pool.acquire() as acquired:
        async with acquired.transaction():
            return await _run(acquired)


async def mark_called(queue_entry_id: str, created_by: str) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            queue = await get_queue_entry(queue_entry_id, conn=conn)
            if queue["status"] not in {"WAITING", "CHECKED_IN"}:
                raise HTTPException(status_code=409, detail="Queue entry is not in callable state")
            updated_queue = await update_queue_entry(
                queue_entry_id,
                {
                    "status": "CALLED",
                    "called_time": _now(),
                },
                conn=conn,
                internal=True,
            )
            await update_vehicle(
                queue["vehicle_id"], {"status": "CALLED"}, conn=conn, internal=True
            )
            await update_appointment(
                queue["appointment_id"], {"status": "CALLED"}, conn=conn, internal=True
            )
            await create_yard_event(
                vehicle_id=queue["vehicle_id"],
                appointment_id=queue["appointment_id"],
                queue_entry_id=queue_entry_id,
                dock_id=None,
                event_type="VEHICLE_CALLED",
                event_note="Vehicle called from queue",
                created_by=created_by,
                conn=conn,
            )
            await create_yard_event(
                vehicle_id=queue["vehicle_id"],
                appointment_id=queue["appointment_id"],
                queue_entry_id=queue_entry_id,
                dock_id=None,
                event_type="QUEUE_CALLED",
                event_note=f"Queue {queue['queue_number']} called",
                created_by=created_by,
                conn=conn,
            )
            from services.queue_service import recommend_dock

            appointment = await get_appointment(str(queue["appointment_id"]), conn=conn)
            vehicle = await get_vehicle(str(queue["vehicle_id"]), conn=conn)
            docks_rows = await conn.fetch("SELECT * FROM docks")
            labor_rows = await conn.fetch("SELECT * FROM labor_teams")
            equip_rows = await conn.fetch("SELECT * FROM equipment")
            queue_rows = await conn.fetch(
                "SELECT * FROM queue_entries WHERE status NOT IN ('COMPLETED', 'EXITED', 'CANCELLED')"
            )
            rec = recommend_dock(
                appointment=appointment,
                vehicle=vehicle,
                docks=[dict(d) for d in docks_rows],
                labor_rows=[dict(l) for l in labor_rows],
                equipment_rows=[dict(e) for e in equip_rows],
                queue_rows=[dict(q) for q in queue_rows],
            )
            if rec:
                await create_yard_event(
                    vehicle_id=queue["vehicle_id"],
                    appointment_id=queue["appointment_id"],
                    queue_entry_id=queue_entry_id,
                    dock_id=rec.get("dockId"),
                    event_type="DOCK_RECOMMENDED",
                    event_note=f"Recommended {rec.get('dockCode')} (score {rec.get('score')}): {rec.get('reason')}",
                    created_by=created_by,
                    conn=conn,
                )
    return updated_queue


async def assign_dock(queue_entry_id: str, dock_id: str, created_by: str) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            queue = await get_queue_entry(queue_entry_id, conn=conn)
            dock = await get_dock(dock_id, conn=conn)
            if queue["status"] != "CALLED":
                raise HTTPException(status_code=409, detail="Queue entry must be CALLED before dock assignment")
            if dock["status"] in _DOCK_NON_ASSIGNABLE:
                await _log_dock_event(
                    dock_id=dock_id,
                    event_type="DOCK_CAPACITY_BLOCKED",
                    event_note=f"Dock {dock['dock_code']} blocked — status {dock['status']}",
                    created_by=created_by,
                    vehicle_id=str(queue["vehicle_id"]),
                    queue_entry_id=queue_entry_id,
                    conn=conn,
                )
                raise HTTPException(
                    status_code=409,
                    detail="Dock cannot accept additional vehicles.",
                )
            if dock["status"] not in {"AVAILABLE", "OCCUPIED"}:
                raise HTTPException(status_code=409, detail="Dock cannot accept additional vehicles.")
            max_cap = int(dock.get("max_capacity") or 1)
            active_on_dock = await conn.fetchval(
                """
                SELECT COUNT(*)::int FROM queue_entries
                WHERE dock_id = $1::uuid
                  AND status IN ('DOCK_ASSIGNED', 'LOADING')
                  AND id != $2::uuid
                """,
                dock_id,
                queue_entry_id,
            )
            occupancy = int(active_on_dock or 0)
            if dock.get("current_vehicle_id") and str(dock["current_vehicle_id"]) != str(queue["vehicle_id"]):
                occupancy = max(occupancy, 1)
            if occupancy >= max_cap:
                await _log_dock_event(
                    dock_id=dock_id,
                    event_type="DOCK_CAPACITY_BLOCKED",
                    event_note=f"Dock {dock['dock_code']} at capacity ({occupancy}/{max_cap})",
                    created_by=created_by,
                    vehicle_id=str(queue["vehicle_id"]),
                    queue_entry_id=queue_entry_id,
                    conn=conn,
                )
                raise HTTPException(status_code=409, detail="Dock cannot accept additional vehicles.")
            if dock.get("current_vehicle_id") and str(dock["current_vehicle_id"]) != str(queue["vehicle_id"]):
                raise HTTPException(
                    status_code=409,
                    detail="Dock already has an active vehicle assigned. Release before reassigning.",
                )
            other_queue = await conn.fetchval(
                """
                SELECT 1 FROM queue_entries
                WHERE dock_id = $1::uuid
                  AND id != $2::uuid
                  AND status IN ('DOCK_ASSIGNED', 'LOADING', 'CALLED')
                LIMIT 1
                """,
                dock_id,
                queue_entry_id,
            )
            if other_queue:
                raise HTTPException(
                    status_code=409,
                    detail="Dock already has an active queue assignment",
                )
            _validate_transition(queue["status"], "DOCK_ASSIGNED")
            now = _now()

            await conn.fetchrow(
                """
                UPDATE docks
                SET dock_name = $2,
                    dock_type = $3,
                    zone = $4,
                    supported_vehicle_types = $5::text[],
                    supported_cargo_types = $6::text[],
                    max_capacity = $7,
                    status = 'OCCUPIED',
                    current_vehicle_id = $8::uuid,
                    assigned_since = $9,
                    notes = $10,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                dock_id,
                dock["dock_name"],
                dock["dock_type"],
                dock.get("zone"),
                dock["supported_vehicle_types"],
                dock["supported_cargo_types"],
                dock.get("max_capacity", 1),
                queue["vehicle_id"],
                now,
                dock.get("notes"),
            )

            row = await conn.fetchrow(
                """
                UPDATE queue_entries
                SET dock_id = $2::uuid,
                    dock_assigned_time = $3,
                    status = 'DOCK_ASSIGNED',
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                queue_entry_id,
                dock_id,
                now,
            )
            await update_vehicle(
                queue["vehicle_id"], {"status": "DOCK_ASSIGNED"}, conn=conn, internal=True
            )
            await update_appointment(
                queue["appointment_id"], {"status": "DOCK_ASSIGNED"}, conn=conn, internal=True
            )
            prev_dock_id = queue.get("dock_id")
            event_type = "DOCK_REASSIGNED" if prev_dock_id and str(prev_dock_id) != str(dock_id) else "DOCK_ASSIGNED"
            await _log_dock_event(
                dock_id=dock_id,
                event_type=event_type,
                event_note=f"Assigned to dock {dock['dock_code']}",
                created_by=created_by,
                vehicle_id=str(queue["vehicle_id"]),
                queue_entry_id=queue_entry_id,
                conn=conn,
            )
            from services.resource_gating_service import sync_vehicle_readiness_status

            await sync_vehicle_readiness_status(
                str(queue["vehicle_id"]),
                conn=conn,
                created_by=created_by,
            )
    return _to_dict(row)


async def _validate_loading_lifecycle_prerequisites(
    vehicle_id: str,
    current_status: str,
    *,
    conn: Any,
) -> None:
    """Ensure loading is only started after gate entry, queue, dock, and readiness."""
    from enums import ACTIVE_DOCK_QUEUE_STATUSES

    if current_status != "READY_FOR_LOADING":
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot start loading from status '{current_status}'. "
                "Vehicle must be READY_FOR_LOADING after dock assignment and resource readiness."
            ),
        )

    active_sql = "', '".join(ACTIVE_DOCK_QUEUE_STATUSES)
    queue_row = await conn.fetchrow(
        f"""
        SELECT id, status, checkin_time, dock_id
        FROM queue_entries
        WHERE vehicle_id = $1::uuid
          AND status IN ('{active_sql}')
        ORDER BY dock_assigned_time DESC NULLS LAST, created_at DESC
        LIMIT 1
        """,
        vehicle_id,
    )
    if queue_row is None or not queue_row.get("checkin_time"):
        raise HTTPException(
            status_code=409,
            detail="Cannot start loading — no gate-approved queue entry. Complete gate entry first.",
        )
    if not queue_row.get("dock_id"):
        raise HTTPException(
            status_code=409,
            detail="Cannot start loading — vehicle is not assigned to a dock.",
        )


async def transition_vehicle_status(
    vehicle_id: str,
    status: str,
    event_note: str | None,
    created_by: str,
    *,
    conn: Any | None = None,
) -> dict[str, Any]:
    async def _run(connection: Any) -> dict[str, Any]:
        current_vehicle = await get_vehicle(vehicle_id, conn=connection)

        if status == "LOADING":
            from services.resource_gating_service import (
                log_resource_gate_blocked,
                raise_resource_gating_error,
                sync_vehicle_readiness_status,
                validate_resource_readiness_for_loading,
            )

            # Promote RESOURCE_PENDING → READY_FOR_LOADING before validating LOADING transition.
            if current_vehicle["status"] in {"DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING"}:
                current_vehicle = await sync_vehicle_readiness_status(
                    vehicle_id, conn=connection, created_by=created_by
                ) or current_vehicle

        _validate_transition(current_vehicle["status"], status)

        if status == "LOADING":
            from services.resource_gating_service import (
                log_resource_gate_blocked,
                raise_resource_gating_error,
                validate_resource_readiness_for_loading,
            )

            await _validate_loading_lifecycle_prerequisites(
                vehicle_id,
                current_vehicle["status"],
                conn=connection,
            )

            readiness = await validate_resource_readiness_for_loading(
                vehicle_id, conn=connection, enforce_queue_dock=True
            )
            if not readiness["ready"]:
                dock_id_for_event = readiness.get("dockId")
                await log_resource_gate_blocked(
                    vehicle_id=vehicle_id,
                    dock_id=dock_id_for_event,
                    missing=readiness["missing"],
                    created_by=created_by,
                    conn=connection,
                )
                raise_resource_gating_error(readiness["missing"])

        if status == "COMPLETED" and current_vehicle["status"] != "LOADING":
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Cannot complete loading from status '{current_vehicle['status']}'. "
                    "Vehicle must be LOADING."
                ),
            )

        updated_vehicle = await update_vehicle(
            vehicle_id, {"status": status}, conn=connection, internal=True
        )

        appointment_active = await resolve_active_appointment_for_vehicle(vehicle_id, connection)
        queue_active = await resolve_active_queue_for_vehicle(vehicle_id, connection)
        appointment_id = str(appointment_active["id"]) if appointment_active else None
        queue_entry_id = str(queue_active["id"]) if queue_active else None
        dock_id = (
            str(queue_active["dock_id"])
            if queue_active and queue_active.get("dock_id")
            else None
        )

        if appointment_id:
            appointment = await get_appointment(appointment_id, conn=connection)
            if appointment["status"] != status:
                await update_appointment(
                    appointment_id, {"status": status}, conn=connection, internal=True
                )

        if status in {"LOADING", "COMPLETED", "EXIT_HOLDING", "EXIT_VERIFIED", "EXITED"} and queue_entry_id:
            queue = await get_queue_entry(queue_entry_id, conn=connection)
            queue_update: dict[str, Any] = {"status": status}
            if queue["status"] != status:
                await update_queue_entry(
                    queue_entry_id, queue_update, conn=connection, internal=True
                )

        if status == "LOADING":
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appointment_id,
                queue_entry_id=queue_entry_id,
                dock_id=dock_id,
                event_type="LOADING_STARTED",
                event_note=event_note or "Loading started",
                created_by=created_by,
                conn=connection,
            )

        if status == "COMPLETED":
            from services.resource_gating_service import release_loading_resources

            await release_loading_resources(
                vehicle_id,
                dock_id,
                conn=connection,
                created_by=created_by,
            )
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appointment_id,
                queue_entry_id=queue_entry_id,
                dock_id=dock_id,
                event_type="LOADING_COMPLETED",
                event_note=event_note or "Loading completed",
                created_by=created_by,
                conn=connection,
            )

        if status in {"COMPLETED", "EXIT_HOLDING", "EXIT_VERIFIED", "EXITED"}:
            await _release_vehicle_dock_assignments(
                vehicle_id,
                conn=connection,
                created_by=created_by,
                queue_entry_id=queue_entry_id,
                explicit_dock_id=dock_id,
                lifecycle_status=status,
            )

        if status == "COMPLETED":
            holding_at = _now()
            await update_vehicle(
                vehicle_id, {"status": "EXIT_HOLDING"}, conn=connection, internal=True
            )
            if appointment_id:
                await update_appointment(
                    appointment_id, {"status": "EXIT_HOLDING"}, conn=connection, internal=True
                )
            if queue_entry_id:
                await update_queue_entry(
                    queue_entry_id,
                    {"status": "EXIT_HOLDING"},
                    conn=connection,
                    internal=True,
                )
            await connection.execute(
                """
                UPDATE vehicles SET exit_holding_at = $2, updated_at = NOW()
                WHERE id = $1::uuid
                """,
                vehicle_id,
                holding_at,
            )
            await create_yard_event(
                vehicle_id=vehicle_id,
                appointment_id=appointment_id,
                queue_entry_id=queue_entry_id,
                dock_id=dock_id,
                event_type="EXIT_HOLDING",
                event_note="Vehicle moved to exit holding after loading completed",
                created_by=created_by,
                conn=connection,
            )
            updated_vehicle = await get_vehicle(vehicle_id, conn=connection)

        await create_yard_event(
            vehicle_id=vehicle_id,
            appointment_id=appointment_id,
            queue_entry_id=queue_entry_id,
            dock_id=dock_id,
            event_type="VEHICLE_STATUS_CHANGED",
            event_note=event_note or f"Vehicle moved to {status}",
            created_by=created_by,
            conn=connection,
        )
        return updated_vehicle

    if conn is not None:
        return await _run(conn)
    pool = get_pool()
    async with pool.acquire() as acquired:
        async with acquired.transaction():
            return await _run(acquired)


async def delete_dock(dock_id: str, *, created_by: str = "docks-ui") -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            dock = await get_dock(dock_id, conn=conn)
            if dock.get("current_vehicle_id"):
                raise HTTPException(status_code=409, detail="Cannot delete an active dock.")
            active_queue = await conn.fetchval(
                """
                SELECT 1 FROM queue_entries
                WHERE dock_id = $1::uuid
                  AND status IN ('DOCK_ASSIGNED', 'LOADING', 'CALLED')
                LIMIT 1
                """,
                dock_id,
            )
            if active_queue:
                raise HTTPException(status_code=409, detail="Cannot delete an active dock.")
            labor = await conn.fetchval(
                """
                SELECT 1 FROM labor_teams
                WHERE assigned_dock_id = $1::uuid AND status = 'ASSIGNED'
                LIMIT 1
                """,
                dock_id,
            )
            if labor:
                raise HTTPException(status_code=409, detail="Cannot delete an active dock.")
            equipment = await conn.fetchval(
                """
                SELECT 1 FROM equipment
                WHERE assigned_dock_id = $1::uuid AND status IN ('ASSIGNED', 'IN_USE')
                LIMIT 1
                """,
                dock_id,
            )
            if equipment:
                raise HTTPException(status_code=409, detail="Cannot delete an active dock.")
            await _log_dock_event(
                dock_id=dock_id,
                event_type="DOCK_DELETED",
                event_note=f"Dock {dock['dock_code']} deleted",
                created_by=created_by,
                conn=conn,
            )
            result = await conn.execute("DELETE FROM docks WHERE id = $1::uuid", dock_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Dock not found")


async def check_dock_readiness(vehicle_id: str, conn: Any | None = None) -> dict[str, Any]:
    """Resource gating foundation — whether vehicle has an active dock assignment."""
    from enums import ACTIVE_DOCK_QUEUE_STATUSES

    db = _db(conn)
    active_queue_sql = "', '".join(ACTIVE_DOCK_QUEUE_STATUSES)
    vehicle_exists = await db.fetchval(
        "SELECT 1 FROM vehicles WHERE id = $1::uuid", vehicle_id
    )
    if not vehicle_exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    row = await db.fetchrow(
        f"""
        SELECT d.id, d.dock_code, d.dock_name, d.status
        FROM queue_entries qe
        INNER JOIN docks d ON d.id = qe.dock_id
        WHERE qe.vehicle_id = $1::uuid
          AND qe.status IN ('{active_queue_sql}')
        ORDER BY qe.dock_assigned_time DESC NULLS LAST
        LIMIT 1
        """,
        vehicle_id,
    )
    if row:
        return {
            "dockAssigned": True,
            "dockId": str(row["id"]),
            "dockCode": row["dock_code"],
            "dockName": row["dock_name"],
            "dockStatus": row["status"],
        }

    row = await db.fetchrow(
        """
        SELECT id, dock_code, dock_name, status
        FROM docks
        WHERE current_vehicle_id = $1::uuid AND status IN ('OCCUPIED', 'AVAILABLE')
        LIMIT 1
        """,
        vehicle_id,
    )
    if row:
        return {
            "dockAssigned": True,
            "dockId": str(row["id"]),
            "dockCode": row["dock_code"],
            "dockName": row["dock_name"],
            "dockStatus": row["status"],
        }

    return {"dockAssigned": False}
