from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_permissions
from app.services import monitoring as monitoring_service

router = APIRouter()
MonitoringReader = Annotated[object, Depends(require_permissions("parking.status.view", "qr.monitoring", "operator.activity"))]


@router.get("/operators")
def monitoring_operators(db: DbSession, _: MonitoringReader) -> list[dict]:
    return monitoring_service.list_active_operators(db)


@router.get("/alerts")
def monitoring_alerts(db: DbSession, _: MonitoringReader) -> list[dict]:
    return monitoring_service.list_alerts(db)


@router.get("/qr-scans")
def monitoring_qr_scans(db: DbSession, _: MonitoringReader) -> list[dict]:
    return monitoring_service.list_qr_scans(db)


@router.get("/entries")
def monitoring_entries(db: DbSession, _: MonitoringReader) -> list[dict]:
    return monitoring_service.list_entries(db)


@router.get("/exits")
def monitoring_exits(db: DbSession, _: MonitoringReader) -> list[dict]:
    return monitoring_service.list_exits(db)
