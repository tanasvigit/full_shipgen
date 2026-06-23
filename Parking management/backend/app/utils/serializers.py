from datetime import datetime
from decimal import Decimal

from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.ticket import TicketResponse


def format_datetime(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone().isoformat()


def serialize_user(user: User) -> dict:
    return {
        "id": user.external_code or str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role.name,
        "status": user.status,
        "createdAt": format_datetime(user.created_at),
    }


def serialize_ticket(ticket: Ticket) -> TicketResponse:
    return TicketResponse(
        id=ticket.ticket_code,
        vehicleNumber=ticket.vehicle_number,
        category=ticket.category,
        entryType=ticket.entry_type,
        amount=Decimal(ticket.amount),
        status=ticket.status,
        paymentMethod=ticket.payment_method,
        entryTime=format_datetime(ticket.entry_time) or "",
        exitTime=format_datetime(ticket.exit_time),
        operatorId=ticket.operator.external_code or str(ticket.operator_id),
        floorNumber=ticket.floor.floor_number if ticket.floor else None,
        floorName=ticket.floor.floor_name if ticket.floor else None,
        slotStatus=ticket.slot_status,
    )
