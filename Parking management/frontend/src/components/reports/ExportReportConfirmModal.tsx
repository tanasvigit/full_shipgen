import { Download, FileText, X } from 'lucide-react';

type ExportReportConfirmModalProps = {
  open: boolean;
  filterSummary: string;
  exporting?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ExportReportConfirmModal({
  open,
  filterSummary,
  exporting = false,
  error = null,
  onConfirm,
  onCancel,
}: ExportReportConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
      data-testid="export-report-modal-overlay"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-report-title"
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        data-testid="export-report-modal"
      >
        <div className="flex items-start justify-between gap-3 p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ea1c26]/10 text-[#ea1c26]">
              <FileText size={20} />
            </div>
            <div>
              <h3 id="export-report-title" className="text-lg font-semibold text-slate-800">
                Download report?
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">Export the current view as a PDF file.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={exporting}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-slate-600">
            Your PDF will include summary stats, revenue by day, and category breakdown for:
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            {filterSummary}
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-600 rounded-xl bg-red-50 border border-red-100 px-3 py-2" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ea1c26] hover:bg-[#c91820] transition-colors disabled:opacity-50"
            data-testid="export-report-confirm"
          >
            <Download size={16} />
            {exporting ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
