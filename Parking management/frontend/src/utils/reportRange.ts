import type { ReportRangeParams, ReportPreset } from '../api/reports';
import type { ReportPeriodId } from '../types/reports';

export const PERIOD_PRESETS: Array<{ id: Exclude<ReportPeriodId, 'custom'>; label: string; preset: ReportPreset }> = [
  { id: 'today', label: 'Today', preset: 'today' },
  { id: '7d', label: 'This Week', preset: '7d' },
  { id: '30d', label: 'This Month', preset: '30d' },
];

export function periodToApiParams(
  period: ReportPeriodId,
  customStart: string,
  customEnd: string,
): ReportRangeParams {
  if (period === 'custom') {
    return { startDate: customStart, endDate: customEnd };
  }
  const match = PERIOD_PRESETS.find((item) => item.id === period);
  return { preset: match?.preset ?? '7d' };
}

export function periodRangeLabel(
  period: ReportPeriodId,
  customStart: string,
  customEnd: string,
  apiRangeLabel?: string,
): string {
  if (period === 'custom' && customStart && customEnd) {
    return `${customStart} to ${customEnd}`;
  }
  if (apiRangeLabel) {
    return apiRangeLabel;
  }
  const match = PERIOD_PRESETS.find((item) => item.id === period);
  return match?.label ?? 'Reports';
}

export function validateCustomRange(start: string, end: string): string | null {
  if (!start || !end) {
    return 'Select both start and end dates.';
  }
  if (start > end) {
    return 'Start date must be on or before end date.';
  }
  return null;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoIsoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Inclusive calendar days for avg revenue/day (matches preset windows on the backend). */
export function calendarDaysInRange(params: ReportRangeParams): number {
  if ('preset' in params) {
    if (params.preset === 'today') {
      return 1;
    }
    if (params.preset === '30d') {
      return 30;
    }
    return 7;
  }
  const start = new Date(`${params.startDate}T00:00:00`);
  const end = new Date(`${params.endDate}T00:00:00`);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / 86_400_000) + 1;
  return Math.max(1, days);
}
