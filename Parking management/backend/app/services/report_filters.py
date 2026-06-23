from sqlalchemy import ColumnElement
from sqlalchemy.orm import InstrumentedAttribute

from app.models.ticket import Ticket
from app.utils.floors import vehicle_category_to_bucket

VEHICLE_TYPE_BUCKETS = frozenset({"two_wheeler", "four_wheeler", "other"})


def normalize_vehicle_type(vehicle_type: str | None) -> str | None:
    if vehicle_type is None:
        return None
    key = vehicle_type.strip().lower()
    if key not in VEHICLE_TYPE_BUCKETS:
        raise ValueError(f"vehicle_type must be one of: {', '.join(sorted(VEHICLE_TYPE_BUCKETS))}")
    return key


def ticket_matches_vehicle_type(category: str, vehicle_type: str | None) -> bool:
    if vehicle_type is None:
        return True
    bucket = vehicle_category_to_bucket(category)
    if vehicle_type == "other":
        return bucket == "heavy_vehicle"
    return bucket == vehicle_type


def ticket_category_clause(
    vehicle_type: str | None,
    category_column: InstrumentedAttribute[str],
) -> ColumnElement[bool] | None:
    if vehicle_type is None:
        return None
    if vehicle_type == "two_wheeler":
        return category_column == "2 Wheeler"
    if vehicle_type == "four_wheeler":
        return category_column == "4 Wheeler"
    return category_column.in_(("Heavy Vehicles", "Bus"))
