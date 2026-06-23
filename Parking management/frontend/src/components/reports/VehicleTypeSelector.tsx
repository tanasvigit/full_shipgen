import type { VehicleTypeFilter } from '../../types/reports';
import { VEHICLE_TYPE_OPTIONS } from '../../utils/vehicleType';

type VehicleTypeSelectProps = {
  value: VehicleTypeFilter;
  onChange: (value: VehicleTypeFilter) => void;
};

export default function VehicleTypeSelect({ value, onChange }: VehicleTypeSelectProps) {
  return (
    <label className="inline-flex flex-col gap-1 min-w-[9.5rem]">
      <span className="text-xs font-medium text-slate-500">Vehicle type</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as VehicleTypeFilter)}
        className="w-full min-w-[9.5rem] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium shadow-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ea1c26]/30 focus:border-[#ea1c26] cursor-pointer"
        aria-label="Vehicle type"
        data-testid="vehicle-type-select"
      >
        {VEHICLE_TYPE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
