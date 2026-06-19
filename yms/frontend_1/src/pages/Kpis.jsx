import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import ExportMenu from "../components/yms/ExportMenu";
import executiveKpisApi, {
  filterScorecardRows,
  formatINR,
  toExportRows,
} from "../services/executiveKpisApi";
import { useUI } from "../contexts/UIContext";
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import ChartBox from "../components/common/ChartBox";

const REFRESH_MS = 30000;

const trendColorClass = (status) => {
  if (status === "danger") return "text-red-600";
  if (status === "warning") return "text-amber-600";
  if (status === "success") return "text-emerald-600";
  return "text-blue-600";
};

const barColorClass = (status) => {
  if (status === "danger") return "bg-red-500";
  if (status === "warning") return "bg-amber-500";
  if (status === "success") return "bg-emerald-500";
  return "bg-blue-500";
};

const Kpis = () => {
  const { search } = useUI();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await executiveKpisApi.fetchExecutiveKpisBundle();
      setBundle(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("[Executive KPIs] load failed", e);
      setError(e.message || "Failed to load executive KPIs");
      if (!silent) setBundle(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onChange = () => load(true);
    window.addEventListener("yms-data-changed", onChange);
    return () => window.removeEventListener("yms-data-changed", onChange);
  }, [load]);

  const scorecard = bundle?.scorecard ?? [];
  const visibleRows = useMemo(() => filterScorecardRows(scorecard, search), [scorecard, search]);
  const exportRows = useMemo(() => toExportRows(visibleRows), [visibleRows]);
  const headline = bundle?.headline;
  const turnaroundTrend = bundle?.turnaroundTrend ?? [];
  const yardOccupancyTrend = bundle?.yardOccupancyTrend ?? [];
  const fetchErrors = bundle?.fetchErrors ?? [];

  if (loading && !bundle) {
    return (
      <>
        <TopBar title="Executive KPIs" subtitle="Loading scorecard…" />
        <div className="p-4 md:p-6 space-y-5">
          <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-sm text-slate-500">
            Loading live operational metrics…
          </div>
        </div>
      </>
    );
  }

  if (error && !bundle) {
    return (
      <>
        <TopBar title="Executive KPIs" subtitle="Operations · Financial · AI · Quality" />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load executive KPIs</p>
              <p className="text-sm mt-1 break-words">{error}</p>
              <button
                type="button"
                onClick={() => load()}
                className="mt-3 px-3 py-1.5 bg-red-800 text-white text-xs font-semibold rounded-md"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Executive KPIs"
        subtitle={
          lastRefresh
            ? `Operations · Financial · AI · Quality · refreshed ${lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
            : "Operations · Financial · AI · Quality"
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="kpi-refresh"
              onClick={() => load(true)}
              className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <ExportMenu
              testId="kpi-export"
              filename="YARDOS_Executive_KPI_Scorecard"
              title="Executive KPI Scorecard"
              subtitle={`Bhiwandi Mega Hub · ${visibleRows.length} metrics · ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`}
              columns={["Metric", "Current", "Target", "Δ vs Yesterday", "State"]}
              keys={["metric", "current", "target", "delta", "state"]}
              rows={exportRows}
              meta={[
                { label: "Avg Waiting", value: `${headline?.avgWaitingMin ?? 0} min` },
                { label: "Avg TAT", value: `${headline?.avgTurnaroundMin ?? 0} min` },
                { label: "Dock Util.", value: `${headline?.dockUtilizationPct ?? 0}%` },
                { label: "Yard Occ.", value: `${headline?.yardOccupancyPct ?? 0}%` },
                { label: "Detention", value: formatINR(headline?.detentionToday ?? 0) },
              ]}
            />
          </div>
        }
      />
      <div className="p-4 md:p-6 space-y-5">
        {error && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Stale data — last refresh failed: {error}
          </div>
        )}
        {fetchErrors.length > 0 && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Partial data — unavailable: {fetchErrors.map((e) => e.source).join(", ")}
          </div>
        )}

        <SectionCard testId="card-kpi-grid" title="KPI Scorecard" subtitle="Daily targets vs actuals" padding="p-0">
          <div className="overflow-x-auto">
            {visibleRows.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No KPI rows match your search.
              </div>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left font-semibold px-4 py-2.5">Metric</th>
                    <th className="text-right font-semibold px-2 py-2.5">Current</th>
                    <th className="text-right font-semibold px-2 py-2.5">Target</th>
                    <th className="text-right font-semibold px-2 py-2.5">Δ vs Yesterday</th>
                    <th className="text-left font-semibold px-2 py-2.5 w-48">Performance</th>
                    <th className="text-left font-semibold px-4 py-2.5">State</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((k, i) => {
                    const Trend = k.trend > 0 ? TrendingUp : TrendingDown;
                    const tColor = trendColorClass(k.status);
                    const bar = barColorClass(k.status);
                    return (
                      <tr key={k.key} data-testid={`kpi-row-${i}`} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{k.metric}</td>
                        <td className="px-2 py-3 text-right font-mono-yms font-bold text-base text-slate-900">{k.value}</td>
                        <td className="px-2 py-3 text-right font-mono-yms text-slate-500">{k.target}</td>
                        <td className={`px-2 py-3 text-right font-mono-yms font-bold ${tColor}`}>
                          <span className="inline-flex items-center gap-0.5">
                            <Trend className="w-3 h-3" /> {k.trend > 0 ? "+" : ""}
                            {k.trend}%
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                            <div className={`h-full ${bar}`} style={{ width: `${k.performancePct}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${tColor}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {k.stateLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SectionCard testId="card-tat-trend" title="Turnaround Time — 7 days" subtitle="By vehicle category (min)">
            {turnaroundTrend.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-sm text-slate-500">No turnaround data</div>
              ) : (
                <ChartBox height={288}>
                  <LineChart data={turnaroundTrend}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="company" stroke="#0F172A" strokeWidth={2.5} dot={{ r: 3 }} name="Company" />
                    <Line type="monotone" dataKey="contract" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} name="Contract" />
                    <Line type="monotone" dataKey="outside" stroke="#D97706" strokeWidth={2.5} dot={{ r: 3 }} name="Outside" />
                  </LineChart>
                </ChartBox>
              )}
          </SectionCard>

          <SectionCard testId="card-occ-trend" title="Yard Occupancy — 7 days" subtitle="Actual vs Target (%)">
            {yardOccupancyTrend.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-sm text-slate-500">No occupancy data</div>
              ) : (
                <ChartBox height={288}>
                  <BarChart data={yardOccupancyTrend}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip />
                    <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="occ" fill="#0F172A" name="Occupancy" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#CBD5E1" name="Target" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartBox>
              )}
          </SectionCard>
        </div>
      </div>
    </>
  );
};

export default Kpis;
