from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_permissions, require_roles
from app.services import dashboards as dashboards_service

router = APIRouter()


@router.get("/admin")
def admin_dashboard(db: DbSession, _: Annotated[object, Depends(require_roles("admin"))]) -> dict:
    return dashboards_service.get_admin_dashboard(db)


@router.get("/supervisor")
def supervisor_dashboard(
    db: DbSession,
    _: Annotated[object, Depends(require_roles("supervisor", "admin"))],
) -> dict:
    return dashboards_service.get_supervisor_dashboard(db)


@router.get("/operator")
def operator_dashboard(
    db: DbSession,
    _: Annotated[object, Depends(require_roles("operator", "admin"))],
) -> dict:
    return dashboards_service.get_operator_dashboard(db)
