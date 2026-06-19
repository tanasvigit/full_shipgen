from typing import Optional

from fastapi import APIRouter, Depends, Query

from auth_rbac import PERM_YARD_ZONE_WRITE, require_permission
from routers.list_response import build_list_response
from schemas import (
    MoveVehicleRequest,
    VehicleOut,
    VehicleZoneHistoryOut,
    YardDashboardOut,
    YardZoneCreate,
    YardZoneOut,
    YardZoneUpdate,
)
from services.yard_service import (
    build_yard_dashboard,
    create_yard_zone,
    delete_yard_zone,
    get_vehicle_zone_history,
    get_yard_zone,
    list_yard_zones,
    move_vehicle_to_zone,
    update_yard_zone,
)
from services.yms_service import get_vehicle

router = APIRouter(prefix="/yard", tags=["yard"])


@router.get("/dashboard", response_model=YardDashboardOut)
async def yard_dashboard_endpoint():
    return YardDashboardOut(**(await build_yard_dashboard()))


@router.get("/zones")
async def list_zones_endpoint(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    zone_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
):
    rows, total = await list_yard_zones(q=q, status=status, zone_type=zone_type, skip=skip, limit=limit)
    return build_list_response(rows, total, YardZoneOut, skip=skip, limit=limit)


@router.post("/zones", response_model=YardZoneOut)
async def create_zone_endpoint(
    payload: YardZoneCreate,
    _auth=Depends(require_permission(PERM_YARD_ZONE_WRITE)),
):
    row = await create_yard_zone(payload.model_dump())
    return YardZoneOut(**row)


@router.get("/zones/{zone_id}", response_model=YardZoneOut)
async def get_zone_endpoint(zone_id: str):
    return YardZoneOut(**(await get_yard_zone(zone_id)))


@router.patch("/zones/{zone_id}", response_model=YardZoneOut)
async def update_zone_endpoint(
    zone_id: str,
    payload: YardZoneUpdate,
    _auth=Depends(require_permission(PERM_YARD_ZONE_WRITE)),
):
    row = await update_yard_zone(zone_id, payload.model_dump(exclude_unset=True))
    return YardZoneOut(**row)


@router.delete("/zones/{zone_id}", status_code=204)
async def delete_zone_endpoint(
    zone_id: str,
    _auth=Depends(require_permission(PERM_YARD_ZONE_WRITE)),
):
    await delete_yard_zone(zone_id)


@router.get("/vehicle-history/{vehicle_id}", response_model=list[VehicleZoneHistoryOut])
async def vehicle_history_endpoint(vehicle_id: str, limit: int = Query(50, ge=1, le=200)):
    rows = await get_vehicle_zone_history(vehicle_id, limit=limit)
    return [VehicleZoneHistoryOut(**r) for r in rows]


@router.post("/move-vehicle/{vehicle_id}")
async def move_vehicle_endpoint(
    vehicle_id: str,
    payload: MoveVehicleRequest,
    _auth=Depends(require_permission(PERM_YARD_ZONE_WRITE)),
):
    result = await move_vehicle_to_zone(
        vehicle_id,
        payload.zone_id,
        reason=payload.reason,
        created_by=payload.created_by,
    )
    vehicle = await get_vehicle(vehicle_id)
    return {"move": result, "vehicle": VehicleOut(**vehicle)}
