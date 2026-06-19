import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import KpiCard from "../components/yms/KpiCard";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import EmptyState from "../components/yms/EmptyState";
import {
  Truck, Clock, Warehouse, Activity, IndianRupee, Fuel, CheckCircle2, Smile,
  ArrowUpRight, Sparkles, Pause, Play, FileText, RefreshCw, AlertTriangle,
} from "lucide-react";
import { useUI } from "../contexts/UIContext";
import DailyReportExportDialog from "../components/yms/DailyReportExportDialog";
import { toast } from "sonner";
import { matchesSearch } from "../utils/search";
import { useAuth } from "../contexts/AuthContext";
import { MOD } from "../constants/permissions";
import controlTowerApi, { formatINR } from "../services/controlTowerApi";
import controlTowerAlertsApi, { alertSeverityClass, formatAlertType } from "../services/controlTowerAlertsApi";
import {
  Area, AreaChart, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import ChartBox from "../components/common/ChartBox";
import ResponsiveTable from "../components/common/ResponsiveTable";
import { KPI_GRID_STANDARD } from "../lib/responsiveClasses";

const REFRESH_MS = 30000;

const QUEUE_SEARCH_FIELDS = ["plate", "transporter", "category", "queueNumber", "status"];
const EVENT_SEARCH_FIELDS = ["msg", "plate", "status"];
const DOCK_SEARCH_FIELDS = ["dockCode", "dockType", "status"];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900 text-white border border-slate-700 rounded-md px-2.5 py-1.5 text-[11px] font-mono-yms shadow-md">
      <div className="text-slate-400 mb-0.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-sm" style={{ background: p.color || p.fill }} />
          <span>{p.name}: <b>{p.value}</b></span>
        </div>
      ))}
    </div>
  );
};

