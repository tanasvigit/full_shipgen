from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_permissions
from app.schemas.hardware import HardwareDeviceResponse
from app.services import hardware as hardware_service

router = APIRouter()
HardwareReader = Annotated[object, Depends(require_permissions("hardware.configure"))]
HardwareManager = Annotated[object, Depends(require_permissions("hardware.configure"))]


@router.get("", response_model=list[HardwareDeviceResponse])
def get_hardware(db: DbSession, _: HardwareReader) -> list[HardwareDeviceResponse]:
    return hardware_service.list_hardware(db)


@router.post("/{device_id}/restart", response_model=HardwareDeviceResponse)
def restart_hardware(device_id: str, db: DbSession, actor: HardwareManager) -> HardwareDeviceResponse:
    return hardware_service.restart_hardware(db, device_id, actor)
