from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from enums import FLOW_VEHICLE_TRANSITION_STATUSES

from auth_rbac import (
    PERM_APPOINTMENT_WRITE,
    PERM_DETENTION_WRITE,
    PERM_DOCK_WRITE,
    PERM_EQUIPMENT_WRITE,
    PERM_FLOW_ASSIGN_DOCK,
    PERM_FLOW_CALL,
    PERM_FLOW_CHECK_IN,
    PERM_FLOW_VEHICLE_TRANSITION,
    PERM_LABOR_WRITE,
    PERM_QUEUE_WRITE,
    PERM_VEHICLE_WRITE,
    PERM_YARD_EVENT_WRITE,
    require_permission,
)
from routers.list_response import build_list_response

from schemas import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentUpdate,
    AssignDockRequest,
    CheckInRequest,
    DockAssignEquipmentRequest,
    DockAssignLaborRequest,
    DockCreate,
    DockOut,
    DockReadinessOut,
    DockReleaseResourcesOut,
    ResourceReadinessOut,
    DockUpdate,
    EquipmentAssignRequest,
    EquipmentCreate,
    EquipmentOut,
    EquipmentReadinessOut,
    EquipmentStatusUpdate,
    EquipmentUpdate,
    LaborAssignRequest,
    LaborReadinessOut,
    LaborStatusUpdate,
    LaborTeamCreate,
    LaborTeamOut,
    LaborTeamUpdate,
    DetentionBundleOut,
    DetentionConfigOut,
    DetentionDetailOut,
    DetentionOut,
    DetentionStatusUpdate,
    DetentionSummaryOut,
    QueueEntryCreate,
    QueueEntryOut,
    QueueEntryUpdate,
    TransitionRequest,
    VehicleCreate,
    VehicleJourneyOut,
    VehicleOut,
    VehicleUpdate,
    YardEventCreate,
    YardEventOut,
)
from services.equipment_service import (
    assign_equipment,
    check_equipment_readiness,
    complete_equipment_maintenance,
    create_equipment,
    delete_equipment,
    get_equipment,
    list_equipment,
    mark_equipment_charging,
    mark_equipment_idle,
    mark_equipment_in_use,
    mark_equipment_maintenance,
    release_equipment,
    update_equipment,
    update_equipment_status,
)
from services.labor_service import (
    assign_labor_team,
    check_labor_readiness,
    create_labor_team,
    delete_labor_team,
    end_labor_break,
    get_labor_team,
    list_labor_teams,
    mark_labor_break,
    mark_labor_off_duty,
    mark_labor_on_duty,
    mark_labor_unavailable,
    release_labor_team,
    update_labor_status,
    update_labor_team,
)
from services.detention_service import (
    build_detention_summary,
    get_detention_config,
    get_detention_record,
    list_detention_records,
    normalize_detention_row,
    update_detention_status,
)
from services.dock_resource_service import (
    assign_equipment_to_dock,
    assign_labor_to_dock,
    release_dock_resources,
)
from services.resource_gating_service import validate_resource_readiness_for_loading
from services.yms_service import (
    assign_dock,
    check_in_vehicle,
    create_appointment,
    check_dock_readiness,
    create_dock,
    delete_dock,
    create_queue_entry,
    create_vehicle,
    create_yard_event,
    get_appointment,
    get_dock,
    get_queue_entry,
    get_vehicle,
    get_vehicle_journey,
    get_yard_event,
    list_appointments,
    list_docks,
    list_queue_entries,
    list_vehicles,
    list_yard_events,
    mark_called,
    transition_vehicle_status,
    update_appointment,
    update_dock,
    update_queue_entry,
    update_vehicle,
    unassign_dock_from_queue,
)


router = APIRouter(tags=["yms"])


@router.post("/vehicles", response_model=VehicleOut)
async def create_vehicle_endpoint(
    payload: VehicleCreate,
    _auth=Depends(require_permission(PERM_VEHICLE_WRITE)),
):
    row = await create_vehicle(payload.model_dump())
    return VehicleOut(**row)


@router.get("/vehicles")
async def list_vehicles_endpoint(
    q: Optional[str] = Query(None, description="Search vehicle number, transporter, driver"),
    status: Optional[str] = Query(None),
    ownership_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500, description="When set, returns {items,total,skip,limit}"),
):
    rows, total = await list_vehicles(
        q=q, status=status, ownership_type=ownership_type, skip=skip, limit=limit
    )
    return build_list_response(rows, total, VehicleOut, skip=skip, limit=limit)


