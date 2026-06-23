from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.audit import AuditLog
from app.models.hardware import HardwareDevice
from app.models.monitoring import SupervisorAlert
from app.models.ticket import Payment, Ticket
from app.models.auth import Role
from app.models.user import User
from app.services.audit_logs import list_audit_logs
from app.services.floors import get_facility_summary
from app.services.hardware import list_hardware
from app.services.tickets import list_tickets
from app.utils.floors import vehicle_category_to_bucket
from app.utils.serializers import serialize_ticket


def _start_of_today() -> datetime:
    now = datetime.now(UTC)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _dashboard_stats(db: Session) -> dict:
    today = _start_of_today()
    active_tickets = db.scalars(select(Ticket).where(Ticket.status != "Exited")).all()
    today_entries = db.scalar(select(func.count(Ticket.id)).where(Ticket.entry_time >= today)) or 0
    today_exits = db.scalar(select(func.count(Ticket.id)).where(Ticket.exit_time.is_not(None), Ticket.exit_time >= today)) or 0
    revenue_today = db.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.collected_at >= today)) or 0
    two_wheeler = sum(1 for ticket in active_tickets if vehicle_category_to_bucket(ticket.category) == "two_wheeler")
    four_wheeler = sum(1 for ticket in active_tickets if vehicle_category_to_bucket(ticket.category) == "four_wheeler")
    summary = get_facility_summary(db)
    return {
        "vehiclesInside": len(active_tickets),
        "todayEntries": today_entries,
        "todayExits": today_exits,
        "revenueToday": Decimal(revenue_today),
        "occupiedSlots": summary.totalOccupied,
        "totalSlots": summary.totalCapacity,
        "twoWheelerCount": two_wheeler,
        "fourWheelerCount": four_wheeler,
    }


def get_admin_dashboard(db: Session) -> dict:
    return {
        "stats": _dashboard_stats(db),
        "facilitySummary": get_facility_summary(db).model_dump(),
        "hardware": list_hardware(db),
        "auditLogs": list_audit_logs(db, limit=10),
        "recentTickets": list_tickets(db)[:5],
    }


def get_supervisor_dashboard(db: Session) -> dict:
    stats = _dashboard_stats(db)
    summary = get_facility_summary(db)
    occupancy_percent = summary.occupancyPercent
    operators = db.scalars(
        select(User).join(Role).options(joinedload(User.role)).where(Role.name == "operator", User.status == "active")
    ).all()
    active_operators = []
    for operator in operators:
        tickets_issued = db.scalar(
            select(func.count(Ticket.id)).where(Ticket.operator_id == operator.id, Ticket.entry_time >= _start_of_today())
        ) or 0
        active_operators.append(
            {
                "id": operator.external_code or str(operator.id),
                "name": operator.name,
                "shift": "Morning",
                "ticketsIssued": tickets_issued,
                "status": "Active",
            }
        )
    alerts = db.scalars(select(SupervisorAlert).where(SupervisorAlert.is_resolved.is_(False)).limit(10)).all()
    return {
        "stats": stats,
        "occupancyPercent": occupancy_percent,
        "activeOperators": active_operators,
        "alerts": [
            {
                "id": str(alert.id),
                "severity": alert.severity,
                "title": alert.title,
                "detail": alert.detail,
                "time": alert.created_at.astimezone().isoformat(),
            }
            for alert in alerts
        ],
        "recentTickets": list_tickets(db)[:5],
    }


def get_operator_dashboard(db: Session) -> dict:
    stats = _dashboard_stats(db)
    tickets = db.scalars(select(Ticket).options(joinedload(Ticket.operator), joinedload(Ticket.floor))).all()
    today = _start_of_today()
    tickets_today = [ticket for ticket in tickets if ticket.entry_time >= today]
    unpaid_count = sum(1 for ticket in tickets if ticket.status == "Unpaid")
    upi_count = sum(1 for ticket in tickets if ticket.payment_method == "UPI")
    cash_count = sum(1 for ticket in tickets if ticket.payment_method == "Cash")
    return {
        "stats": stats,
        "facilitySummary": get_facility_summary(db).model_dump(),
        "ticketsToday": len(tickets_today),
        "unpaidCount": unpaid_count,
        "upiCount": upi_count,
        "cashCount": cash_count,
        "recentTickets": [serialize_ticket(ticket) for ticket in tickets[:5]],
    }
