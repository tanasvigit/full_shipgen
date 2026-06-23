from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_permissions
from app.schemas.audit import AuditLogResponse
from app.services import audit_logs as audit_service

router = APIRouter()
AuditReader = Annotated[object, Depends(require_permissions("audit.view"))]


@router.get("", response_model=list[AuditLogResponse])
def get_audit_logs(db: DbSession, _: AuditReader) -> list[AuditLogResponse]:
    return audit_service.list_audit_logs(db)