@router.get("/vehicles/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle_endpoint(vehicle_id: str):
    return VehicleOut(**(await get_vehicle(vehicle_id)))


@router.get("/vehicles/{vehicle_id}/journey", response_model=VehicleJourneyOut)
async def get_vehicle_journey_endpoint(vehicle_id: str):
    data = await get_vehicle_journey(vehicle_id)
    return VehicleJourneyOut(
        vehicle=VehicleOut(**data["vehicle"]),
        appointment=data.get("appointment"),
        queue_entry=data.get("queue_entry"),
        dock=data.get("dock"),
        labor=data.get("labor"),
        equipment=data.get("equipment"),
        readiness=data.get("readiness"),
        zone_name=data.get("zone_name"),
        zone_code=data.get("zone_code"),
        events=data.get("events") or [],
        loading=data.get("loading"),
        current_stage=data.get("current_stage") or "Scheduled",
        queue_status=data.get("queue_status"),
    )


@router.patch("/vehicles/{vehicle_id}", response_model=VehicleOut)
async def update_vehicle_endpoint(
    vehicle_id: str,
    payload: VehicleUpdate,
    _auth=Depends(require_permission(PERM_VEHICLE_WRITE)),
):
    row = await update_vehicle(vehicle_id, payload.model_dump(exclude_unset=True))
    return VehicleOut(**row)


@router.post("/appointments", response_model=AppointmentOut)
async def create_appointment_endpoint(
    payload: AppointmentCreate,
    _auth=Depends(require_permission(PERM_APPOINTMENT_WRITE)),
):
    row = await create_appointment(payload.model_dump())
    return AppointmentOut(**row)


@router.get("/appointments")
async def list_appointments_endpoint(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
):
    rows, total = await list_appointments(
        q=q, status=status, date_from=date_from, date_to=date_to, skip=skip, limit=limit
    )
    return build_list_response(rows, total, AppointmentOut, skip=skip, limit=limit)


@router.get("/appointments/{appointment_id}", response_model=AppointmentOut)
async def get_appointment_endpoint(appointment_id: str):
    return AppointmentOut(**(await get_appointment(appointment_id)))


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOut)
async def update_appointment_endpoint(
    appointment_id: str,
    payload: AppointmentUpdate,
    _auth=Depends(require_permission(PERM_APPOINTMENT_WRITE)),
):
    row = await update_appointment(appointment_id, payload.model_dump(exclude_unset=True))
    return AppointmentOut(**row)


@router.post("/queue-entries", response_model=QueueEntryOut)
async def create_queue_entry_endpoint(
    payload: QueueEntryCreate,
    _auth=Depends(require_permission(PERM_QUEUE_WRITE)),
):
    row = await create_queue_entry(payload.model_dump())
    return QueueEntryOut(**row)


@router.get("/queue-entries")
async def list_queue_entries_endpoint(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    dock_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
):
    rows, total = await list_queue_entries(
        q=q, status=status, dock_id=dock_id, skip=skip, limit=limit
    )
    return build_list_response(rows, total, QueueEntryOut, skip=skip, limit=limit)


@router.get("/queue-entries/{queue_entry_id}", response_model=QueueEntryOut)
async def get_queue_entry_endpoint(queue_entry_id: str):
    return QueueEntryOut(**(await get_queue_entry(queue_entry_id)))


@router.patch("/queue-entries/{queue_entry_id}", response_model=QueueEntryOut)
async def update_queue_entry_endpoint(
    queue_entry_id: str,
    payload: QueueEntryUpdate,
    _auth=Depends(require_permission(PERM_QUEUE_WRITE)),
):
    row = await update_queue_entry(queue_entry_id, payload.model_dump(exclude_unset=True))
    return QueueEntryOut(**row)


@router.post("/docks", response_model=DockOut)
async def create_dock_endpoint(
    payload: DockCreate,
    _auth=Depends(require_permission(PERM_DOCK_WRITE)),
):
    row = await create_dock(payload.model_dump())
    return DockOut(**row)


@router.get("/docks")
async def list_docks_endpoint(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
):
    rows, total = await list_docks(q=q, status=status, skip=skip, limit=limit)
    return build_list_response(rows, total, DockOut, skip=skip, limit=limit)


@router.get("/docks/readiness/vehicle/{vehicle_id}", response_model=DockReadinessOut)
async def dock_readiness_endpoint(vehicle_id: str):
    return DockReadinessOut(**(await check_dock_readiness(vehicle_id)))


