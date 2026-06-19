import React, { useCallback, useEffect, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import KpiCard from "../components/yms/KpiCard";
import operationsDashboardApi, {
  OPERATIONS_SLA,
  slaComplianceAccent,
  timeMetricAccent,
} from "../services/operationsDashboardApi";
import { API_BASE } from "../services/ymsApi";
import {
  CalendarCheck,
  Truck,
  LogOut,
  Warehouse,
  Clock,
  Package,
  ShieldAlert,
  Gauge,
  Loader2,
  AlertCircle,
  Timer,
} from "lucide-react";

import { KPI_GRID_DENSE, PAGE_PADDING } from "../lib/responsiveClasses";

const REFRESH_MS = 30000;

const OperationsDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await operationsDashboardApi.fetchOperationsDashboard();
      setKpis(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("[OperationsDashboard] load failed", e);
      if (!silent) {
        setError(e.message || `Failed to load operations dashboard (${API_BASE})`);
        setKpis(null);
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

  if (loading && !kpis) {
    return (
      <>
        <TopBar title="Operations Dashboard" subtitle="Loading live KPIs…" />
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading operations data…
        </div>
      </>
    );
  }

  if (error && !kpis) {
    return (
      <>
        <TopBar title="Operations Dashboard" subtitle="Operational visibility" />
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      </>
    );
  }

  const m = kpis || {};

  return (
    <>
      <TopBar
        title="Operations Dashboard"
        subtitle={
          lastRefresh
            ? `Live operational KPIs · updated ${lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "Live operational KPIs"
        }
      />

      <div className="p-4 md:p-6 space-y-6">
        <div className={KPI_GRID_DENSE}>
          <KpiCard
            testId="ops-kpi-appointments"
            label="Appointments Today"
            value={m.appointmentsToday ?? 0}
            icon={CalendarCheck}
            accent="info"
            hint="booking_date = today"
          />
          <KpiCard
            testId="ops-kpi-entered"
            label="Vehicles Entered"
            value={m.vehiclesEnteredToday ?? 0}
            icon={Truck}
            accent="slate"
            hint="checked in today"
          />
          <KpiCard
            testId="ops-kpi-exited"
            label="Vehicles Exited"
            value={m.vehiclesExitedToday ?? 0}
            icon={LogOut}
            accent="slate"
            hint="gate out today"
          />
          <KpiCard
            testId="ops-kpi-in-yard"
            label="Vehicles In Yard"
            value={m.vehiclesInYard ?? 0}
            icon={Warehouse}
            accent="info"
            hint="not exited / cancelled"
          />
          <KpiCard
            testId="ops-kpi-waiting"
            label="Vehicles Waiting"
            value={m.vehiclesWaiting ?? 0}
            icon={Clock}
            accent={(m.vehiclesWaiting ?? 0) > 0 ? "warning" : "success"}
            hint="WAITING · CALLED"
          />
          <KpiCard
            testId="ops-kpi-loading"
            label="Loading"
            value={m.vehiclesLoading ?? 0}
            icon={Package}
            accent="info"
            hint="READY · LOADING"
          />
          <KpiCard
            testId="ops-kpi-exit-holding"
            label="Exit Holding"
            value={m.vehiclesInExitHolding ?? 0}
            icon={ShieldAlert}
            accent={(m.vehiclesInExitHolding ?? 0) > 0 ? "warning" : "success"}
            hint="EXIT_HOLDING · VERIFIED"
          />
          <KpiCard
            testId="ops-kpi-sla"
            label="SLA %"
            value={`${m.slaCompliancePct ?? 0}`}
            suffix="%"
            icon={Gauge}
            accent={slaComplianceAccent(m.slaCompliancePct)}
            hint="exited today cohort"
          />
        </div>

        <SectionCard
          testId="ops-performance-metrics"
          title="Performance Metrics"
          subtitle="Averages for vehicles exited today (backend-derived)"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KpiCard
              testId="ops-metric-waiting"
              label="Average Waiting Time"
              value={m.avgWaitingMinutes ?? 0}
              suffix="min"
              icon={Timer}
              accent={timeMetricAccent(m.avgWaitingMinutes, OPERATIONS_SLA.waitingMinutes)}
              hint={`SLA ${OPERATIONS_SLA.waitingMinutes} min`}
            />
            <KpiCard
              testId="ops-metric-loading"
              label="Average Loading Time"
              value={m.avgLoadingMinutes ?? 0}
              suffix="min"
              icon={Package}
              accent={timeMetricAccent(m.avgLoadingMinutes, OPERATIONS_SLA.loadingMinutes)}
              hint={`SLA ${OPERATIONS_SLA.loadingMinutes} min`}
            />
            <KpiCard
              testId="ops-metric-turnaround"
              label="Average Turnaround Time"
              value={m.avgTurnaroundMinutes ?? 0}
              suffix="min"
              icon={Truck}
              accent={timeMetricAccent(m.avgTurnaroundMinutes, OPERATIONS_SLA.turnaroundMinutes)}
              hint={`SLA ${OPERATIONS_SLA.turnaroundMinutes} min`}
            />
          </div>
        </SectionCard>
      </div>
    </>
  );
};

export default OperationsDashboard;
