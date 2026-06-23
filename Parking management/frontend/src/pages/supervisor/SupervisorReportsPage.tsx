import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import ReportsDashboardContent from '../../components/reports/ReportsDashboardContent';
import ReportsFilterToolbar from '../../components/reports/ReportsFilterToolbar';
import ReportsStatusBanner from '../../components/reports/ReportsStatusBanner';
import { useReportPeriod } from '../../hooks/useReportPeriod';
import { useReportsDashboard } from '../../hooks/useReportsDashboard';
import { useVehicleTypeFilter } from '../../hooks/useVehicleTypeFilter';
import { vehicleTypeLabel } from '../../utils/vehicleType';

export default function SupervisorReportsPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const periodState = useReportPeriod('today');
  const { vehicleType, setVehicleType } = useVehicleTypeFilter('all');
  const queryParams = useMemo(
    () => ({ ...periodState.apiParams, vehicleType }),
    [periodState.apiParams, vehicleType],
  );
  const { data, loading, refreshing, error, sectionErrors, emptyHint } = useReportsDashboard(queryParams);
  const filterHint = `${periodState.rangeLabel(data?.rangeLabel)} · ${vehicleTypeLabel(vehicleType)}`;

  return (
    <>
      <Header
        title="Reports"
        subtitle="Operational reporting (view only)"
        onToggleSidebar={onToggleSidebar}
      />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supervisor access is read-only. Export and configuration actions are restricted.
        </div>

        <ReportsFilterToolbar
          period={periodState.period}
          onPeriodChange={periodState.selectPeriod}
          customStart={periodState.customStart}
          customEnd={periodState.customEnd}
          onCustomStartChange={periodState.setCustomStart}
          onCustomEndChange={periodState.setCustomEnd}
          showCustomPicker={periodState.showCustomPicker}
          onToggleCustomPicker={periodState.toggleCustomPicker}
          onApplyCustomRange={periodState.applyCustomRange}
          onCancelCustomRange={periodState.cancelCustomRange}
          customError={periodState.customError}
          vehicleType={vehicleType}
          onVehicleTypeChange={setVehicleType}
          showExport={false}
        />

        <ReportsStatusBanner refreshing={refreshing} sectionErrors={sectionErrors} emptyHint={emptyHint} />

        {loading && !data && <p className="text-sm text-slate-500">Loading report data…</p>}
        {error && !data && !loading && <p className="text-sm text-red-600">{error}</p>}

        {data && (
          <div className={refreshing ? 'opacity-95 transition-opacity' : undefined}>
            <ReportsDashboardContent data={data} periodHint={filterHint} revenueChartTitle="Revenue Trend" />
          </div>
        )}
      </main>
    </>
  );
}
