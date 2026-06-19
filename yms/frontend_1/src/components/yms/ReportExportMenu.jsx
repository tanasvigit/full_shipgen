import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Download, FileSpreadsheet, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { exportCSV } from "../../utils/exporters";
import reportsApi from "../../services/reportsApi";

/**
 * Report export — client CSV from rows OR server CSV/Excel via exportPath.
 */
const ReportExportMenu = ({
  filename,
  columns,
  keys,
  rows = [],
  exportPath,
  exportParams = {},
  testId = "report-export",
}) => {
  const handleClientCsv = () => {
    exportCSV(filename, columns, keys, rows);
    toast.success(`Exported ${rows.length} rows · CSV`);
  };

  const handleServerExport = async (fmt) => {
    try {
      await reportsApi.downloadReportExport(exportPath, { fmt, ...exportParams });
      toast.success(`Export downloaded · ${fmt.toUpperCase()}`);
    } catch (e) {
      toast.error(e.message || "Export failed");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid={`${testId}-trigger`}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3 -ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-md">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Download as
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid={`${testId}-csv`}
          onClick={() => (exportPath ? handleServerExport("csv") : handleClientCsv())}
          className="cursor-pointer text-[12.5px]"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
          CSV
        </DropdownMenuItem>
        {exportPath && (
          <DropdownMenuItem
            data-testid={`${testId}-xlsx`}
            onClick={() => handleServerExport("xlsx")}
            className="cursor-pointer text-[12.5px]"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" />
            Excel (.xlsx)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReportExportMenu;
