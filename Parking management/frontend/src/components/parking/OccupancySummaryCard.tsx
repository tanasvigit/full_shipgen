import type { FacilityOccupancySummary } from '../../types';
import CategoryCapacityBar from './CategoryCapacityBar';

interface OccupancySummaryCardProps {
  summary: FacilityOccupancySummary;
}

export default function OccupancySummaryCard({ summary }: OccupancySummaryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Facility Occupancy</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{summary.occupancyPercent}%</p>
          <p className="text-sm text-slate-500 mt-1">
            {summary.totalOccupied} occupied · {summary.totalAvailable} available across {summary.totalFloors} floors
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 min-w-[280px]">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Floors</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{summary.totalFloors}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Capacity</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{summary.totalCapacity}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Available</p>
            <p className="text-xl font-bold text-green-600 mt-1">{summary.totalAvailable}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <CategoryCapacityBar label="2 Wheeler" stats={summary.twoWheeler} />
        <CategoryCapacityBar label="4 Wheeler" stats={summary.fourWheeler} />
        <CategoryCapacityBar label="Heavy Vehicles" stats={summary.heavyVehicle} />
      </div>
    </div>
  );
}
