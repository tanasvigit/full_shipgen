import type {
  CategorySlotStats,
  FacilityOccupancySummary,
  FloorOccupancyStatus,
  ParkingFloor,
  ParkingFloorCategoryKey,
  VehicleCategory,
} from '../types';

export function createCategoryStats(capacity: number, occupied: number): CategorySlotStats {
  const safeCapacity = Math.max(capacity, 0);
  const safeOccupied = Math.min(Math.max(occupied, 0), safeCapacity);
  return {
    capacity: safeCapacity,
    occupied: safeOccupied,
    available: safeCapacity - safeOccupied,
  };
}

export function getCategoryKey(category: VehicleCategory): ParkingFloorCategoryKey {
  if (category === '2 Wheeler') {
    return 'twoWheeler';
  }

  if (category === '4 Wheeler') {
    return 'fourWheeler';
  }

  return 'heavyVehicle';
}

export function getCategoryLabel(key: ParkingFloorCategoryKey): string {
  if (key === 'twoWheeler') return '2 Wheeler';
  if (key === 'fourWheeler') return '4 Wheeler';
  return 'Heavy Vehicles';
}

export function getFloorCategoryStats(floor: ParkingFloor, key: ParkingFloorCategoryKey): CategorySlotStats {
  return floor[key];
}

export function getFloorTotals(floor: ParkingFloor) {
  const categories: ParkingFloorCategoryKey[] = ['twoWheeler', 'fourWheeler', 'heavyVehicle'];
  return categories.reduce(
    (totals, key) => {
      const stats = floor[key];
      totals.capacity += stats.capacity;
      totals.occupied += stats.occupied;
      totals.available += stats.available;
      return totals;
    },
    { capacity: 0, occupied: 0, available: 0 },
  );
}

export function getFloorOccupancyPercent(floor: ParkingFloor): number {
  const totals = getFloorTotals(floor);
  if (totals.capacity === 0) return 0;
  return Math.round((totals.occupied / totals.capacity) * 100);
}

export function deriveFloorStatus(floor: ParkingFloor): FloorOccupancyStatus {
  const totals = getFloorTotals(floor);
  if (totals.capacity === 0 || totals.occupied === 0) return 'available';
  if (totals.available === 0) return 'full';
  return 'partial';
}

export function withDerivedFloorStatus(floor: ParkingFloor): ParkingFloor {
  return {
    ...floor,
    status: deriveFloorStatus(floor),
    twoWheeler: createCategoryStats(floor.twoWheeler.capacity, floor.twoWheeler.occupied),
    fourWheeler: createCategoryStats(floor.fourWheeler.capacity, floor.fourWheeler.occupied),
    heavyVehicle: createCategoryStats(floor.heavyVehicle.capacity, floor.heavyVehicle.occupied),
  };
}

export function getFacilitySummary(floors: ParkingFloor[]): FacilityOccupancySummary {
  const categories: ParkingFloorCategoryKey[] = ['twoWheeler', 'fourWheeler', 'heavyVehicle'];
  const summary: FacilityOccupancySummary = {
    totalFloors: floors.length,
    totalCapacity: 0,
    totalOccupied: 0,
    totalAvailable: 0,
    occupancyPercent: 0,
    twoWheeler: createCategoryStats(0, 0),
    fourWheeler: createCategoryStats(0, 0),
    heavyVehicle: createCategoryStats(0, 0),
  };

  floors.forEach((floor) => {
    categories.forEach((key) => {
      const stats = floor[key];
      summary[key].capacity += stats.capacity;
      summary[key].occupied += stats.occupied;
      summary[key].available += stats.available;
      summary.totalCapacity += stats.capacity;
      summary.totalOccupied += stats.occupied;
      summary.totalAvailable += stats.available;
    });
  });

  summary.occupancyPercent =
    summary.totalCapacity === 0 ? 0 : Math.round((summary.totalOccupied / summary.totalCapacity) * 100);

  return summary;
}

export function findFloorForCategory(floors: ParkingFloor[], category: VehicleCategory): ParkingFloor | null {
  const categoryKey = getCategoryKey(category);
  return (
    floors.find((floor) => getFloorCategoryStats(floor, categoryKey).available > 0) ?? null
  );
}
