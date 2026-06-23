from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DbSession, require_permissions
from app.schemas.common import MessageResponse
from app.schemas.ticket import TicketCreateRequest, TicketPaymentRequest, TicketQrResponse, TicketResponse
from app.services import tickets as tickets_service

router = APIRouter()
TicketReader = Annotated[CurrentUser, Depends(require_permissions("recent.tickets", "vehicle.search"))]
TicketCreator = Annotated[CurrentUser, Depends(require_permissions("tickets.create"))]
PaymentCollector = Annotated[CurrentUser, Depends(require_permissions("payments.collect"))]
QrReader = Annotated[CurrentUser, Depends(require_permissions("qr.print", "qr.monitoring"))]


@router.get("", response_model=list[TicketResponse])
def get_tickets(db: DbSession, _: TicketReader) -> list[TicketResponse]:
    return tickets_service.list_tickets(db)


@router.get("/search", response_model=list[TicketResponse])
def search_tickets(db: DbSession, _: TicketReader, query: str = Query(min_length=1)) -> list[TicketResponse]:
    return tickets_service.search_tickets(db, query)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str, db: DbSession, _: TicketReader) -> TicketResponse:
    return tickets_service.get_ticket(db, ticket_id)


@router.post("", response_model=TicketResponse)
def create_ticket(payload: TicketCreateRequest, db: DbSession, actor: TicketCreator) -> TicketResponse:
    return tickets_service.create_ticket(db, payload, actor)


@router.post("/{ticket_id}/payments", response_model=TicketResponse)
def collect_payment(
    ticket_id: str,
    payload: TicketPaymentRequest,
    db: DbSession,
    actor: PaymentCollector,
) -> TicketResponse:
    return tickets_service.collect_payment(db, ticket_id, payload, actor)


@router.post("/{ticket_id}/exit", response_model=TicketResponse)
def exit_ticket(ticket_id: str, db: DbSession, actor: TicketCreator) -> TicketResponse:
    return tickets_service.exit_ticket(db, ticket_id, actor)


@router.get("/{ticket_id}/qr", response_model=TicketQrResponse)
def get_ticket_qr(ticket_id: str, db: DbSession, _: QrReader) -> TicketQrResponse:
    return tickets_service.get_ticket_qr(db, ticket_id)
