from pydantic import BaseModel, Field

from app.schemas.common import CategorySlotStats, ORMModel


class FloorResponse(ORMModel):
    id: str
    floorNumber: int
    floorName: str
    twoWheeler: CategorySlotStats
    fourWheeler: CategorySlotStats
    heavyVehicle: CategorySlotStats
    status: str


class FacilitySummaryResponse(ORMModel):
    totalFloors: int
    totalCapacity: int
    totalOccupied: int
    totalAvailable: int
    occupancyPercent: int
    twoWheeler: CategorySlotStats
    fourWheeler: CategorySlotStats
    heavyVehicle: CategorySlotStats


class FloorCategoryInput(BaseModel):
    capacity: int = Field(ge=0)
    occupied: int = Field(default=0, ge=0)


class FloorCreateRequest(BaseModel):
    floorNumber: int | None = None
    floorName: str
    twoWheeler: FloorCategoryInput
    fourWheeler: FloorCategoryInput
    heavyVehicle: FloorCategoryInput


class FloorUpdateRequest(BaseModel):
    floorNumber: int | None = None
    floorName: str | None = None
    twoWheeler: FloorCategoryInput | None = None
    fourWheeler: FloorCategoryInput | None = None
    heavyVehicle: FloorCategoryInput | None = None
