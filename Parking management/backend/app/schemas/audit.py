from app.schemas.common import ORMModel


class AuditLogResponse(ORMModel):
    id: str
    action: str
    user: str
    role: str
    timestamp: str
    details: str
