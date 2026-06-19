import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import ChartBox from "../components/common/ChartBox";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import KpiCard from "../components/yms/KpiCard";
import ExportMenu from "../components/yms/ExportMenu";
import EmptyState from "../components/yms/EmptyState";
import detentionApi, { filterRecords, formatINR, toExportRows } from "../services/detentionApi";
import { API_BASE } from "../services/ymsApi";
import { IndianRupee, AlertTriangle, FileText, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { useUI } from "../contexts/UIContext";
import { KPI_GRID_STANDARD } from "../lib/responsiveClasses";

const REFRESH_MS = 30000;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "disputed", label: "Disputed" },
  { id: "paid", label: "Paid" },
  { id: "today", label: "Today" },
  { id: "mtd", label: "MTD" },
];

const Detention = () => {
  const { search, openDetention } = useUI();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [config, setConfig] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    if (!silent) setErrorDetail(null);
    try {
      const bundle = await detentionApi.fetchDetentionBundle();
      setRecords(bundle.records);
      setSummary(bundle.summary);
      setConfig(bundle.config);
    } catch (e) {
      console.error("[Detention] load failed", e);
      setError(e.message || "Failed to load detention data");
      if (!silent) {
        setErrorDetail({
          status: e.status,
          url: e.url || `${API_BASE}/detention`,
          raw: e.cause?.payload || e.payload,
        });
        setRecords([]);
        setSummary(null);
        setConfig(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onChange = () => load(true);
    window.addEventListener("yms-data-changed", onChange);
    return () => window.removeEventListener("yms-data-changed", onChange);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const dateFilter = ["today", "mtd"].includes(statusFilter) ? statusFilter : "all";
  const statusOnly = dateFilter === "all" ? statusFilter : "all";

  const visible = useMemo(
    () => filterRecords(records, { search, statusFilter: statusOnly, dateFilter }),
    [records, search, statusOnly, dateFilter]
  );

  const total = visible.reduce((s, r) => s + r.cost, 0);
  const disputed = visible.filter((r) => r.status === "Disputed").length;
  const exportRows = toExportRows(visible);
  const breakdown = summary?.breakdown ?? [];

  const openDetail = (r) => {
    openDetention({
      detentionId: r.detentionId,
      record: r,
      config,
      onUpdated: load,
    });
  };

  if (loading && !summary) {
    return (
      <>
        <TopBar title="Detention Management" subtitle="Loading…" />
        <div className="p-6 flex justify-center gap-2 text-slate-500 py-24">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading detention records…
        </div>
      </>
    );
  }

  if (error && !summary) {
    return (
      <>
        <TopBar title="Detention Management" subtitle="Billing & disputes" />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Could not load detention</p>
              <p className="text-sm mt-1 break-words">{error}</p>
              {errorDetail?.url && (
                <p className="text-[11px] mt-2 font-mono-yms text-red-700 break-all">
                  GET {errorDetail.url}
                  {errorDetail.status ? ` → HTTP ${errorDetail.status}` : ""}
                </p>
              )}
              <button type="button" onClick={load} className="mt-3 px-3 py-1.5 bg-red-800 text-white text-xs font-semibold rounded-md">
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
        title="Detention Management"
        subtitle="Auto-calculated from yard wait times · live billing workflow"
        actions={
          <ExportMenu
            testId="det-export"
            filename="YARDOS_Detention_Records"
            title="Detention Records"
            subtitle={`Bhiwandi Mega Hub · ${visible.length} records · Total ${formatINR(total)}`}
            columns={["Ticket", "Plate", "Category", "Transporter", "Free", "Actual", "Rate", "Cost", "Status", "Date"]}
            keys={["ticket", "plate", "category", "transporter", "freeHours", "actualHours", "rate", "cost", "status", "date"]}
            rows={exportRows}
            meta={[
              { label: "Today", value: formatINR(summary?.today ?? 0) },
              { label: "Month-to-date", value: formatINR(summary?.monthToDate ?? 0) },
              { label: "Records", value: String(visible.length) },
              { label: "Disputed", value: String(disputed) },
            ]}
          />
        }
      />
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold border ${
                statusFilter === f.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button type="button" onClick={load} className="ml-auto text-[11px] font-semibold text-slate-600">
            Refresh
          </button>
        </div>

        <div className={KPI_GRID_STANDARD}>
          <KpiCard
            testId="det-today"
            label="Today"
            value={formatINR(summary?.today ?? 0)}
            hint="billable today"
            icon={IndianRupee}
            accent="danger"
          />
          <KpiCard
            testId="det-mtd"
            label="Month-to-date"
            value={formatINR(summary?.monthToDate ?? 0)}
            hint={new Date().toLocaleString("en-IN", { month: "short", year: "numeric" })}
            icon={IndianRupee}
            accent="danger"
          />
          <KpiCard
            testId="det-disputed"
            label="Disputed"
            value={summary?.disputedCount ?? 0}
            hint="claims open"
            icon={AlertTriangle}
            accent="warning"
          />
          <KpiCard
            testId="det-savings"
            label="Targeted Savings"
            value={formatINR(summary?.targetedSavings ?? 0)}
            hint="est. from resolutions"
            icon={TrendingDown}
            accent="success"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard testId="det-formula" title="Detention Formula">
            <div className="font-mono-yms text-[12px] bg-slate-900 text-amber-300 p-3 rounded-md leading-relaxed">
              <span className="text-slate-400">// {config?.formula || "Cost = (Actual - Free) × Rate"}</span>
              <br />
              (<span className="text-blue-400">ActualWaitTime</span> - <span className="text-emerald-400">FreeWaitTime</span>) ×{" "}
              <span className="text-red-400">Rate</span>
            </div>
            <div className="mt-3 space-y-2 text-[12px]">
              {[
                ["Free Wait", `${config?.free_hours ?? 2} hours`],
                ["Standard Rate", `₹${(config?.standard_rate ?? 1000).toLocaleString("en-IN")} / hour`],
                ["Hazmat Rate", `₹${(config?.hazmat_rate ?? 1500).toLocaleString("en-IN")} / hour`],
                ["Outside Surcharge", `+${config?.outside_surcharge_pct ?? 15}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">{k}</span>
                  <span className="font-mono-yms font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">Derived from check-in, queue, and yard events</p>
          </SectionCard>

          <SectionCard testId="det-breakdown" title="Breakdown by Category" subtitle="All records" className="xl:col-span-2">
            {breakdown.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-slate-500">No detention charges yet</div>
              ) : (
                <ChartBox height={224}>
                  <BarChart data={breakdown}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickFormatter={(v) => `₹${v / 1000}K`} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(15,23,42,0.04)" }} formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Cost"]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {breakdown.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartBox>
              )}
          </SectionCard>
        </div>

        <SectionCard testId="det-list" title="Detention Records" subtitle={`${visible.length} records · ${formatINR(total)} total`} padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left font-semibold px-4 py-2.5">Ticket</th>
                  <th className="text-left font-semibold px-2 py-2.5">Plate</th>
                  <th className="text-left font-semibold px-2 py-2.5">Category</th>
                  <th className="text-left font-semibold px-2 py-2.5">Transporter</th>
                  <th className="text-right font-semibold px-2 py-2.5">Free</th>
                  <th className="text-right font-semibold px-2 py-2.5">Actual</th>
                  <th className="text-right font-semibold px-2 py-2.5">Rate</th>
                  <th className="text-right font-semibold px-2 py-2.5">Cost</th>
                  <th className="text-left font-semibold px-2 py-2.5">Status</th>
                  <th className="text-right font-semibold px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr
                    key={r.detentionId}
                    data-testid={`det-row-${r.id}`}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => openDetail(r)}
                  >
                    <td className="px-4 py-2.5 font-mono-yms font-semibold text-slate-900">{r.id}</td>
                    <td className="px-2 py-2.5 font-mono-yms text-slate-700">{r.plate}</td>
                    <td className="px-2 py-2.5">
                      <StatusPill status={r.category} />
                    </td>
                    <td className="px-2 py-2.5 text-slate-700">{r.transporter}</td>
                    <td className="px-2 py-2.5 text-right font-mono-yms text-slate-700">{r.freeHours}h</td>
                    <td className="px-2 py-2.5 text-right font-mono-yms text-slate-700">{r.actualHours}h</td>
                    <td className="px-2 py-2.5 text-right font-mono-yms text-slate-700">₹{r.rate}</td>
                    <td className="px-2 py-2.5 text-right font-mono-yms font-bold text-red-600">₹{r.cost.toLocaleString("en-IN")}</td>
                    <td className="px-2 py-2.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openDetail(r)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2"
                      >
                        <FileText className="w-3 h-3" /> Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && <EmptyState query={search} label="detention records" />}
          </div>
        </SectionCard>
      </div>
    </>
  );
};

export default Detention;
