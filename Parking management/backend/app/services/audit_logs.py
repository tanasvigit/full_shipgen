from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.utils.serializers import format_datetime


def list_audit_logs(db: Session, limit: int = 100) -> list[dict]:
    logs = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)).all()
    return [
        {
            "id": str(log.id),
            "action": log.action,
            "user": log.user_name,
            "role": log.role,
            "timestamp": format_datetime(log.created_at) or "",
            "details": log.details,
        }
        for log in logs
    ]
