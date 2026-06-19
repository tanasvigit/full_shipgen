import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  exportDailyOperationsReport,
  exportDailyOperationsReportCSV,
} from "../../utils/dailyReport";

export default function DailyReportExportDialog({ open, onOpenChange }) {
  const [exporting, setExporting] = useState(null);

  const runExport = async (format) => {
    setExporting(format);
    try {
      if (format === "pdf") {
        await exportDailyOperationsReport();
        toast.success("Daily Operations Report downloaded", {
          description: "Multi-page PDF · live KPIs · detention · docks · recommendations",
        });
      } else {
        await exportDailyOperationsReportCSV();
        toast.success("Daily Operations Report downloaded", {
          description: "CSV summary · KPI scorecard export",
        });
      }
      onOpenChange(false);
    } catch (e) {
      toast.error("Report export failed", { description: String(e.message || e) });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="daily-report-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Operations Report</DialogTitle>
          <DialogDescription>
            Choose a format to download. No file is generated until you confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <button
            type="button"
            data-testid="daily-report-pdf"
            disabled={!!exporting}
            onClick={() => runExport("pdf")}
            className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:opacity-60"
          >
            <FileText className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Download PDF</div>
              <div className="text-[11px] text-slate-500">Branded multi-page operations report</div>
            </div>
          </button>
          <button
            type="button"
            data-testid="daily-report-csv"
            disabled={!!exporting}
            onClick={() => runExport("csv")}
            className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:opacity-60"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Download CSV</div>
              <div className="text-[11px] text-slate-500">KPI scorecard summary for Excel / Sheets</div>
            </div>
          </button>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-testid="daily-report-cancel"
            disabled={!!exporting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
