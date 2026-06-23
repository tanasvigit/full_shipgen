from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


def write_audit_log(db: Session, *, actor: User | None, action: str, details: str) -> AuditLog:
    entry = AuditLog(
        action=action,
        user_id=actor.id if actor else None,
        user_name=actor.name if actor else "System",
        role=actor.role.name if actor and actor.role else "system",
        details=details,
    )
    db.add(entry)
    db.flush()
    return entry
