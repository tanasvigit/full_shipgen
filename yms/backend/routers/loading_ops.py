"""Loading Operations — exceptions and pause/resume."""

from typing import Optional

from fastapi import APIRouter, Depends, Query

from auth_rbac import PERM_YARD_EVENT_WRITE, require_permission
from schemas import (
    LoadingExceptionAssign,
    LoadingExceptionClose,
    LoadingExceptionCreate,
    LoadingExceptionOut,
    LoadingExceptionResolve,
    LoadingPauseRequest,
    LoadingPauseStateOut,
    LoadingResumeRequest,
)
from services.loading_exceptions_service import (
    assign_loading_exception,
    close_loading_exception,
    compute_pause_state,
    create_loading_exception,
    get_loading_exception,
    list_loading_exceptions,
    pause_loading_operation,
    resolve_loading_exception,
    resume_loading_operation,
)
from services.yms_service import list_yard_events

router = APIRouter(prefix="/loading-operations", tags=["loading-operations"])


@router.get("/exceptions", response_model=list[LoadingExceptionOut])
async def list_loading_exceptions_endpoint(
    status: Optional[str] = Query(None),
    vehicle_id: Optional[str] = Query(None),
    queue_entry_id: Optional[str] = Query(None),
    active_only: bool = Query(False),
):
    rows = await list_loading_exceptions(
        status=status,
        vehicle_id=vehicle_id,
        queue_entry_id=queue_entry_id,
        active_only=active_only,
    )
    return [LoadingExceptionOut(**row) for row in rows]


@router.get("/exceptions/{exception_id}", response_model=LoadingExceptionOut)
async def get_loading_exception_endpoint(exception_id: str):
    return LoadingExceptionOut(**(await get_loading_exception(exception_id)))


@router.post("/exceptions", response_model=LoadingExceptionOut)
async def create_loading_exception_endpoint(
    payload: LoadingExceptionCreate,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    row = await create_loading_exception(
        vehicle_id=payload.vehicle_id,
        appointment_id=payload.appointment_id,
        queue_entry_id=payload.queue_entry_id,
        dock_id=payload.dock_id,
        exception_type=payload.exception_type,
        description=payload.description,
        created_by=payload.created_by,
    )
    return LoadingExceptionOut(**row)


@router.post("/exceptions/{exception_id}/assign", response_model=LoadingExceptionOut)
async def assign_loading_exception_endpoint(
    exception_id: str,
    payload: LoadingExceptionAssign,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    row = await assign_loading_exception(
        exception_id,
        assigned_to=payload.assigned_to,
        created_by=payload.created_by,
    )
    return LoadingExceptionOut(**row)


@router.post("/exceptions/{exception_id}/resolve", response_model=LoadingExceptionOut)
async def resolve_loading_exception_endpoint(
    exception_id: str,
    payload: LoadingExceptionResolve,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    row = await resolve_loading_exception(
        exception_id,
        resolved_by=payload.resolved_by,
        resolution_notes=payload.resolution_notes,
        created_by=payload.created_by,
    )
    return LoadingExceptionOut(**row)


@router.post("/exceptions/{exception_id}/close", response_model=LoadingExceptionOut)
async def close_loading_exception_endpoint(
    exception_id: str,
    payload: LoadingExceptionClose,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    row = await close_loading_exception(
        exception_id,
        closed_by=payload.closed_by,
        created_by=payload.created_by,
    )
    return LoadingExceptionOut(**row)


@router.post("/pause")
async def pause_loading_endpoint(
    payload: LoadingPauseRequest,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    return await pause_loading_operation(
        vehicle_id=payload.vehicle_id,
        appointment_id=payload.appointment_id,
        queue_entry_id=payload.queue_entry_id,
        dock_id=payload.dock_id,
        reason_code=payload.reason_code,
        note=payload.note,
        created_by=payload.created_by,
    )


@router.post("/resume")
async def resume_loading_endpoint(
    payload: LoadingResumeRequest,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    events, _ = await list_yard_events(limit=2000)
    return await resume_loading_operation(
        vehicle_id=payload.vehicle_id,
        appointment_id=payload.appointment_id,
        queue_entry_id=payload.queue_entry_id,
        dock_id=payload.dock_id,
        events=events,
        created_by=payload.created_by,
    )


@router.get("/pause-state", response_model=LoadingPauseStateOut)
async def pause_state_endpoint(
    vehicle_id: Optional[str] = Query(None),
    queue_entry_id: Optional[str] = Query(None),
):
    events, _ = await list_yard_events(limit=2000)
    state = compute_pause_state(events, vehicle_id=vehicle_id, queue_entry_id=queue_entry_id)
    return LoadingPauseStateOut(**state)
