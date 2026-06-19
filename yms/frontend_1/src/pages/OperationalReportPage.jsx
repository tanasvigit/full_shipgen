import React, { useCallback, useEffect, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import ReportDateFilters from "../components/yms/ReportDateFilters";
import ReportExportMenu from "../components/yms/ReportExportMenu";
import reportsApi from "../services/reportsApi";
import { RefreshCw } from "lucide-react";

/**
 * Generic tabular operational report page.
 */
const OperationalReportPage = ({
  title,
  subtitle,
  fetchFn,
  exportPath,
  columns,
  keys,
  extraFilters,
  renderExtra,
}) => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterState, setFilterState] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFn({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        ...filterState,
      });
      setRows(data.rows || []);
    } catch (e) {
      setError(e.message || "Failed to load report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, dateFrom, dateTo, filterState]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onChange = () => load();
    window.addEventListener("yms-data-changed", onChange);
    return () => window.removeEventListener("yms-data-changed", onChange);
  }, [load]);

  const exportParams = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    ...Object.fromEntries(
      Object.entries(filterState).map(([k, v]) => [k.replace(/([A-Z])/g, "_$1").toLowerCase(), v])
    ),
  };

  return (
    <>
      <TopBar
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <ReportExportMenu
              filename={title.toLowerCase().replace(/\s+/g, "-")}
              columns={columns}
              keys={keys}
              rows={rows}
              exportPath={exportPath}
              exportParams={exportParams}
            />
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        }
      />
      <div className="p-6 space-y-5">
        <SectionCard title="Filters" padding="p-4">
          <ReportDateFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={({ dateFrom: f, dateTo: t }) => {
              setDateFrom(f);
              setDateTo(t);
            }}
          >
            {extraFilters?.(filterState, setFilterState)}
          </ReportDateFilters>
        </SectionCard>

        {error && (
          <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        <SectionCard title="Results" padding="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.dockId || row.laborId || row.equipmentId || row.categoryKey || i} className="border-b border-slate-100">
                      {keys.map((k) => (
                        <td key={k} className="px-3 py-2.5 font-mono-yms text-slate-800 whitespace-nowrap">
                          {row[k] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">No data for selected filters</div>
              )}
            </div>
          )}
          {renderExtra?.(rows)}
        </SectionCard>
      </div>
    </>
  );
};

export default OperationalReportPage;
