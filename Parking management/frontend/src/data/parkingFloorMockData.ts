import type { ParkingFloor } from '../types';
import { createCategoryStats, withDerivedFloorStatus } from '../utils/parkingFloors';

const initialFloors: ParkingFloor[] = [
  {
    id: 'FL-01',
    floorNumber: 1,
    floorName: 'Floor 1',
    twoWheeler: createCategoryStats(80, 62),
    fourWheeler: createCategoryStats(60, 48),
    heavyVehicle: createCategoryStats(10, 4),
    status: 'partial',
  },
  {
    id: 'FL-02',
    floorNumber: 2,
    floorName: 'Floor 2',
    twoWheeler: createCategoryStats(70, 55),
    fourWheeler: createCategoryStats(55, 40),
    heavyVehicle: createCategoryStats(8, 6),
    status: 'partial',
  },
  {
    id: 'FL-03',
    floorNumber: 3,
    floorName: 'Floor 3',
    twoWheeler: createCategoryStats(65, 65),
    fourWheeler: createCategoryStats(50, 50),
    heavyVehicle: createCategoryStats(6, 6),
    status: 'full',
  },
  {
    id: 'FL-04',
    floorNumber: 4,
    floorName: 'Basement',
    twoWheeler: createCategoryStats(90, 24),
    fourWheeler: createCategoryStats(45, 12),
    heavyVehicle: createCategoryStats(12, 2),
    status: 'available',
  },
];

export const mockParkingFloors: ParkingFloor[] = initialFloors.map(withDerivedFloorStatus);
