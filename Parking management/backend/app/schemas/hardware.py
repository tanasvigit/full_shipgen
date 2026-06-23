from app.schemas.common import ORMModel


class HardwareDeviceResponse(ORMModel):
    id: str
    name: str
    type: str
    status: str
    lastPing: str
    location: str
