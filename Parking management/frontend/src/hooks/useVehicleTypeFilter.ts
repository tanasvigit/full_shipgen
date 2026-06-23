import { useState } from 'react';
import type { VehicleTypeFilter } from '../types/reports';

export function useVehicleTypeFilter(defaultType: VehicleTypeFilter = 'all') {
  const [vehicleType, setVehicleType] = useState<VehicleTypeFilter>(defaultType);
  return { vehicleType, setVehicleType };
}
