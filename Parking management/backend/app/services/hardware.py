import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.exceptions import not_found
from app.core.timezone import utc_now
from app.models.hardware import HardwareDevice
from app.services.audit import write_audit_log
from app.utils.serializers import format_datetime


def list_hardware(db: Session) -> list[dict]:
    devices = db.scalars(select(HardwareDevice).order_by(HardwareDevice.name)).all()
    return [_serialize_device(device) for device in devices]


def restart_hardware(db: Session, device_id: str, actor) -> dict:
    device = _get_hardware_device_by_public_id(db, device_id)
    device.status = "Online"
    device.last_ping_at = utc_now()
    write_audit_log(db, actor=actor, action="Hardware Restart", details=f"Restarted {device.name}")
    db.commit()
    db.refresh(device)
    return _serialize_device(device)


def _get_hardware_device_by_public_id(db: Session, device_id: str) -> HardwareDevice:
    filters = [HardwareDevice.external_code == device_id]
    try:
        filters.append(HardwareDevice.id == uuid.UUID(device_id))
    except ValueError:
        pass

    device = db.scalar(select(HardwareDevice).where(or_(*filters)))
    if not device:
        raise not_found("Hardware device")
    return device


def _serialize_device(device: HardwareDevice) -> dict:
    return {
        "id": device.external_code or str(device.id),
        "name": device.name,
        "type": device.type,
        "status": device.status,
        "lastPing": format_datetime(device.last_ping_at) or "",
        "location": device.location,
    }
