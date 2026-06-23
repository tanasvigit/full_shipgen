import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import AppError, not_found
from app.models.parking import ParkingFloor, ParkingFloorCapacity
from app.models.ticket import Ticket
from app.schemas.floor import FloorCreateRequest, FloorUpdateRequest
from app.services.audit import write_audit_log
from app.utils.floors import build_facility_summary, create_category_stats, serialize_floor


def list_floors(db: Session) -> list:
    floors = db.scalars(
        select(ParkingFloor).options(joinedload(ParkingFloor.capacities)).order_by(ParkingFloor.floor_number)
    ).unique().all()
    return [serialize_floor(floor) for floor in floors]


def get_facility_summary(db: Session):
    floors = db.scalars(select(ParkingFloor).options(joinedload(ParkingFloor.capacities))).unique().all()
    return build_facility_summary(floors)


def create_floor(db: Session, payload: FloorCreateRequest, actor) -> dict:
    floor_number = payload.floorNumber
    if floor_number is None:
        floor_number = (db.scalar(select(func.max(ParkingFloor.floor_number))) or 0) + 1
    elif db.scalar(select(ParkingFloor.id).where(ParkingFloor.floor_number == floor_number)):
        raise AppError("FLOOR_NUMBER_EXISTS", "A floor with this number already exists.")
    floor = ParkingFloor(floor_number=floor_number, floor_name=payload.floorName)
    db.add(floor)
    db.flush()
    for key, value in (
        ("two_wheeler", payload.twoWheeler),
        ("four_wheeler", payload.fourWheeler),
        ("heavy_vehicle", payload.heavyVehicle),
    ):
        stats = create_category_stats(value.capacity, value.occupied)
        db.add(
            ParkingFloorCapacity(
                floor_id=floor.id,
                category_key=key,
                capacity=stats.capacity,
                occupied=stats.occupied,
            )
        )
    write_audit_log(db, actor=actor, action="Floor Created", details=f"Created {floor.floor_name}")
    db.commit()
    floor = db.scalar(select(ParkingFloor).options(joinedload(ParkingFloor.capacities)).where(ParkingFloor.id == floor.id))
    return serialize_floor(floor)


def update_floor(db: Session, floor_id: str, payload: FloorUpdateRequest, actor) -> dict:
    floor = _get_floor(db, floor_id)
    if payload.floorNumber is not None:
        floor.floor_number = payload.floorNumber
    if payload.floorName is not None:
        floor.floor_name = payload.floorName
    capacity_map = {item.category_key: item for item in floor.capacities}
    for key, value in (
        ("two_wheeler", payload.twoWheeler),
        ("four_wheeler", payload.fourWheeler),
        ("heavy_vehicle", payload.heavyVehicle),
    ):
        if value is None:
            continue
        stats = create_category_stats(value.capacity, value.occupied)
        if stats.occupied > stats.capacity:
            raise AppError("INVALID_CAPACITY", "Occupied slots cannot exceed capacity.")
        capacity_map[key].capacity = stats.capacity
        capacity_map[key].occupied = stats.occupied
    write_audit_log(db, actor=actor, action="Floor Updated", details=f"Updated {floor.floor_name}")
    db.commit()
    db.refresh(floor)
    return serialize_floor(floor)


def delete_floor(db: Session, floor_id: str, actor) -> None:
    floor = _get_floor(db, floor_id)
    active_ticket = db.scalar(
        select(Ticket).where(Ticket.floor_id == floor.id, Ticket.status != "Exited")
    )
    if active_ticket:
        raise AppError("FLOOR_IN_USE", "Cannot delete a floor with active tickets.")
    write_audit_log(db, actor=actor, action="Floor Deleted", details=f"Deleted {floor.floor_name}")
    db.delete(floor)
    db.commit()


def _get_floor(db: Session, floor_id: str) -> ParkingFloor:
    filters = [ParkingFloor.floor_name == floor_id]
    try:
        filters.append(ParkingFloor.id == uuid.UUID(floor_id))
    except ValueError:
        pass

    floor = db.scalar(
        select(ParkingFloor)
        .options(joinedload(ParkingFloor.capacities))
        .where(or_(*filters))
    )
    if not floor:
        raise not_found("Floor")
    return floor
