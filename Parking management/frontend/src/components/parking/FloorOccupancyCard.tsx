import type { ParkingFloor } from '../../types';
import { getFloorOccupancyPercent } from '../../utils/parkingFloors';
import { StatusBadge } from '../ui';
import CategoryCapacityBar from './CategoryCapacityBar';

interface FloorOccupancyCardProps {
  floor: ParkingFloor;
}

function statusVariant(status: ParkingFloor['status']) {
  if (status === 'full') return 'danger';
  if (status === 'partial') return 'warning';
  return 'success';
}

export default function FloorOccupancyCard({ floor }: FloorOccupancyCardProps) {
  const occupancyPercent = getFloorOccupancyPercent(floor);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Floor {floor.floorNumber}</p>
          <h3 className="text-lg font-semibold text-slate-800 mt-1">{floor.floorName}</h3>
        </div>
        <StatusBadge label={floor.status} variant={statusVariant(floor.status)} />
      </div>

      <p className="text-sm text-slate-500 mt-3">{occupancyPercent}% overall occupancy</p>

      <div className="space-y-4 mt-4">
        <CategoryCapacityBar label="2 Wheeler" stats={floor.twoWheeler} />
        <CategoryCapacityBar label="4 Wheeler" stats={floor.fourWheeler} />
        <CategoryCapacityBar label="Heavy Vehicles" stats={floor.heavyVehicle} />
      </div>
    </div>
  );
}
