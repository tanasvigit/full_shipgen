from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class TicketResponse(ORMModel):
    id: str
    vehicleNumber: str
    category: str
    entryType: str
    amount: Decimal
    status: str
    paymentMethod: str | None = None
    entryTime: str
    exitTime: str | None = None
    operatorId: str
    floorNumber: int | None = None
    floorName: str | None = None
    slotStatus: str | None = None


class TicketCreateRequest(BaseModel):
    vehicleNumber: str = Field(min_length=3, max_length=30)
    category: str
    entryType: str
    paymentMethod: str | None = None
    pay_now: bool = False


class TicketPaymentRequest(BaseModel):
    paymentMethod: str


class TicketQrResponse(ORMModel):
    ticketId: str
    vehicleNumber: str
    amount: Decimal
    category: str
    floorName: str | None = None
    floorNumber: int | None = None
    slotStatus: str | None = None
    qrPayload: str
