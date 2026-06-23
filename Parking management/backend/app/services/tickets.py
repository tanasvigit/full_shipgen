import secrets
from decimal import Decimal

from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import AppError, not_found
from app.core.timezone import utc_now
from app.models.parking import ParkingFloor, ParkingFloorCapacity
from app.models.pricing import PricingRule
from app.models.ticket import Payment, Ticket, VehicleEvent
from app.models.user import User
from app.schemas.ticket import TicketCreateRequest, TicketPaymentRequest
from app.services.audit import write_audit_log
from app.utils.floors import vehicle_category_to_bucket
from app.utils.serializers import serialize_ticket


def list_tickets(db: Session) -> list:
    tickets = db.scalars(
        select(Ticket)
        .options(joinedload(Ticket.operator), joinedload(Ticket.floor))
        .order_by(Ticket.entry_time.desc())
    ).all()
    return [serialize_ticket(ticket) for ticket in tickets]


def get_ticket(db: Session, ticket_id: str) -> dict:
    ticket = _get_ticket_entity(db, ticket_id)
    return serialize_ticket(ticket)


def search_tickets(db: Session, query: str) -> list:
    pattern = f"%{query.upper()}%"
    tickets = db.scalars(
        select(Ticket)
        .options(joinedload(Ticket.operator), joinedload(Ticket.floor))
        .where(or_(Ticket.ticket_code.ilike(pattern), Ticket.vehicle_number.ilike(pattern)))
        .order_by(Ticket.entry_time.desc())
    ).all()
    return [serialize_ticket(ticket) for ticket in tickets]


def create_ticket(db: Session, payload: TicketCreateRequest, operator: User) -> dict:
    bucket = vehicle_category_to_bucket(payload.category)
    floor = db.scalars(
        select(ParkingFloor)
        .options(joinedload(ParkingFloor.capacities))
        .join(ParkingFloorCapacity)
        .where(
            ParkingFloorCapacity.category_key == bucket,
            ParkingFloorCapacity.occupied < ParkingFloorCapacity.capacity,
        )
        .order_by(ParkingFloor.floor_number)
    ).unique().first()
    if not floor:
        raise AppError("NO_FLOOR_CAPACITY", f"No available {payload.category} capacity on any floor.")

    capacity = next(item for item in floor.capacities if item.category_key == bucket)
    amount = _calculate_amount(db, payload)
    status = "Paid"
    payment_method = None if payload.entryType == "Free Entry" or amount == 0 else payload.paymentMethod
    if amount > 0 and not payload.pay_now:
        status = "Unpaid"
    elif amount == 0:
        status = "Paid"
    elif payload.pay_now:
        if not payload.paymentMethod:
            raise AppError("PAYMENT_METHOD_REQUIRED", "Payment method is required when pay_now is true.")
        status = "Paid"
        payment_method = payload.paymentMethod

    ticket = Ticket(
        ticket_code=_next_ticket_code(db),
        vehicle_number=payload.vehicleNumber.upper(),
        category=payload.category,
        entry_type=payload.entryType,
        amount=amount,
        status=status,
        payment_method=payment_method,
        slot_status="Occupied",
        qr_token=secrets.token_urlsafe(24),
        operator_id=operator.id,
        floor_id=floor.id,
    )
    db.add(ticket)
    capacity.occupied += 1
    db.add(
        VehicleEvent(
            ticket_id=None,
            vehicle_number=ticket.vehicle_number,
            category=ticket.category,
            event_type="entry",
            event_time=utc_now(),
        )
    )
    db.flush()
    if payload.pay_now and amount > 0:
        db.add(
            Payment(
                ticket_id=ticket.id,
                amount=amount,
                method=payload.paymentMethod or "Cash",
                collected_by=operator.id,
            )
        )
    write_audit_log(
        db,
        actor=operator,
        action="Ticket Created",
        details=f"Ticket {ticket.ticket_code} created for {ticket.vehicle_number}",
    )
    db.commit()
    ticket = _get_ticket_entity(db, ticket.ticket_code)
    return serialize_ticket(ticket)


