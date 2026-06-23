import type { VehicleTypeFilter } from '../types/reports';

export const VEHICLE_TYPE_OPTIONS: Array<{ id: VehicleTypeFilter; label: string }> = [
  { id: 'all', label: 'All Vehicles' },
  { id: 'two_wheeler', label: '2 Wheeler' },
  { id: 'four_wheeler', label: '4 Wheeler' },
  { id: 'other', label: 'Other' },
];

export function vehicleTypeLabel(filter: VehicleTypeFilter): string {
  return VEHICLE_TYPE_OPTIONS.find((option) => option.id === filter)?.label ?? filter;
}

export function vehicleTypeForApi(filter: VehicleTypeFilter): VehicleTypeFilter | undefined {
  return filter === 'all' ? undefined : filter;
}
