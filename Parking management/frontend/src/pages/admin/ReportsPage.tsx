import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import ExportReportConfirmModal from '../../components/reports/ExportReportConfirmModal';
import ReportsDashboardContent from '../../components/reports/ReportsDashboardContent';
import ReportsFilterToolbar from '../../components/reports/ReportsFilterToolbar';
import ReportsStatusBanner from '../../components/reports/ReportsStatusBanner';
import { useReportPeriod } from '../../hooks/useReportPeriod';
import { useReportsDashboard } from '../../hooks/useReportsDashboard';
import { useVehicleTypeFilter } from '../../hooks/useVehicleTypeFilter';
import { exportReportPdf } from '../../utils/exportReportPdf';
import { exportErrorMessage } from '../../utils/reportErrors';
import { vehicleTypeLabel } from '../../utils/vehicleType';

export default function ReportsPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const periodState = useReportPeriod('7d');
  const { vehicleType, setVehicleType } = useVehicleTypeFilter('all');
  const queryParams = useMemo(
    () => ({ ...periodState.apiParams, vehicleType }),
    [periodState.apiParams, vehicleType],
  );
  const { data, loading, refreshing, error, sectionErrors, emptyHint } = useReportsDashboard(queryParams);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const periodHint = periodState.rangeLabel(data?.rangeLabel);
  const filterHint = `${periodHint} · ${vehicleTypeLabel(vehicleType)}`;

  const handleExportConfirm = async () => {
    if (!data) {
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      await exportReportPdf({
        title: 'Parking Reports',
        rangeLabel: filterHint,
        generatedAt: new Date(),
        data,
      });
      setExportModalOpen(false);
    } catch (err) {
      setExportError(exportErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const openExportModal = () => {
    setExportError(null);
    if (data) {
      setExportModalOpen(true);
    }
  };

  return (
    <>
      <Header title="Reports" subtitle="Parking analytics and revenue reports" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
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
          exporting={exporting}
          onExportPdf={openExportModal}
        />

        <ReportsStatusBanner refreshing={refreshing} sectionErrors={sectionErrors} emptyHint={emptyHint} />

        {loading && !data && <p className="text-sm text-slate-500">Loading report data…</p>}
        {error && !data && !loading && <p className="text-sm text-red-600">{error}</p>}

        {data && (
          <div className={refreshing ? 'opacity-95 transition-opacity' : undefined}>
            <ReportsDashboardContent data={data} periodHint={filterHint} />
          </div>
        )}
      </main>

      <ExportReportConfirmModal
        open={exportModalOpen}
        filterSummary={filterHint}
        exporting={exporting}
        error={exportError}
        onConfirm={() => void handleExportConfirm()}
        onCancel={() => !exporting && setExportModalOpen(false)}
      />
    </>
  );
}
