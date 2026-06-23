import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.timezone import utc_now


class ParkingFloor(Base):
    __tablename__ = "parking_floors"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    floor_number: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    floor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    capacities: Mapped[list["ParkingFloorCapacity"]] = relationship(back_populates="floor", cascade="all, delete-orphan")
    tickets: Mapped[list["Ticket"]] = relationship(back_populates="floor")


class ParkingFloorCapacity(Base):
    __tablename__ = "parking_floor_capacities"
    __table_args__ = (UniqueConstraint("floor_id", "category_key", name="uq_floor_category"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    floor_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("parking_floors.id", ondelete="CASCADE"), nullable=False)
    category_key: Mapped[str] = mapped_column(String(30), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    occupied: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    floor: Mapped[ParkingFloor] = relationship(back_populates="capacities")


from app.models.ticket import Ticket  # noqa: E402