@router.get("/flow/readiness/vehicle/{vehicle_id}", response_model=ResourceReadinessOut)
async def resource_readiness_endpoint(vehicle_id: str):
    result = await validate_resource_readiness_for_loading(
        vehicle_id, enforce_queue_dock=False
    )
    return ResourceReadinessOut(**result)


@router.get("/docks/{dock_id}", response_model=DockOut)
async def get_dock_endpoint(dock_id: str):
    return DockOut(**(await get_dock(dock_id)))


@router.patch("/docks/{dock_id}", response_model=DockOut)
async def update_dock_endpoint(
    dock_id: str,
    payload: DockUpdate,
    _auth=Depends(require_permission(PERM_DOCK_WRITE)),
):
    row = await update_dock(dock_id, payload.model_dump(exclude_unset=True))
    return DockOut(**row)


@router.delete("/docks/{dock_id}", status_code=204)
async def delete_dock_endpoint(
    dock_id: str,
    _auth=Depends(require_permission(PERM_DOCK_WRITE)),
):
    await delete_dock(dock_id)


@router.post("/docks/{dock_id}/assign-labor", response_model=LaborTeamOut)
async def assign_dock_labor_endpoint(
    dock_id: str,
    payload: DockAssignLaborRequest,
    _auth=Depends(require_permission(PERM_DOCK_WRITE)),
):
    return LaborTeamOut(
        **(
            await assign_labor_to_dock(
                dock_id,
                payload.labor_id,
                payload.model_dump(exclude={"labor_id"}),
            )
        )
    )


@router.post("/docks/{dock_id}/assign-equipment", response_model=EquipmentOut)
async def assign_dock_equipment_endpoint(
    dock_id: str,
    payload: DockAssignEquipmentRequest,
    _auth=Depends(require_permission(PERM_DOCK_WRITE)),
):
    return EquipmentOut(
        **(
            await assign_equipment_to_dock(
                dock_id,
                payload.equipment_id,
                payload.model_dump(exclude={"equipment_id"}),
            )
        )
    )


@router.post("/docks/{dock_id}/release-resources", response_model=DockReleaseResourcesOut)
async def release_dock_resources_endpoint(
    dock_id: str,
    _auth=Depends(require_permission(PERM_DOCK_WRITE)),
):
    result = await release_dock_resources(dock_id, created_by="docks-ui")
    return DockReleaseResourcesOut(**result)


@router.post("/equipment", response_model=EquipmentOut)
async def create_equipment_endpoint(
    payload: EquipmentCreate,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await create_equipment(payload.model_dump())))


@router.get("/equipment")
async def list_equipment_endpoint(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
):
    rows, total = await list_equipment(
        q=q, status=status, category=category, skip=skip, limit=limit
    )
    return build_list_response(rows, total, EquipmentOut, skip=skip, limit=limit)


@router.get("/equipment/readiness/vehicle/{vehicle_id}", response_model=EquipmentReadinessOut)
async def equipment_readiness_endpoint(vehicle_id: str):
    return EquipmentReadinessOut(**(await check_equipment_readiness(vehicle_id)))


@router.get("/equipment/{equipment_id}", response_model=EquipmentOut)
async def get_equipment_endpoint(equipment_id: str):
    return EquipmentOut(**(await get_equipment(equipment_id)))


@router.patch("/equipment/{equipment_id}", response_model=EquipmentOut)
async def update_equipment_endpoint(
    equipment_id: str,
    payload: EquipmentUpdate,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await update_equipment(equipment_id, payload.model_dump(exclude_unset=True))))


@router.patch("/equipment/{equipment_id}/status", response_model=EquipmentOut)
async def update_equipment_status_endpoint(
    equipment_id: str,
    payload: EquipmentStatusUpdate,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(
        **(
            await update_equipment_status(
                equipment_id,
                payload.status,
                event_note=payload.event_note,
                created_by=payload.created_by,
            )
        )
    )


@router.delete("/equipment/{equipment_id}", status_code=204)
async def delete_equipment_endpoint(
    equipment_id: str,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    await delete_equipment(equipment_id)


@router.post("/equipment/{equipment_id}/assign", response_model=EquipmentOut)
async def assign_equipment_endpoint(
    equipment_id: str,
    payload: EquipmentAssignRequest,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await assign_equipment(equipment_id, payload.model_dump())))


@router.post("/equipment/{equipment_id}/release", response_model=EquipmentOut)
async def release_equipment_endpoint(
    equipment_id: str,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await release_equipment(equipment_id)))


@router.post("/equipment/{equipment_id}/in-use", response_model=EquipmentOut)
async def mark_equipment_in_use_endpoint(
    equipment_id: str,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await mark_equipment_in_use(equipment_id)))


