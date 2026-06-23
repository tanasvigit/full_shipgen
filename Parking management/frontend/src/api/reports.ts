import { apiRequest } from './client';
import { toNumber } from './mappers';
import type { VehicleTypeFilter } from '../types/reports';
import {
  overallReportsErrorMessage,
  reportErrorMessage,
  type ReportsSectionErrors,
  type ReportsSectionKey,
} from '../utils/reportErrors';

export type ReportPreset = 'today' | '7d' | '30d';

export type ReportRangeParams =
  | { preset: ReportPreset }
  | { startDate: string; endDate: string };

export type ReportQueryParams = ReportRangeParams & {
  vehicleType?: VehicleTypeFilter;
};

export type RevenueReport = {
  range: string;
  points: Array<{ day: string; revenue: number }>;
  total: number;
};

export type TrafficReport = {
  range: string;
  todayEntries: number;
  todayExits: number;
  vehiclesInside: number;
};

export type OccupancyReport = {
  range: string;
  occupiedSlots: number;
  totalSlots: number;
  occupancyPercent: number;
  twoWheelerCount: number;
  fourWheelerCount: number;
  otherCount?: number;
};

export type ReportsBundleResult = {
  revenue: RevenueReport | null;
  traffic: TrafficReport | null;
  occupancy: OccupancyReport | null;
  errors: ReportsSectionErrors;
};

const SECTION_KEYS: ReportsSectionKey[] = ['revenue', 'traffic', 'occupancy'];

function buildReportQuery(params: ReportQueryParams): string {
  const search = new URLSearchParams();
  if ('preset' in params) {
    search.set('range', params.preset);
  } else {
    search.set('start_date', params.startDate);
    search.set('end_date', params.endDate);
  }
  if (params.vehicleType && params.vehicleType !== 'all') {
    search.set('vehicle_type', params.vehicleType);
  }
  return search.toString();
}

export function getRevenueReport(params: ReportQueryParams) {
  return apiRequest<{
    range: string;
    points: Array<{ day: string; revenue: number | string }>;
    total: number | string;
  }>(`/reports/revenue?${buildReportQuery(params)}`).then((report) => ({
    ...report,
    total: toNumber(report.total),
    points: report.points.map((point) => ({
      ...point,
      revenue: toNumber(point.revenue),
    })),
  }));
}

export function getTrafficReport(params: ReportQueryParams) {
  return apiRequest<{
    range: string;
    todayEntries: number;
    todayExits: number;
    vehiclesInside: number;
  }>(`/reports/traffic?${buildReportQuery(params)}`);
}

export function getOccupancyReport(params: ReportQueryParams) {
  return apiRequest<{
    range: string;
    occupiedSlots: number;
    totalSlots: number;
    occupancyPercent: number;
    twoWheelerCount: number;
    fourWheelerCount: number;
    otherCount?: number;
  }>(`/reports/occupancy?${buildReportQuery(params)}`);
}

export async function fetchReportsBundle(params: ReportQueryParams): Promise<ReportsBundleResult> {
  const fetchers: Array<{ key: ReportsSectionKey; run: () => Promise<unknown> }> = [
    { key: 'revenue', run: () => getRevenueReport(params) },
    { key: 'traffic', run: () => getTrafficReport(params) },
    { key: 'occupancy', run: () => getOccupancyReport(params) },
  ];

  const settled = await Promise.allSettled(fetchers.map((item) => item.run()));
  const errors: ReportsSectionErrors = {};
  const result: ReportsBundleResult = {
    revenue: null,
    traffic: null,
    occupancy: null,
    errors,
  };

  settled.forEach((outcome, index) => {
    const key = SECTION_KEYS[index];
    if (outcome.status === 'fulfilled') {
      if (key === 'revenue') {
        result.revenue = outcome.value as RevenueReport;
      } else if (key === 'traffic') {
        result.traffic = outcome.value as TrafficReport;
      } else {
        result.occupancy = outcome.value as OccupancyReport;
      }
      return;
    }
    errors[key] = reportErrorMessage(outcome.reason, key);
  });

  result.errors = errors;
  return result;
}

export function bundleHasAnyData(bundle: ReportsBundleResult): boolean {
  return Boolean(bundle.revenue || bundle.traffic || bundle.occupancy);
}

export { overallReportsErrorMessage };
