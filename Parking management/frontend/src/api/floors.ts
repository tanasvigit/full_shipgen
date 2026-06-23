import type { FacilityOccupancySummary, ParkingFloor } from '../types';
import { apiRequest } from './client';

export function listFloors(): Promise<ParkingFloor[]> {
  return apiRequest<ParkingFloor[]>('/floors');
}

export function getFacilitySummary(): Promise<FacilityOccupancySummary> {
  return apiRequest<FacilityOccupancySummary>('/floors/summary');
}

export function createFloor(payload: {
  floorNumber?: number;
  floorName: string;
  twoWheeler: { capacity: number; occupied?: number };
  fourWheeler: { capacity: number; occupied?: number };
  heavyVehicle: { capacity: number; occupied?: number };
}): Promise<ParkingFloor> {
  return apiRequest<ParkingFloor>('/floors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFloor(
  floorId: string,
  payload: {
    floorNumber?: number;
    floorName?: string;
    twoWheeler?: { capacity: number; occupied?: number };
    fourWheeler?: { capacity: number; occupied?: number };
    heavyVehicle?: { capacity: number; occupied?: number };
  },
): Promise<ParkingFloor> {
  return apiRequest<ParkingFloor>(`/floors/${encodeURIComponent(floorId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteFloor(floorId: string): Promise<void> {
  return apiRequest<void>(`/floors/${encodeURIComponent(floorId)}`, { method: 'DELETE' });
}
