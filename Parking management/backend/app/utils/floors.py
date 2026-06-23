from app.models.parking import ParkingFloor, ParkingFloorCapacity
from app.schemas.common import CategorySlotStats
from app.schemas.floor import FacilitySummaryResponse, FloorResponse


CATEGORY_KEYS = ("two_wheeler", "four_wheeler", "heavy_vehicle")
CATEGORY_RESPONSE_KEYS = {
    "two_wheeler": "twoWheeler",
    "four_wheeler": "fourWheeler",
    "heavy_vehicle": "heavyVehicle",
}


def vehicle_category_to_bucket(category: str) -> str:
    if category == "2 Wheeler":
        return "two_wheeler"
    if category in {"4 Wheeler", "Heavy Vehicles", "Bus"}:
        return "four_wheeler" if category == "4 Wheeler" else "heavy_vehicle"
    return "heavy_vehicle"


def bucket_to_vehicle_label(bucket: str) -> str:
    return {
        "two_wheeler": "2 Wheeler",
        "four_wheeler": "4 Wheeler",
        "heavy_vehicle": "Heavy Vehicles",
    }[bucket]


def create_category_stats(capacity: int, occupied: int) -> CategorySlotStats:
    safe_capacity = max(capacity, 0)
    safe_occupied = min(max(occupied, 0), safe_capacity)
    return CategorySlotStats(capacity=safe_capacity, occupied=safe_occupied, available=safe_capacity - safe_occupied)


def derive_floor_status(floor: ParkingFloor) -> str:
    totals = get_floor_totals(floor)
    if totals.capacity == 0 or totals.occupied == 0:
        return "available"
    if totals.available == 0:
        return "full"
    return "partial"


def get_floor_totals(floor: ParkingFloor) -> CategorySlotStats:
    capacity = occupied = 0
    for item in floor.capacities:
        capacity += item.capacity
        occupied += item.occupied
    return create_category_stats(capacity, occupied)


def get_capacity_map(floor: ParkingFloor) -> dict[str, ParkingFloorCapacity]:
    return {item.category_key: item for item in floor.capacities}


def serialize_floor(floor: ParkingFloor) -> FloorResponse:
    capacity_map = get_capacity_map(floor)
    return FloorResponse(
        id=str(floor.id),
        floorNumber=floor.floor_number,
        floorName=floor.floor_name,
        twoWheeler=create_category_stats(capacity_map["two_wheeler"].capacity, capacity_map["two_wheeler"].occupied),
        fourWheeler=create_category_stats(capacity_map["four_wheeler"].capacity, capacity_map["four_wheeler"].occupied),
        heavyVehicle=create_category_stats(capacity_map["heavy_vehicle"].capacity, capacity_map["heavy_vehicle"].occupied),
        status=derive_floor_status(floor),
    )


def build_facility_summary(floors: list[ParkingFloor]) -> FacilitySummaryResponse:
    summary = {
        "two_wheeler": create_category_stats(0, 0),
        "four_wheeler": create_category_stats(0, 0),
        "heavy_vehicle": create_category_stats(0, 0),
    }
    total_capacity = total_occupied = 0
    for floor in floors:
        for item in floor.capacities:
            bucket = summary[item.category_key]
            summary[item.category_key] = create_category_stats(
                bucket.capacity + item.capacity,
                bucket.occupied + item.occupied,
            )
            total_capacity += item.capacity
            total_occupied += item.occupied
    total_available = total_capacity - total_occupied
    occupancy_percent = 0 if total_capacity == 0 else round((total_occupied / total_capacity) * 100)
    return FacilitySummaryResponse(
        totalFloors=len(floors),
        totalCapacity=total_capacity,
        totalOccupied=total_occupied,
        totalAvailable=total_available,
        occupancyPercent=occupancy_percent,
        twoWheeler=summary["two_wheeler"],
        fourWheeler=summary["four_wheeler"],
        heavyVehicle=summary["heavy_vehicle"],
    )
