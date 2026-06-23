import { useMemo, useRef, useState } from 'react';
import type { ReportRangeParams } from '../api/reports';
import type { ReportPeriodId } from '../types/reports';
import {
  daysAgoIsoDate,
  periodRangeLabel,
  periodToApiParams,
  todayIsoDate,
  validateCustomRange,
} from '../utils/reportRange';

export function useReportPeriod(defaultPeriod: ReportPeriodId = '7d') {
  const [period, setPeriod] = useState<ReportPeriodId>(defaultPeriod);
  const [customStart, setCustomStart] = useState(() => daysAgoIsoDate(7));
  const [customEnd, setCustomEnd] = useState(() => todayIsoDate());
  const [appliedCustomStart, setAppliedCustomStart] = useState(customStart);
  const [appliedCustomEnd, setAppliedCustomEnd] = useState(customEnd);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const periodBeforeCustomRef = useRef<ReportPeriodId>(defaultPeriod);

  const apiParams: ReportRangeParams = useMemo(() => {
    if (period === 'custom') {
      return { startDate: appliedCustomStart, endDate: appliedCustomEnd };
    }
    return periodToApiParams(period, appliedCustomStart, appliedCustomEnd);
  }, [period, appliedCustomStart, appliedCustomEnd]);

  const applyCustomRange = () => {
    const message = validateCustomRange(customStart, customEnd);
    if (message) {
      setCustomError(message);
      return;
    }
    setCustomError(null);
    setAppliedCustomStart(customStart);
    setAppliedCustomEnd(customEnd);
    setPeriod('custom');
    setShowCustomPicker(false);
  };

  const selectPeriod = (next: ReportPeriodId) => {
    setCustomError(null);
    setPeriod(next);
    setShowCustomPicker(false);
    if (next !== 'custom') {
      periodBeforeCustomRef.current = next;
    }
  };

  const openCustomPicker = () => {
    if (!showCustomPicker) {
      if (period !== 'custom') {
        periodBeforeCustomRef.current = period;
      }
      setCustomStart(appliedCustomStart);
      setCustomEnd(appliedCustomEnd);
      setCustomError(null);
      setShowCustomPicker(true);
    }
  };

  const cancelCustomRange = () => {
    setCustomError(null);
    setCustomStart(appliedCustomStart);
    setCustomEnd(appliedCustomEnd);
    setShowCustomPicker(false);
    if (period === 'custom') {
      return;
    }
    setPeriod(periodBeforeCustomRef.current);
  };

  const toggleCustomPicker = () => {
    if (showCustomPicker) {
      cancelCustomRange();
    } else {
      openCustomPicker();
    }
  };

  const rangeLabel = (apiLabel?: string) =>
    periodRangeLabel(period, appliedCustomStart, appliedCustomEnd, apiLabel);

  return {
    period,
    selectPeriod,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    showCustomPicker,
    openCustomPicker,
    cancelCustomRange,
    toggleCustomPicker,
    applyCustomRange,
    customError,
    apiParams,
    rangeLabel,
  };
}