def collect_payment(db: Session, ticket_id: str, payload: TicketPaymentRequest, actor: User) -> dict:
    ticket = _get_ticket_entity(db, ticket_id)
    if ticket.status != "Unpaid":
        raise AppError("TICKET_NOT_UNPAID", "Only unpaid tickets can accept payment.")
    ticket.status = "Paid"
    ticket.payment_method = payload.paymentMethod
    db.add(
        Payment(
            ticket_id=ticket.id,
            amount=ticket.amount,
            method=payload.paymentMethod,
            collected_by=actor.id,
        )
    )
    write_audit_log(
        db,
        actor=actor,
        action="Payment Collected",
        details=f"Payment collected for {ticket.ticket_code}",
    )
    db.commit()
    return serialize_ticket(_get_ticket_entity(db, ticket.ticket_code))


def exit_ticket(db: Session, ticket_id: str, actor: User) -> dict:
    ticket = _get_ticket_entity(db, ticket_id)
    if ticket.status == "Exited":
        raise AppError("TICKET_ALREADY_EXITED", "Ticket has already exited.")
    ticket.status = "Exited"
    ticket.exit_time = utc_now()
    ticket.slot_status = "Available"
    if ticket.floor:
        bucket = vehicle_category_to_bucket(ticket.category)
        capacity = next((item for item in ticket.floor.capacities if item.category_key == bucket), None)
        if capacity and capacity.occupied > 0:
            capacity.occupied -= 1
    db.add(
        VehicleEvent(
            ticket_id=ticket.id,
            vehicle_number=ticket.vehicle_number,
            category=ticket.category,
            event_type="exit",
            event_time=ticket.exit_time,
        )
    )
    write_audit_log(
        db,
        actor=actor,
        action="Vehicle Exit",
        details=f"Vehicle exited for ticket {ticket.ticket_code}",
    )
    db.commit()
    return serialize_ticket(_get_ticket_entity(db, ticket.ticket_code))


def get_ticket_qr(db: Session, ticket_id: str) -> dict:
    ticket = _get_ticket_entity(db, ticket_id)
    return {
        "ticketId": ticket.ticket_code,
        "vehicleNumber": ticket.vehicle_number,
        "amount": Decimal(ticket.amount),
        "category": ticket.category,
        "floorName": ticket.floor.floor_name if ticket.floor else None,
        "floorNumber": ticket.floor.floor_number if ticket.floor else None,
        "slotStatus": ticket.slot_status,
        "qrPayload": ticket.qr_token,
    }


def _calculate_amount(db: Session, payload: TicketCreateRequest) -> Decimal:
    if payload.entryType == "Free Entry" or payload.category == "Free Entry":
        return Decimal("0")
    rule = db.scalar(select(PricingRule).where(PricingRule.category == payload.category, PricingRule.is_active.is_(True)))
    if not rule:
        raise AppError("PRICING_NOT_FOUND", f"No active pricing rule for {payload.category}.")
    return Decimal(rule.base_price)


def _next_ticket_code(db: Session) -> str:
    codes = db.scalars(select(Ticket.ticket_code)).all()
    numeric = max((int("".join(char for char in code if char.isdigit()) or 0) for code in codes), default=102398)
    return f"PK{numeric + 1}"


def _ticket_lookup_filters(ticket_id: str) -> list:
    filters = [Ticket.ticket_code == ticket_id]
    try:
        filters.append(Ticket.id == UUID(ticket_id))
    except ValueError:
        pass
    return filters


def _get_ticket_entity(db: Session, ticket_id: str) -> Ticket:
    ticket = db.scalars(
        select(Ticket)
        .options(joinedload(Ticket.operator), joinedload(Ticket.floor).joinedload(ParkingFloor.capacities))
        .where(or_(*_ticket_lookup_filters(ticket_id)))
    ).unique().first()
    if not ticket:
        raise not_found("Ticket")
    return ticket
