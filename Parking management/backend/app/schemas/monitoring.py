from app.schemas.common import ORMModel
from app.schemas.dashboard import ActiveOperatorResponse, SupervisorAlertResponse


class QrScanEventResponse(ORMModel):
    id: str
    ticket: str
    vehicle: str
    action: str
    status: str
    time: str


class RecentMovementResponse(ORMModel):
    vehicle: str
    category: str
    time: str
    ticketId: str | None = None


class OperatorActivityResponse(ORMModel):
    id: str
    operator: str
    action: str
    ticketId: str
    vehicle: str
    time: str
