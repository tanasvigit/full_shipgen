from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.ticket import Payment, Ticket
from app.services.floors import get_facility_summary
from app.services.report_filters import normalize_vehicle_type, ticket_category_clause
from app.services.report_range import resolve_report_window


def _window(
    range_key: str | None,
    start_date: date | None,
    end_date: date | None,
) -> tuple[datetime, datetime, str]:
    return resolve_report_window(range_key, start_date, end_date)


def _vehicle_type(vehicle_type: str | None) -> str | None:
    return normalize_vehicle_type(vehicle_type)


def revenue_report(
    db: Session,
    range_key: str | None = "7d",
    start_date: date | None = None,
    end_date: date | None = None,
    vehicle_type: str | None = None,
) -> dict:
    start, end, label = _window(range_key, start_date, end_date)
    vehicle = _vehicle_type(vehicle_type)
    category_clause = ticket_category_clause(vehicle, Ticket.category)

    query = (
        select(func.date(Payment.collected_at), func.sum(Payment.amount))
        .join(Ticket, Ticket.id == Payment.ticket_id)
        .where(Payment.collected_at >= start, Payment.collected_at <= end)
    )
    if category_clause is not None:
        query = query.where(category_clause)

    rows = db.execute(
        query.group_by(func.date(Payment.collected_at)).order_by(func.date(Payment.collected_at))
    ).all()
    points = [{"day": str(day), "revenue": Decimal(amount)} for day, amount in rows]
    total = sum((point["revenue"] for point in points), Decimal("0"))
    return {"range": label, "points": points, "total": total}


def traffic_report(
    db: Session,
    range_key: str | None = "today",
    start_date: date | None = None,
    end_date: date | None = None,
    vehicle_type: str | None = None,
) -> dict:
    start, end, label = _window(range_key, start_date, end_date)
    vehicle = _vehicle_type(vehicle_type)
    category_clause = ticket_category_clause(vehicle, Ticket.category)

    entry_query = select(func.count(Ticket.id)).where(
        Ticket.entry_time >= start,
        Ticket.entry_time <= end,
    )
    exit_query = select(func.count(Ticket.id)).where(
        Ticket.exit_time.is_not(None),
        Ticket.exit_time >= start,
        Ticket.exit_time <= end,
    )
    inside_query = select(func.count(Ticket.id)).where(Ticket.status != "Exited")

    if category_clause is not None:
        entry_query = entry_query.where(category_clause)
        exit_query = exit_query.where(category_clause)
        inside_query = inside_query.where(category_clause)

    entries = db.scalar(entry_query) or 0
    exits = db.scalar(exit_query) or 0
    vehicles_inside = db.scalar(inside_query) or 0
    return {
        "range": label,
        "todayEntries": entries,
        "todayExits": exits,
        "vehiclesInside": vehicles_inside,
    }


def _count_entries_in_range(
    db: Session,
    start: datetime,
    end: datetime,
    vehicle: str | None,
    category_filter,
) -> int:
    query = select(func.count(Ticket.id)).where(
        Ticket.entry_time >= start,
        Ticket.entry_time <= end,
    )
    category_clause = ticket_category_clause(vehicle, Ticket.category)
    if category_clause is not None:
        query = query.where(category_clause)
    if category_filter is not None:
        query = query.where(category_filter)
    return db.scalar(query) or 0


def occupancy_report(
    db: Session,
    range_key: str | None = "today",
    start_date: date | None = None,
    end_date: date | None = None,
    vehicle_type: str | None = None,
) -> dict:
    start, end, label = _window(range_key, start_date, end_date)
    vehicle = _vehicle_type(vehicle_type)
    two_wheeler = _count_entries_in_range(db, start, end, vehicle, Ticket.category == "2 Wheeler")
    four_wheeler = _count_entries_in_range(db, start, end, vehicle, Ticket.category == "4 Wheeler")
    other_count = _count_entries_in_range(
        db,
        start,
        end,
        vehicle,
        Ticket.category.in_(("Heavy Vehicles", "Bus")),
    )
    # Live facility snapshot (not historical for the selected range).
    summary = get_facility_summary(db)
    return {
        "range": label,
        "occupiedSlots": summary.totalOccupied,
        "totalSlots": summary.totalCapacity,
        "occupancyPercent": summary.occupancyPercent,
        "twoWheelerCount": two_wheeler,
        "fourWheelerCount": four_wheeler,
        "otherCount": other_count,
    }
