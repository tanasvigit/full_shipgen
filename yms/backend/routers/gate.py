"""Gate Management API — entry & exit verification."""

from fastapi import APIRouter, Depends

from auth_rbac import (
    PERM_FLOW_CHECK_IN,
    PERM_FLOW_VEHICLE_TRANSITION,
    PERM_YARD_EVENT_WRITE,
    require_permission,
)
from schemas import (
    GateActionRequest,
    GateApproveEntryRequest,
    GateClearanceUpdate,
    GateLookupRequest,
    GateRejectRequest,
    GateScanRequest,
    GateVerifyExitRequest,
)
from services.gate_service import (
    approve_entry,
    gate_out,
    get_exit_holding_dashboard,
    get_exit_verification_detail,
    get_gate_dashboard,
    list_exit_holding,
    lookup_gate_context,
    mark_vehicle_arrived,
    record_gate_scan,
    reject_entry,
    reject_exit,
    update_exit_checklist,
    verify_exit,
)

router = APIRouter(prefix="/gate", tags=["gate"])


@router.get("/dashboard")
async def gate_dashboard_endpoint(gate_id: str = "G1"):
    return await get_gate_dashboard(gate_id)


@router.post("/lookup")
async def gate_lookup_endpoint(payload: GateLookupRequest):
    return await lookup_gate_context(payload.query, payload.gate_id)


@router.post("/scan")
async def gate_scan_endpoint(
    payload: GateScanRequest,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    return await record_gate_scan(
        payload.query,
        payload.gate_id,
        payload.scan_type,
        payload.created_by,
    )


@router.post("/vehicles/{vehicle_id}/arrived")
async def gate_mark_arrived_endpoint(
    vehicle_id: str,
    payload: GateActionRequest,
    _auth=Depends(require_permission(PERM_FLOW_VEHICLE_TRANSITION)),
):
    return await mark_vehicle_arrived(vehicle_id, payload.gate_id, payload.created_by)


@router.post("/vehicles/{vehicle_id}/approve-entry")
async def gate_approve_entry_endpoint(
    vehicle_id: str,
    payload: GateApproveEntryRequest,
    _auth=Depends(require_permission(PERM_FLOW_CHECK_IN)),
):
    return await approve_entry(
        vehicle_id,
        payload.gate_id,
        payload.created_by,
        queue_number=payload.queue_number,
        queue_type=payload.queue_type,
    )


@router.post("/vehicles/{vehicle_id}/reject-entry")
async def gate_reject_entry_endpoint(
    vehicle_id: str,
    payload: GateRejectRequest,
    _auth=Depends(require_permission(PERM_FLOW_VEHICLE_TRANSITION)),
):
    await reject_entry(vehicle_id, payload.gate_id, payload.reason, payload.created_by)
    return {"ok": True}


@router.get("/exit-holding/dashboard")
async def gate_exit_holding_dashboard_endpoint(gate_id: str = "G1"):
    return await get_exit_holding_dashboard(gate_id)


@router.get("/exit-holding")
async def gate_exit_holding_endpoint(gate_id: str = "G1"):
    return await list_exit_holding(gate_id)


@router.get("/vehicles/{vehicle_id}/exit-verification")
async def gate_exit_verification_detail_endpoint(vehicle_id: str, gate_id: str = "G1"):
    return await get_exit_verification_detail(vehicle_id, gate_id)


@router.patch("/vehicles/{vehicle_id}/exit-checklist")
async def gate_exit_checklist_endpoint(vehicle_id: str, payload: GateClearanceUpdate):
    return await update_exit_checklist(
        vehicle_id,
        loading_completed_verified=payload.loading_completed_verified,
        appointment_completed_verified=payload.appointment_completed_verified,
        vehicle_verified=payload.vehicle_verified,
        delivery_document_verified=payload.delivery_document_verified,
        gate_pass_approved=payload.gate_pass_approved,
        invoice_approved=payload.invoice_approved,
        security_cleared=payload.security_cleared,
        gate_id=payload.gate_id,
    )


@router.post("/vehicles/{vehicle_id}/verify-exit")
async def gate_verify_exit_endpoint(
    vehicle_id: str,
    payload: GateVerifyExitRequest,
    _auth=Depends(require_permission(PERM_FLOW_VEHICLE_TRANSITION)),
):
    return await verify_exit(
        vehicle_id,
        payload.gate_id,
        payload.created_by,
        remarks=payload.remarks,
    )


@router.post("/vehicles/{vehicle_id}/gate-out")
async def gate_gate_out_endpoint(
    vehicle_id: str,
    payload: GateActionRequest,
    _auth=Depends(require_permission(PERM_FLOW_VEHICLE_TRANSITION)),
):
    return await gate_out(vehicle_id, payload.gate_id, payload.created_by)


@router.post("/vehicles/{vehicle_id}/reject-exit")
async def gate_reject_exit_endpoint(
    vehicle_id: str,
    payload: GateRejectRequest,
    _auth=Depends(require_permission(PERM_YARD_EVENT_WRITE)),
):
    await reject_exit(vehicle_id, payload.gate_id, payload.reason, payload.created_by)
    return {"ok": True}
