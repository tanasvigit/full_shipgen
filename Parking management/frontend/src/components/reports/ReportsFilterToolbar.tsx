import { Calendar, Download, X } from 'lucide-react';
import type { ReportPeriodId, VehicleTypeFilter } from '../../types/reports';
import { PERIOD_PRESETS } from '../../utils/reportRange';
import VehicleTypeSelect from './VehicleTypeSelector';

type ReportsFilterToolbarProps = {
  period: ReportPeriodId;
  onPeriodChange: (period: ReportPeriodId) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  showCustomPicker: boolean;
  onToggleCustomPicker: () => void;
  onApplyCustomRange: () => void;
  onCancelCustomRange: () => void;
  customError: string | null;
  vehicleType: VehicleTypeFilter;
  onVehicleTypeChange: (value: VehicleTypeFilter) => void;
  showExport?: boolean;
  exporting?: boolean;
  onExportPdf?: () => void;
};

export default function ReportsFilterToolbar({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  showCustomPicker,
  onToggleCustomPicker,
  onApplyCustomRange,
  onCancelCustomRange,
  customError,
  vehicleType,
  onVehicleTypeChange,
  showExport = true,
  exporting = false,
  onExportPdf,
}: ReportsFilterToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
        {!showCustomPicker ? (
          <>
            {PERIOD_PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPeriodChange(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  period === item.id
                    ? 'bg-[#ea1c26] text-white shadow-lg shadow-[#ea1c26]/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </>
        ) : (
          <div className="flex flex-wrap items-end gap-2 p-2 rounded-xl border border-slate-200 bg-white">
            <label className="flex flex-col gap-0.5 text-xs text-slate-500">
              Start
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(event) => onCustomStartChange(event.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-800"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-xs text-slate-500">
              End
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(event) => onCustomEndChange(event.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-800"
              />
            </label>
            <button
              type="button"
              onClick={onApplyCustomRange}
              className="px-3 py-2 bg-[#ea1c26] text-white rounded-xl text-sm font-semibold hover:bg-[#c91820] transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onCancelCustomRange}
              aria-label="Cancel custom range"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
            {customError && (
              <p className="w-full text-sm text-red-600">{customError}</p>
            )}
          </div>
        )}

        <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1 shrink-0" aria-hidden />

        <VehicleTypeSelect value={vehicleType} onChange={onVehicleTypeChange} />
      </div>

      <div className="flex flex-wrap gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleCustomPicker}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors ${
            showCustomPicker || period === 'custom'
              ? 'bg-[#ea1c26]/10 text-[#ea1c26] border border-[#ea1c26]/30 font-semibold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar size={14} /> Custom Range
        </button>
        {showExport && onExportPdf && (
          <button
            type="button"
            disabled={exporting}
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#ea1c26]/10 text-[#ea1c26] rounded-xl text-sm font-semibold hover:bg-[#ea1c26]/15 transition-colors disabled:opacity-50"
          >
            <Download size={14} /> {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        )}
      </div>
    </div>
  );
}
