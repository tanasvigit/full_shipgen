from fastapi import APIRouter, Depends

from auth_rbac import PERM_QUEUE_WRITE, require_permission
from schemas import (
    QueueBundleOut,
    QueueEntryDetailOut,
    QueueEntryMetricsOut,
    QueueOverrideRequest,
)
from services.queue_service import (
    build_queue_bundle,
    get_queue_entry_detail,
    override_queue_priority,
)

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("/bundle", response_model=QueueBundleOut)
async def queue_bundle_endpoint():
    data = await build_queue_bundle()
    return QueueBundleOut(
        entries=[QueueEntryMetricsOut(**e) for e in data["entries"]],
        summary=data["summary"],
    )


@router.get("/entries/{queue_entry_id}/detail", response_model=QueueEntryDetailOut)
async def queue_entry_detail_endpoint(queue_entry_id: str):
    data = await get_queue_entry_detail(queue_entry_id)
    from schemas import AppointmentOut, DockOut, QueueEntryOut, VehicleOut

    return QueueEntryDetailOut(
        entry=QueueEntryOut(**data["entry"]),
        vehicle=VehicleOut(**data["vehicle"]),
        appointment=AppointmentOut(**data["appointment"]),
        dock=DockOut(**data["dock"]) if data.get("dock") else None,
        readiness=data["readiness"],
        metrics=QueueEntryMetricsOut(**data["metrics"]),
        labor=data.get("labor"),
        equipment=data.get("equipment"),
        recommendedDock=data.get("recommendedDock"),
    )


@router.post("/entries/{queue_entry_id}/override")
async def queue_override_endpoint(
    queue_entry_id: str,
    payload: QueueOverrideRequest,
    _auth=Depends(require_permission(PERM_QUEUE_WRITE)),
):
    return await override_queue_priority(
        queue_entry_id,
        target_rank=payload.target_rank,
        reason=payload.reason,
        supervisor=payload.supervisor,
        created_by=payload.created_by,
    )