const Skeleton = ({ className = "h-4" }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const KpiSkeletonGrid = () => (
  <div className={KPI_GRID_STANDARD}>
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-md p-4">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  const { can } = useAuth();
  const { openVehicle, openAppointment, openDock, search } = useUI();
  const [dashboard, setDashboard] = useState(null);
  const [alertsBundle, setAlertsBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyReportOpen, setDailyReportOpen] = useState(false);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const dashboardOptions = {
        includeAppointments: can(MOD.APPOINTMENTS),
        includeQueue: can(MOD.QUEUE),
        includeDocks: can(MOD.DOCKS),
        includeYardZones: can(MOD.YARD_MAP),
      };
      const requests = [controlTowerApi.fetchControlTowerDashboard(dashboardOptions)];
      if (can(MOD.CONTROL_TOWER)) {
        requests.push(controlTowerAlertsApi.fetchControlTowerAlerts());
      }
      const [dashboardResult, alertsResult] = await Promise.allSettled(requests);
      if (dashboardResult.status !== "fulfilled") {
        throw dashboardResult.reason;
      }
      setDashboard(dashboardResult.value);
      if (can(MOD.CONTROL_TOWER)) {
        if (alertsResult?.status === "fulfilled") {
          setAlertsBundle(alertsResult.value);
        } else if (!silent) {
          console.warn("[ControlTower] alerts load failed", alertsResult?.reason);
          setAlertsBundle({ activeAlerts: [], criticalCount: 0, warningCount: 0 });
        }
      } else {
        setAlertsBundle({ activeAlerts: [], criticalCount: 0, warningCount: 0 });
      }
      setLastRefresh(new Date());
    } catch (e) {
      const msg = e.message || "Failed to load Control Tower data";
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!isLive) return undefined;
    const id = setInterval(() => loadDashboard(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [isLive, loadDashboard]);

  useEffect(() => {
    const onYmsChange = () => loadDashboard(true);
    window.addEventListener("yms-data-changed", onYmsChange);
    return () => window.removeEventListener("yms-data-changed", onYmsChange);
  }, [loadDashboard]);

  const metrics = dashboard?.metrics;
  const throughput24h = dashboard?.throughput24h ?? [];
  const vehicleMix = dashboard?.vehicleMix ?? [];
  const yardZones = dashboard?.yardZones ?? [];
  const detentionByCategory = dashboard?.detentionByCategory ?? [];
  const recommendations = dashboard?.recommendations ?? [];
  const docks = useMemo(() => dashboard?.docks ?? [], [dashboard?.docks]);

  const priorityQueue = useMemo(() => {
    const rows = dashboard?.priorityQueue ?? [];
    if (!search?.trim()) return rows;
    return rows.filter((r) => matchesSearch(r, search, QUEUE_SEARCH_FIELDS));
  }, [dashboard?.priorityQueue, search]);

  const liveEvents = useMemo(() => {
    const rows = dashboard?.liveEvents ?? [];
    if (!search?.trim()) return rows;
    return rows.filter((e) => matchesSearch(e, search, EVENT_SEARCH_FIELDS));
  }, [dashboard?.liveEvents, search]);

  const visibleDocks = useMemo(() => {
    const mapped = docks.map((d) => ({
      ...d,
      dockCode: d.dock_code,
      dockType: d.dock_type || d.dock_name,
    }));
    if (!search?.trim()) return mapped;
    return mapped.filter((d) => matchesSearch(d, search, DOCK_SEARCH_FIELDS));
  }, [docks, search]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboard(true);
    } finally {
      setRefreshing(false);
    }
  };

  const detentionTotal = detentionByCategory.reduce((s, c) => s + (c.value || 0), 0);

  const openQueueVehicle = (row) => {
    openVehicle({
      queueEntryId: row.queueEntryId,
      vehicleId: row.vehicleId,
      appointmentId: row.appointmentId,
      onQueueUpdated: () => loadDashboard(true),
    });
  };

  const handleDockClick = (dock) => {
    openDock({
      dockId: dock.id,
      onUpdated: () => loadDashboard(true),
      openVehicle: (v) => openVehicle(v),
    });
  };

  const openAlertVehicle = (alert) => {
    if (!alert.vehicleId) return;
    openVehicle({
      vehicleId: alert.vehicleId,
      appointmentId: alert.appointmentId,
      onQueueUpdated: () => loadDashboard(true),
    });
  };

  const openAlertAppointment = (alert) => {
    if (!alert.appointmentId) return;
    openAppointment({ appointmentId: alert.appointmentId, onUpdated: () => loadDashboard(true) });
  };

  const openAlertDock = (alert) => {
    if (!alert.dockId) return;
    openDock({
      dockId: alert.dockId,
      onUpdated: () => loadDashboard(true),
      openVehicle: (v) => openVehicle(v),
    });
  };

  const activeAlerts = alertsBundle?.activeAlerts ?? [];
  const criticalCount = alertsBundle?.criticalCount ?? 0;
  const warningCount = alertsBundle?.warningCount ?? 0;

  if (loading && !dashboard) {
    return (
      <>
        <TopBar title="Control Tower" subtitle="Loading operational data…" />
        <div className="p-4 md:p-6 space-y-6">
          <KpiSkeletonGrid />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Skeleton className="h-72 xl:col-span-2" />
            <Skeleton className="h-72" />
          </div>
        </div>
      </>
    );
  }

  if (error && !dashboard) {
    return (
      <>
        <TopBar title="Control Tower" subtitle="Operational dashboard" />
        <div className="p-4 md:p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="font-semibold text-slate-900">Unable to load dashboard</div>
            <div className="text-sm text-slate-600 mt-1">{error}</div>
            <button
              type="button"
              onClick={() => loadDashboard()}
              className="mt-4 inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  const m = metrics || {};

  return (
    <>
      <TopBar
        title="Control Tower"
        subtitle={
          lastRefresh
            ? `Live data · refreshed ${lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
            : "Real-time vehicle orchestration · Bhiwandi Mega Hub"
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="dashboard-refresh"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md transition disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              data-testid="daily-report-btn"
              onClick={() => setDailyReportOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-md transition"
            >
              <FileText className="w-3.5 h-3.5" /> Daily Report
            </button>
          </div>
        }
      />
      <div className="p-4 md:p-6 space-y-6">
        {error && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Stale data — last refresh failed: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard testId="alert-kpi-critical" label="Critical Alerts" value={criticalCount} hint="requires immediate action" icon={AlertTriangle} accent="danger" />
          <KpiCard testId="alert-kpi-warning" label="Warning Alerts" value={warningCount} hint="approaching SLA / congestion" icon={AlertTriangle} accent="warning" />
          <KpiCard testId="alert-kpi-total" label="Total Active" value={activeAlerts.length} hint="live operational exceptions" icon={Activity} accent="info" />
        </div>

        <SectionCard
          testId="card-control-tower-alerts"
          title="Operational Alerts"
          subtitle="Live exceptions across yard, docks, and queue"
          padding="p-0"
        >
          {activeAlerts.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">No active alerts — yard operating within thresholds</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]" data-testid="control-tower-alerts-table">
                <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="text-left font-semibold px-3 py-2">Severity</th>
                    <th className="text-left font-semibold px-2 py-2">Alert Type</th>
                    <th className="text-left font-semibold px-2 py-2">Vehicle</th>
                    <th className="text-left font-semibold px-2 py-2 hidden md:table-cell">Appointment</th>
                    <th className="text-left font-semibold px-2 py-2">Dock</th>
                    <th className="text-right font-semibold px-2 py-2">Duration</th>
                    <th className="text-left font-semibold px-2 py-2 hidden lg:table-cell">Created</th>
                    <th className="text-left font-semibold px-2 py-2">Status</th>
                    <th className="text-right font-semibold px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAlerts.map((alert) => (
                    <tr key={alert.id} data-testid={`alert-row-${alert.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider ${alertSeverityClass(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-2 py-2 font-semibold text-slate-800 whitespace-nowrap">{formatAlertType(alert.alertType)}</td>
                      <td className="px-2 py-2 font-mono-yms text-slate-900 whitespace-nowrap">{alert.vehicle || "—"}</td>
                      <td className="px-2 py-2 text-slate-600 whitespace-nowrap hidden md:table-cell">{alert.appointment || "—"}</td>
                      <td className="px-2 py-2 font-mono-yms text-slate-700 whitespace-nowrap">
                        <div>{alert.dock || "—"}</div>
                        {(alert.alertType === "LOADING_DELAY" && (alert.labor || alert.equipment)) ||
                        (alert.alertType === "LOADING_EXCEPTION" && alert.exceptionType) ? (
                          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
                            {alert.alertType === "LOADING_EXCEPTION"
                              ? `${alert.exceptionType?.replace(/_/g, " ")} · ${alert.exceptionStatus || ""}`
                              : [alert.labor, alert.equipment].filter(Boolean).join(" · ")}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2 text-right font-mono-yms text-slate-700 whitespace-nowrap">
                        {alert.alertType === "LOADING_DELAY" && alert.delayMin != null
                          ? `+${alert.delayMin}m`
                          : `${alert.durationMin}m`}
                      </td>
                      <td className="px-2 py-2 text-slate-500 whitespace-nowrap hidden lg:table-cell">
                        {alert.createdAt
                          ? new Date(alert.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <StatusPill status={alert.status} />
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          {alert.vehicleId && (
                            <button type="button" onClick={() => openAlertVehicle(alert)} className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded px-1.5 py-0.5">
                              Vehicle
                            </button>
                          )}
                          {alert.appointmentId && (
                            <button type="button" onClick={() => openAlertAppointment(alert)} className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded px-1.5 py-0.5">
                              Appt
                            </button>
                          )}
                          {alert.dockId && (
                            <button type="button" onClick={() => openAlertDock(alert)} className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded px-1.5 py-0.5">
                              Dock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className={KPI_GRID_STANDARD}>
          <KpiCard testId="kpi-vehicles-in" label="In Yard" value={m.inYard ?? 0} hint="active now" icon={Truck} accent="slate" />
          <KpiCard testId="kpi-waiting" label="Waiting" value={m.waiting ?? 0} hint="virtual queue" icon={Clock} accent="warning" />
          <KpiCard testId="kpi-loading" label="Loading" value={m.loading ?? 0} hint="at docks" icon={Activity} accent="info" />
          <KpiCard testId="kpi-exited" label="Exited" value={m.exitedToday ?? 0} hint="today" icon={CheckCircle2} accent="success" />
          <KpiCard testId="kpi-yard-occ" label="Yard Occupancy" value={`${m.yardOccupancyPct ?? 0}`} suffix="%" hint={`capacity ${controlTowerApi.YARD_CAPACITY}`} icon={Warehouse} accent="info" />
          <KpiCard testId="kpi-dock-util" label="Dock Util." value={`${m.dockUtilizationPct ?? 0}`} suffix="%" hint="target 85%" icon={Warehouse} accent="success" />
          <KpiCard testId="kpi-wait-min" label="Avg Wait" value={m.avgWaitingMin ?? 0} suffix="min" hint="target 30 min" icon={Clock} accent="warning" />
          <KpiCard
            testId="kpi-tat"
            label="Avg TAT"
            value={m.avgTurnaroundMin ?? 0}
            suffix="min"
            hint={m.tatPartial ? "partial (missing exit events)" : "target 90 min"}
            icon={Activity}
            accent="warning"
          />
          <KpiCard testId="kpi-detention" label="Detention" value={formatINR(m.detentionToday ?? 0)} hint="estimated exposure" icon={IndianRupee} accent="danger" />
          <KpiCard testId="kpi-fuel" label="Fuel Wasted" value={`${m.fuelWasted ?? 0}`} suffix="L" hint="idle waiting est." icon={Fuel} accent="danger" />
          <KpiCard testId="kpi-shipment" label="Shipments" value={`${m.shipmentCompletionPct ?? 0}`} suffix="%" hint="completion" icon={CheckCircle2} accent="success" />
          <KpiCard testId="kpi-csat" label="Cust. Sat." value={`${m.customerSatPct ?? 0}`} suffix="%" hint="proxy from completion" icon={Smile} accent="success" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard
            testId="card-throughput"
            title="Vehicle Throughput — 24h"
            subtitle="Gate-in vs Gate-out hourly (yard events)"
            className="xl:col-span-2"
            action={<div className="flex gap-1.5 text-[10px] font-semibold uppercase tracking-wider"><span className="text-blue-600">● In</span><span className="text-amber-600">● Out</span></div>}
          >
            {throughput24h.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-slate-500">No events in the last 24 hours</div>
              ) : (
                <ChartBox height={256}>
                  <AreaChart data={throughput24h}>
                    <defs>
                      <linearGradient id="g-in" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g-out" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D97706" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="h" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area dataKey="in" name="Gate-In" stroke="#2563EB" fill="url(#g-in)" strokeWidth={2} />
                    <Area dataKey="out" name="Gate-Out" stroke="#D97706" fill="url(#g-out)" strokeWidth={2} />
                  </AreaChart>
                </ChartBox>
              )}
          </SectionCard>

          <SectionCard testId="card-vehicle-mix" title="Vehicle Mix" subtitle="In yard now">
              {vehicleMix.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-slate-500">No vehicles in yard</div>
              ) : (
                <ChartBox height={256}>
                  <PieChart>
                    <Pie data={vehicleMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                      {vehicleMix.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ChartBox>
              )}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard
            testId="card-priority-queue"
            title="Priority Queue"
            subtitle="Sorted by priority score"
            className="xl:col-span-2"
            padding="p-0"
            action={<a href="/queue" className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1">View all <ArrowUpRight className="w-3 h-3" /></a>}
          >
            {priorityQueue.length === 0 ? (
              search ? <EmptyState query={search} label="queue entries" /> : (
                <div className="px-4 py-12 text-center text-sm text-slate-500">No active queue entries</div>
              )
            ) : (
              <ResponsiveTable testId="priority-queue-table">
              <table className="w-full text-[12px] min-w-[480px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="text-left font-semibold px-4 py-2">Vehicle</th>
                    <th className="text-left font-semibold px-2 py-2">Category</th>
                    <th className="text-left font-semibold px-2 py-2">Waiting</th>
                    <th className="text-left font-semibold px-2 py-2">Detention</th>
                    <th className="text-right font-semibold px-4 py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityQueue.slice(0, 6).map((v) => (
                    <tr key={v.id} onClick={() => openQueueVehicle(v)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <td className="px-4 py-2.5">
                        <div className="font-mono-yms font-semibold text-slate-900">{v.plate}</div>
                        <div className="text-[10px] text-slate-500">{v.transporter}</div>
                      </td>
                      <td className="px-2 py-2.5"><StatusPill status={v.category} /></td>
                      <td className="px-2 py-2.5 font-mono-yms text-slate-700">{v.waitingMin} min</td>
                      <td className="px-2 py-2.5 font-mono-yms text-red-600 font-semibold">
                        {v.detentionCost ? `₹${v.detentionCost.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-mono-yms font-bold ${v.priorityScore > 80 ? "text-red-600" : v.priorityScore > 60 ? "text-amber-600" : "text-slate-700"}`}>
                          {v.priorityScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </ResponsiveTable>
            )}
          </SectionCard>

          <SectionCard
            testId="card-events"
            title="Live Events"
            subtitle={`Yard activity · ${liveEvents.length} shown`}
            padding="p-0"
            action={
              <button
                data-testid="event-feed-toggle"
                type="button"
                onClick={() => setIsLive(!isLive)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition ${
                  isLive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
                }`}
              >
                {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isLive ? "Live" : "Paused"}
                {isLive && <span className="w-1 h-1 rounded-full bg-emerald-500 pulse-dot ml-0.5" />}
              </button>
            }
          >
            <div data-testid="event-feed" className="max-h-[330px] overflow-y-auto thin-scroll">
              {liveEvents.length === 0 ? (
                search ? <EmptyState query={search} label="events" /> : (
                  <div className="px-4 py-12 text-center text-sm text-slate-500">No yard events yet</div>
                )
              ) : (
                liveEvents.map((e) => {
                  const color = e.level === "danger" ? "bg-red-500" : e.level === "warning" ? "bg-amber-500" : e.level === "success" ? "bg-emerald-500" : "bg-blue-500";
                  return (
                    <div key={e.id} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <span className={`w-1.5 h-1.5 rounded-full ${color} mt-1.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-slate-700 leading-snug">{e.msg}</div>
                        <div className="font-mono-yms text-[10px] text-slate-400 mt-0.5">
                          {e.ts} IST{e.plate ? ` · ${e.plate}` : ""}{e.status ? ` · ${e.status}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard testId="card-zones" title="Yard Zones" subtitle="Occupancy from yard zone master">
            <div className="space-y-2.5">
              {yardZones.map((z) => {
                const pct = z.capacity ? Math.round((z.occupied / z.capacity) * 100) : 0;
                return (
                  <div key={z.code}>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold text-white" style={{ background: z.color }}>{z.code}</span>
                        <span className="font-semibold text-slate-800">{z.name}</span>
                      </div>
                      <span className="font-mono-yms text-slate-600">{z.occupied}/{z.capacity}</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                      <div className="h-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: pct > 85 ? "#DC2626" : pct > 65 ? "#D97706" : z.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard testId="card-detention-mix" title="Detention by Category" subtitle="Estimated exposure">
            {detentionByCategory.every((c) => !c.value) ? (
                <div className="h-44 flex items-center justify-center text-sm text-slate-500">No detention exposure</div>
              ) : (
                <ChartBox height={176}>
                  <BarChart data={detentionByCategory} layout="vertical">
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="2 4" horizontal={false} />
                    <XAxis type="number" stroke="#64748B" fontSize={10} tickFormatter={(v) => `₹${v / 1000}K`} />
                    <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={60} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {detentionByCategory.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ChartBox>
              )}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Total Exposure</span>
              <span className="font-display font-bold text-xl text-red-600 font-mono-yms">{formatINR(detentionTotal)}</span>
            </div>
          </SectionCard>

          <SectionCard testId="card-dock-summary" title="Dock Status" subtitle={`${docks.length} total docks`}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-center">
                <div className="font-display font-bold text-2xl text-emerald-700 font-mono-yms">{m.dockAvailable ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mt-0.5">Available</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-2 text-center">
                <div className="font-display font-bold text-2xl text-red-700 font-mono-yms">{m.dockOccupied ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wider text-red-700 font-semibold mt-0.5">Occupied</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-center">
                <div className="font-display font-bold text-2xl text-amber-700 font-mono-yms">{m.dockDelayed ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mt-0.5">Delayed</div>
              </div>
            </div>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto thin-scroll">
              {visibleDocks.length === 0 ? (
                search ? <EmptyState query={search} label="docks" /> : (
                  <div className="text-center text-sm text-slate-500 py-4">No docks configured</div>
                )
              ) : (
                visibleDocks.slice(0, 8).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDockClick(d)}
                    className="w-full flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-1 rounded-sm text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono-yms font-semibold w-10 text-slate-700">{d.dock_code}</span>
                      <span className="text-slate-500">{d.dock_type || d.dock_name}</span>
                    </div>
                    <StatusPill status={d.status} />
                  </button>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          testId="card-ai-strip"
          title={<span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> Operational Recommendations</span>}
          subtitle="Rule-based actions (not AI/ML)"
          action={<a href="/ai" className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1">All insights <ArrowUpRight className="w-3 h-3" /></a>}
        >
          {recommendations.length === 0 ? (
            <div className="text-sm text-slate-500 py-4 text-center">No active recommendations — yard within normal thresholds</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {recommendations.map((a) => {
                const sevMap = { success: "border-l-emerald-500", warning: "border-l-amber-500", danger: "border-l-red-500", info: "border-l-blue-500" };
                return (
                  <div key={a.id} className={`border border-slate-200 border-l-4 ${sevMap[a.severity] || sevMap.info} rounded-md p-3 hover:shadow-sm transition`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">{a.module}</span>
                      <span className="font-mono-yms text-[10px] text-slate-400">{a.confidence}% conf</span>
                    </div>
                    <div className="mt-1.5 text-[12.5px] font-semibold text-slate-900 leading-snug">{a.title}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{a.impact}</div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
      <DailyReportExportDialog open={dailyReportOpen} onOpenChange={setDailyReportOpen} />
    </>
  );
};

export default Dashboard;
