export type ReportPeriodId = 'today' | '7d' | '30d' | 'custom';

export type VehicleTypeFilter = 'all' | 'two_wheeler' | 'four_wheeler' | 'other';

export type CategorySlice = {
  name: string;
  value: number;
  color: string;
};

export type ReportsDashboardData = {
  rangeLabel: string;
  vehicleTypeLabel: string;
  revenuePoints: Array<{ day: string; revenue: number }>;
  totalRevenue: number;
  totalEntries: number;
  totalExits: number;
  /** Active tickets now (not a historical range snapshot). */
  vehiclesInside: number;
  /** Current facility occupancy % (live), not period-specific. */
  occupancyPercent: number;
  categoryData: CategorySlice[];
  rangeDayCount: number;
};
