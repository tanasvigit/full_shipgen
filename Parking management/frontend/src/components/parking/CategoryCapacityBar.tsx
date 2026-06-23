import type { CategorySlotStats } from '../../types';

interface CategoryCapacityBarProps {
  label: string;
  stats: CategorySlotStats;
}

export default function CategoryCapacityBar({ label, stats }: CategoryCapacityBarProps) {
  const percent = stats.capacity === 0 ? 0 : Math.round((stats.occupied / stats.capacity) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-800 font-semibold">
          {stats.occupied}/{stats.capacity}
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${percent >= 100 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">{stats.available} available</p>
    </div>
  );
}
