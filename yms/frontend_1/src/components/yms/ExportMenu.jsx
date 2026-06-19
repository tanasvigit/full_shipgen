import React from "react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { exportCSV, exportPDF } from "../../utils/exporters";
import { toast } from "sonner";

/**
 * Reusable export button for tables.
 * Props:
 *  - filename: base filename (no extension)
 *  - title: PDF title
 *  - subtitle: PDF subtitle
 *  - columns: column headers (display labels)
 *  - keys: row keys mapping to columns
 *  - rows: data rows
 *  - meta: optional [{label,value}] summary for PDF
 *  - testId: data-testid prefix
 */
export const ExportMenu = ({ filename, title, subtitle, columns, keys, rows, meta = [], testId = "export" }) => {
  const handleCSV = () => {
    exportCSV(filename, columns, keys, rows);
    toast.success(`Exported ${rows.length} rows · CSV`, { description: `${filename}.csv downloaded` });
  };
  const handlePDF = async () => {
    try {
      await exportPDF({ title, subtitle, columns, keys, rows, filename, meta });
      toast.success(`Exported ${rows.length} rows · PDF`, { description: `${filename}.pdf downloaded` });
    } catch (e) {
      toast.error(e.message || "PDF export failed");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid={`${testId}-trigger`}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md hover:bg-slate-50 transition"
        >
          <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3 -ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-md">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Download as
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid={`${testId}-csv`} onClick={handleCSV} className="cursor-pointer text-[12.5px]">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
          <div className="flex flex-col">
            <span className="font-semibold">CSV</span>
            <span className="text-[10px] text-slate-500">Excel / Sheets ready</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem data-testid={`${testId}-pdf`} onClick={handlePDF} className="cursor-pointer text-[12.5px]">
          <FileText className="w-4 h-4 mr-2 text-red-600" />
          <div className="flex flex-col">
            <span className="font-semibold">PDF</span>
            <span className="text-[10px] text-slate-500">Branded report</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMenu;