@router.post("/equipment/{equipment_id}/idle", response_model=EquipmentOut)
async def mark_equipment_idle_endpoint(
    equipment_id: str,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await mark_equipment_idle(equipment_id)))


@router.post("/equipment/{equipment_id}/maintenance", response_model=EquipmentOut)
async def mark_equipment_maintenance_endpoint(
    equipment_id: str,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await mark_equipment_maintenance(equipment_id)))


@router.post("/equipment/{equipment_id}/charging", response_model=EquipmentOut)
async def mark_equipment_charging_endpoint(
    equipment_id: str,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await mark_equipment_charging(equipment_id)))


@router.post("/equipment/{equipment_id}/maintenance-complete", response_model=EquipmentOut)
async def complete_equipment_maintenance_endpoint(
    equipment_id: str,
    _auth=Depends(require_permission(PERM_EQUIPMENT_WRITE)),
):
    return EquipmentOut(**(await complete_equipment_maintenance(equipment_id)))


@router.post("/labor", response_model=LaborTeamOut)
async def create_labor_endpoint(
    payload: LaborTeamCreate,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await create_labor_team(payload.model_dump())))


@router.get("/labor")
async def list_labor_endpoint(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
):
    rows, total = await list_labor_teams(q=q, status=status, skip=skip, limit=limit)
    return build_list_response(rows, total, LaborTeamOut, skip=skip, limit=limit)


@router.get("/labor/readiness/vehicle/{vehicle_id}", response_model=LaborReadinessOut)
async def labor_readiness_endpoint(vehicle_id: str):
    return LaborReadinessOut(**(await check_labor_readiness(vehicle_id)))


@router.get("/labor/{labor_id}", response_model=LaborTeamOut)
async def get_labor_endpoint(labor_id: str):
    return LaborTeamOut(**(await get_labor_team(labor_id)))


@router.patch("/labor/{labor_id}", response_model=LaborTeamOut)
async def update_labor_endpoint(
    labor_id: str,
    payload: LaborTeamUpdate,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await update_labor_team(labor_id, payload.model_dump(exclude_unset=True))))


@router.patch("/labor/{labor_id}/status", response_model=LaborTeamOut)
async def update_labor_status_endpoint(
    labor_id: str,
    payload: LaborStatusUpdate,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(
        **(
            await update_labor_status(
                labor_id,
                payload.status,
                event_note=payload.event_note,
                created_by=payload.created_by,
            )
        )
    )


@router.delete("/labor/{labor_id}", status_code=204)
async def delete_labor_endpoint(
    labor_id: str,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    await delete_labor_team(labor_id)


@router.post("/labor/{labor_id}/assign", response_model=LaborTeamOut)
async def assign_labor_endpoint(
    labor_id: str,
    payload: LaborAssignRequest,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await assign_labor_team(labor_id, payload.model_dump())))


@router.post("/labor/{labor_id}/release", response_model=LaborTeamOut)
async def release_labor_endpoint(
    labor_id: str,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await release_labor_team(labor_id)))


@router.post("/labor/{labor_id}/on-duty", response_model=LaborTeamOut)
async def mark_labor_on_duty_endpoint(
    labor_id: str,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await mark_labor_on_duty(labor_id)))


@router.post("/labor/{labor_id}/off-duty", response_model=LaborTeamOut)
async def mark_labor_off_duty_endpoint(
    labor_id: str,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await mark_labor_off_duty(labor_id)))


@router.post("/labor/{labor_id}/break", response_model=LaborTeamOut)
async def mark_labor_break_endpoint(
    labor_id: str,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await mark_labor_break(labor_id)))


@router.post("/labor/{labor_id}/break-end", response_model=LaborTeamOut)
async def end_labor_break_endpoint(
    labor_id: str,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await end_labor_break(labor_id)))


@router.post("/labor/{labor_id}/unavailable", response_model=LaborTeamOut)
async def mark_labor_unavailable_endpoint(
    labor_id: str,
    _auth=Depends(require_permission(PERM_LABOR_WRITE)),
):
    return LaborTeamOut(**(await mark_labor_unavailable(labor_id)))


@router.get("/detention/config", response_model=DetentionConfigOut)
async def get_detention_config_endpoint():
    return DetentionConfigOut(**(await get_detention_config()))


