from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.audit import AuditLog
from app.models.monitoring import QrScanEvent, SupervisorAlert
from app.models.ticket import Ticket, VehicleEvent
from app.models.auth import Role
from app.models.user import User
from app.services.dashboards import _start_of_today
from app.utils.serializers import format_datetime


def list_active_operators(db: Session) -> list[dict]:
    operators = db.scalars(
        select(User).join(Role).options(joinedload(User.role)).where(Role.name == "operator", User.status == "active")
    ).all()
    result = []
    for operator in operators:
        tickets_issued = db.scalar(
            select(func.count(Ticket.id)).where(Ticket.operator_id == operator.id, Ticket.entry_time >= _start_of_today())
        ) or 0
        result.append(
            {
                "id": operator.external_code or str(operator.id),
                "name": operator.name,
                "shift": "Morning",
                "ticketsIssued": tickets_issued,
                "status": "Active",
            }
        )
    return result


def list_alerts(db: Session) -> list[dict]:
    alerts = db.scalars(select(SupervisorAlert).order_by(SupervisorAlert.created_at.desc()).limit(50)).all()
    return [
        {
            "id": str(alert.id),
            "severity": alert.severity,
            "title": alert.title,
            "detail": alert.detail,
            "time": format_datetime(alert.created_at) or "",
        }
        for alert in alerts
    ]


def list_qr_scans(db: Session) -> list[dict]:
    scans = db.scalars(select(QrScanEvent).order_by(QrScanEvent.scanned_at.desc()).limit(50)).all()
    return [
        {
            "id": str(scan.id),
            "ticket": scan.ticket_code or "",
            "vehicle": scan.vehicle_number,
            "action": scan.action,
            "status": scan.status,
            "time": format_datetime(scan.scanned_at) or "",
        }
        for scan in scans
    ]


def list_entries(db: Session) -> list[dict]:
    events = db.scalars(
        select(VehicleEvent).where(VehicleEvent.event_type == "entry").order_by(VehicleEvent.event_time.desc()).limit(50)
    ).all()
    return [
        {
            "vehicle": event.vehicle_number,
            "category": event.category,
            "time": format_datetime(event.event_time) or "",
            "ticketId": None,
        }
        for event in events
    ]


def list_exits(db: Session) -> list[dict]:
    events = db.scalars(
        select(VehicleEvent).where(VehicleEvent.event_type == "exit").order_by(VehicleEvent.event_time.desc()).limit(50)
    ).all()
    result = []
    for event in events:
        ticket_code = None
        if event.ticket_id:
            ticket = db.get(Ticket, event.ticket_id)
            ticket_code = ticket.ticket_code if ticket else None
        result.append(
            {
                "vehicle": event.vehicle_number,
                "category": event.category,
                "time": format_datetime(event.event_time) or "",
                "ticketId": ticket_code,
            }
        )
    return result


def list_operator_activity(db: Session) -> list[dict]:
    logs = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(50)).all()
    return [
        {
            "id": str(log.id),
            "operator": log.user_name,
            "action": log.action,
            "ticketId": "",
            "vehicle": "",
            "time": format_datetime(log.created_at) or "",
        }
        for log in logs
        if log.role == "operator"
    ]
