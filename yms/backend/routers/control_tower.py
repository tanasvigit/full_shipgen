"""Control Tower API — operational alerts."""

from fastapi import APIRouter, Depends

from auth_rbac import MOD_CONTROL_TOWER, AuthContext, require_module
from schemas import ControlTowerAlertsOut
from services.control_tower_alerts_service import get_control_tower_alerts

router = APIRouter(prefix="/control-tower", tags=["control-tower"])


@router.get("/alerts", response_model=ControlTowerAlertsOut)
async def control_tower_alerts_endpoint(
    _ctx: AuthContext = Depends(require_module(MOD_CONTROL_TOWER)),
):
    return ControlTowerAlertsOut(**(await get_control_tower_alerts()))