@router.get("/detention", response_model=DetentionBundleOut)
async def list_detention_endpoint(
    q: Optional[str] = Query(None, description="Filter detention records by text match"),
    status: Optional[str] = Query(None),
):
    records = await list_detention_records(q=q, status=status)
    summary = await build_detention_summary(records)
    config = await get_detention_config()
    return DetentionBundleOut(
        records=[DetentionOut(**normalize_detention_row(r)) for r in records],
        summary=DetentionSummaryOut(**summary),
        config=DetentionConfigOut(**config),
    )


@router.get("/detention/{detention_id}", response_model=DetentionDetailOut)
async def get_detention_endpoint(detention_id: str):
    row = await get_detention_record(detention_id)
    events = [YardEventOut(**e) for e in row.get("events", [])]
    return DetentionDetailOut(**normalize_detention_row(row), events=events)


@router.patch("/detention/{detention_id}/status", response_model=DetentionOut)
async def update_detention_status_endpoint(
    detention_id: str,
    payload: DetentionStatusUpdate,
    _auth=Depends(require_permission(PERM_DETENTION_WRITE)),
):
    row = await update_detention_status(
        detention_id,
        payload.status,
        remarks=payload.remarks,
        created_by=payload.created_by,
    )
    return DetentionOut(**normalize_detention_row(row))


@router.post("/yard-events", response_model=YardEventOut)
async def create_yard_event_endpoint(
    payload: YardEventCreate,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    row = await create_yard_event(
        vehicle_id=payload.vehicle_id,
        appointment_id=payload.appointment_id,
        queue_entry_id=payload.queue_entry_id,
        dock_id=payload.dock_id,
        equipment_id=payload.equipment_id,
        labor_id=payload.labor_id,
        event_type=payload.event_type,
        event_time=payload.event_time or datetime.now(timezone.utc),
        event_note=payload.event_note,
        created_by=payload.created_by,
    )
    return YardEventOut(**row)


@router.get("/yard-events")
async def list_yard_events_endpoint(
    q: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
):
    rows, total = await list_yard_events(
        q=q, date_from=date_from, date_to=date_to, skip=skip, limit=limit
    )
    return build_list_response(rows, total, YardEventOut, skip=skip, limit=limit)


@router.get("/yard-events/{event_id}", response_model=YardEventOut)
async def get_yard_event_endpoint(event_id: str):
    return YardEventOut(**(await get_yard_event(event_id)))


@router.post("/flow/check-in", response_model=QueueEntryOut)
async def check_in_vehicle_endpoint(
    payload: CheckInRequest,
    _auth=Depends(require_permission(PERM_FLOW_CHECK_IN)),
):
    row = await check_in_vehicle(payload.appointment_id, payload.queue_number, payload.queue_type)
    return QueueEntryOut(**row)


@router.post("/flow/queue-entries/{queue_entry_id}/call", response_model=QueueEntryOut)
async def mark_called_endpoint(
    queue_entry_id: str,
    _auth=Depends(require_permission(PERM_FLOW_CALL)),
):
    row = await mark_called(queue_entry_id, created_by="operator")
    return QueueEntryOut(**row)


@router.post("/flow/queue-entries/{queue_entry_id}/assign-dock", response_model=QueueEntryOut)
async def assign_dock_endpoint(
    queue_entry_id: str,
    payload: AssignDockRequest,
    _auth=Depends(require_permission(PERM_FLOW_ASSIGN_DOCK)),
):
    row = await assign_dock(queue_entry_id, payload.dock_id, created_by="operator")
    return QueueEntryOut(**row)


@router.post("/flow/queue-entries/{queue_entry_id}/unassign-dock", response_model=QueueEntryOut)
async def unassign_dock_endpoint(
    queue_entry_id: str,
    _auth=Depends(require_permission(PERM_FLOW_ASSIGN_DOCK)),
):
    row = await unassign_dock_from_queue(queue_entry_id, created_by="operator")
    return QueueEntryOut(**row)


@router.post("/flow/vehicles/{vehicle_id}/transition", response_model=VehicleOut)
async def transition_vehicle_endpoint(
    vehicle_id: str,
    payload: TransitionRequest,
    _auth=Depends(require_permission(PERM_FLOW_VEHICLE_TRANSITION)),
):
    if payload.status not in FLOW_VEHICLE_TRANSITION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Status '{payload.status}' cannot be set via flow transition. "
                "Use gate entry, queue call, dock assignment, and readiness workflows. "
                "Exit statuses must use gate verify-out and gate-out endpoints."
            ),
        )
    row = await transition_vehicle_status(
        vehicle_id=vehicle_id,
        status=payload.status,
        event_note=payload.event_note,
        created_by=payload.created_by,
    )
    return VehicleOut(**row)
