import React, { useCallback, useEffect, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import ReportDateFilters from "../components/yms/ReportDateFilters";
import ReportExportMenu from "../components/yms/ReportExportMenu";
import reportsApi from "../services/reportsApi";
import { RefreshCw } from "lucide-react";

const BreakdownTable = ({ title, rows }) => (
  <div>
    <div className="text-[11px] font-bold text-slate-700 mb-2">{title}</div>
    <table className="w-full text-[11px]">
      <thead className="text-[9px] uppercase text-slate-500">
        <tr>
          <th className="text-left py-1">Label</th>
          <th className="text-right py-1">Evaluated</th>
          <th className="text-right py-1">Compliant</th>
          <th className="text-right py-1">SLA %</th>
        </tr>
      </thead>
      <tbody>
        {(rows || []).map((r) => (
          <tr key={r.key} className="border-t border-slate-100">
            <td className="py-1.5">{r.label}</td>
            <td className="text-right font-mono-yms">{r.evaluated}</td>
            <td className="text-right font-mono-yms">{r.compliant}</td>
            <td className="text-right font-mono-yms font-bold">{r.slaPct}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SlaComplianceReport = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await reportsApi.fetchSlaComplianceReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }));
    } catch (e) {
      setError(e.message || "Failed to load SLA report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const kpiRows = report
    ? [
        { metric: "Waiting SLA %", value: report.waitingSlaPct },
        { metric: "Loading SLA %", value: report.loadingSlaPct },
        { metric: "Turnaround SLA %", value: report.turnaroundSlaPct },
        { metric: "Overall SLA %", value: report.overallSlaPct },
      ]
    : [];

  return (
    <>
      <TopBar
        title="SLA Compliance"
        subtitle="Waiting 60m · Loading 120m · Turnaround 240m"
        actions={
          <div className="flex gap-2">
            <ReportExportMenu
              filename="sla-compliance"
              columns={["Metric", "Value"]}
              keys={["metric", "value"]}
              rows={kpiRows}
              exportPath="/reports/sla-compliance/export"
              exportParams={{ date_from: dateFrom || undefined, date_to: dateTo || undefined }}
            />
            <button type="button" onClick={load} className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        }
      />
      <div className="p-6 space-y-5">
        <SectionCard title="Filters" padding="p-4">
          <ReportDateFilters dateFrom={dateFrom} dateTo={dateTo} onChange={({ dateFrom: f, dateTo: t }) => { setDateFrom(f); setDateTo(t); }} />
        </SectionCard>
        {error && <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {report && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Waiting SLA", report.waitingSlaPct],
                ["Loading SLA", report.loadingSlaPct],
                ["Turnaround SLA", report.turnaroundSlaPct],
                ["Overall SLA", report.overallSlaPct],
              ].map(([label, val]) => (
                <div key={label} className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[10px] uppercase text-slate-500 font-semibold">{label}</div>
                  <div className="font-display font-bold text-3xl font-mono-yms mt-2">{val}%</div>
                </div>
              ))}
            </div>
            <SectionCard title="Breakdowns" padding="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BreakdownTable title="By Dock" rows={report.byDock} />
                <BreakdownTable title="By Labor Team" rows={report.byLaborTeam} />
                <BreakdownTable title="By Equipment" rows={report.byEquipment} />
                <BreakdownTable title="By Material Type" rows={report.byMaterialType} />
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </>
  );
};

export default SlaComplianceReport;
