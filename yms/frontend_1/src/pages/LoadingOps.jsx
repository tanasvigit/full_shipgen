import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import EmptyState from "../components/yms/EmptyState";
import loadingOpsApi from "../services/loadingOpsApi";
import { healthClassName } from "../services/loadingProgressEngine";
import LoadingExceptionTable from "../components/yms/LoadingExceptionTable";
import { Forklift, AlertTriangle, RefreshCw } from "lucide-react";
import { useUI } from "../contexts/UIContext";
import { matchesSearch } from "../utils/search";
import usePermissions from "../hooks/usePermissions";
import { MOD } from "../constants/permissions";
import { KPI_GRID_STANDARD } from "../lib/responsiveClasses";
import PageContent from "../components/yms/PageContent";

const OPS_FIELDS = [
  "plate", "driver", "transporter", "material", "displayStatus", "dockCode",
  "operationType", "laborTeam", "equipment", "exceptionSummary", "appointmentRef",
  "etaCompletionLabel", "remainingLabel", "health",
];

function progressBarClass(op) {
  if (op.operationHealth === "PAUSED") return "bg-slate-500";
  if (op.hasException) return "bg-amber-500";
  switch (op.operationHealth || op.health) {
    case "DELAYED":
      return "bg-red-600";
    case "AT_RISK":
      return "bg-amber-500";
    default:
      return "bg-emerald-600";
  }
}

const LoadingOps = () => {
  const { search, openLoadingOp } = useUI();
  const { canWriteYardEvent, can } = usePermissions();
  const includeAppointments = can(MOD.APPOINTMENTS);
  const includeQueue = can(MOD.QUEUE);
  const [operations, setOperations] = useState([]);
  const [completedOperations, setCompletedOperations] = useState([]);
  const [kpis, setKpis] = useState({
    activeCount: 0,
    avgLoadingMin: 0,
    openExceptions: 0,
    criticalExceptions: 0,
    pausedOperations: 0,
    dockCount: 0,
  });
  const [activeExceptions, setActiveExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [exceptionWorking, setExceptionWorking] = useState(false);

  const loadOps = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const bundle = await loadingOpsApi.fetchLoadingOpsBundle({
        includeAppointments,
        includeQueue,
      });
      setOperations(bundle.operations);
      setCompletedOperations(bundle.completedOperations || []);
      setKpis(loadingOpsApi.computeLoadingKpis(bundle.operations, bundle.events, bundle.exceptions));
      setActiveExceptions(loadingOpsApi.buildActiveExceptionRows(bundle.exceptions, bundle.operations));
    } catch (e) {
      setError(e.message || "Failed to load operations");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [includeAppointments, includeQueue]);

  useEffect(() => {
    loadOps();
  }, [loadOps]);

  useEffect(() => {
    const onYmsChange = () => loadOps(true);
    window.addEventListener("yms-data-changed", onYmsChange);
    return () => window.removeEventListener("yms-data-changed", onYmsChange);
  }, [loadOps]);

  useEffect(() => {
    const pollId = setInterval(() => loadOps(true), 30000);
    return () => clearInterval(pollId);
  }, [loadOps]);

  const filtered = useMemo(() => {
    if (filter === "completed") {
      return completedOperations.filter((o) => matchesSearch(o, search, OPS_FIELDS));
    }
    let list = operations;
    if (filter === "loading") list = list.filter((o) => o.operationType === "Loading");
    if (filter === "unloading") list = list.filter((o) => o.operationType === "Unloading");
    if (filter === "paused") list = list.filter((o) => o.paused);
    if (filter === "delayed") list = list.filter((o) => o.delayed);
    if (filter === "exception") list = list.filter((o) => o.hasException);
    return list.filter((o) => matchesSearch(o, search, OPS_FIELDS));
  }, [operations, completedOperations, filter, search]);

  const openDetail = (op) => {
    openLoadingOp({
      queueEntryId: op.queueEntryId,
      onUpdated: () => loadOps(true),
    });
  };

  const runExceptionAction = async (fn, msg) => {
    setExceptionWorking(true);
    try {
      await fn();
      if (msg) {
        /* success feedback via refreshed data */
      }
      await loadOps(true);
    } catch (e) {
      window.alert(e.message || "Action failed");
    } finally {
      setExceptionWorking(false);
    }
  };

  const handleAssign = (ex, owner) =>
    runExceptionAction(
      () => loadingOpsApi.assignOperationException(ex.id, owner),
      "Exception assigned"
    );

  const handleResolve = (ex) => {
    const notes = window.prompt("Resolution notes (optional):") ?? "";
    runExceptionAction(
      () => loadingOpsApi.resolveOperationException(ex.id, "operator", notes || undefined),
      "Exception resolved"
    );
  };

  const handleClose = (ex) =>
    runExceptionAction(
      () => loadingOpsApi.closeOperationException(ex.id, "manager"),
      "Exception closed"
    );

  if (loading && operations.length === 0) {
    return (
      <>
        <TopBar title="Loading Operations" subtitle="Loading…" />
        <PageContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-md animate-pulse" />
          ))}
        </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Loading Operations"
        subtitle="Live loading & unloading tracker with exception handling"
        actions={
          <button
            type="button"
            onClick={() => loadOps(true)}
            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />
      <PageContent className="space-y-5">
        {error && (
          <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 flex justify-between">
            <span>{error}</span>
            <button type="button" className="underline font-semibold" onClick={() => loadOps()}>Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div data-testid="loading-kpi-active" className="bg-white border border-slate-200 rounded-md p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Active Operations</div>
            <div className="font-display font-bold text-3xl text-slate-900 mt-2 font-mono-yms">{kpis.activeCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">across {kpis.dockCount || 0} docks</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Avg Loading Time</div>
            <div className="font-display font-bold text-3xl text-slate-900 mt-2 font-mono-yms">
              {kpis.avgLoadingMin || "—"} {kpis.avgLoadingMin ? <span className="text-sm font-medium text-slate-400">min</span> : null}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">from active / completed ops</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Open Exceptions</div>
            <div className="font-display font-bold text-3xl text-amber-600 mt-2 font-mono-yms">{kpis.openExceptions}</div>
            <div className="text-[11px] text-slate-500 mt-1">OPEN / IN_PROGRESS</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Critical Exceptions</div>
            <div className="font-display font-bold text-3xl text-red-600 mt-2 font-mono-yms">{kpis.criticalExceptions}</div>
            <div className="text-[11px] text-slate-500 mt-1">safety / equipment</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Paused Operations</div>
            <div className="font-display font-bold text-3xl text-slate-700 mt-2 font-mono-yms">{kpis.pausedOperations}</div>
            <div className="text-[11px] text-slate-500 mt-1">loading on hold</div>
          </div>
        </div>

        <SectionCard
          testId="card-exceptions"
          title="Exception Panel"
          subtitle="Managed incidents · assign, resolve, close"
          padding="p-0"
        >
          <LoadingExceptionTable
            rows={activeExceptions}
            working={exceptionWorking}
            onAssign={canWriteYardEvent ? handleAssign : undefined}
            onResolve={canWriteYardEvent ? handleResolve : undefined}
            onClose={canWriteYardEvent ? handleClose : undefined}
          />
        </SectionCard>

        <div className="flex flex-wrap gap-2">
          {["all", "loading", "unloading", "paused", "delayed", "exception", "completed"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-sm ${
                filter === f ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <SectionCard
          testId="card-active-ops"
          title={filter === "completed" ? "Completed Operations" : "Active Operations"}
          subtitle={
            filter === "completed"
              ? "Recent completions from LOADING_COMPLETED events · last 4 hours"
              : "Loading & unloading in progress · click row for details"
          }
          padding="p-0"
        >
          <div className="overflow-x-auto">
            {filter === "completed" ? (
              <table className="w-full text-[12px]" data-testid="completed-ops-table">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left font-semibold px-4 py-2.5">Vehicle</th>
                    <th className="text-left font-semibold px-2 py-2.5">Appointment</th>
                    <th className="text-left font-semibold px-2 py-2.5">Dock Used</th>
                    <th className="text-left font-semibold px-2 py-2.5">Labor</th>
                    <th className="text-left font-semibold px-2 py-2.5">Equipment</th>
                    <th className="text-left font-semibold px-2 py-2.5">Loading Duration</th>
                    <th className="text-left font-semibold px-2 py-2.5">Planned Duration</th>
                    <th className="text-left font-semibold px-2 py-2.5">Variance</th>
                    <th className="text-left font-semibold px-4 py-2.5">Completed Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((op) => (
                    <tr
                      key={op.id}
                      data-testid={`completed-row-${op.plate}`}
                      className="border-b border-slate-100"
                    >
                      <td className="px-4 py-2.5 font-mono-yms font-semibold text-slate-900">{op.plate}</td>
                      <td className="px-2 py-2.5 text-slate-700">{op.appointmentRef}</td>
                      <td className="px-2 py-2.5 font-mono-yms font-bold text-slate-900">{op.dockUsed}</td>
                      <td className="px-2 py-2.5 text-slate-700">{op.laborTeam}</td>
                      <td className="px-2 py-2.5 text-slate-700">{op.equipment}</td>
                      <td className="px-2 py-2.5 font-mono-yms text-slate-700">
                        {op.loadingDurationMin != null ? `${op.loadingDurationMin} min` : "—"}
                      </td>
                      <td className="px-2 py-2.5 font-mono-yms text-slate-500">
                        {op.plannedDurationMin != null ? `${op.plannedDurationMin} min` : "—"}
                      </td>
                      <td className="px-2 py-2.5 font-mono-yms text-slate-700">
                        {op.varianceLabel || "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono-yms text-slate-700">{op.completedTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-[12px]" data-testid="active-ops-table">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left font-semibold px-4 py-2.5">Vehicle</th>
                    <th className="text-left font-semibold px-2 py-2.5">Dock</th>
                    <th className="text-left font-semibold px-2 py-2.5">Operation</th>
                    <th className="text-left font-semibold px-2 py-2.5">Material</th>
                    <th className="text-left font-semibold px-2 py-2.5">Labor</th>
                    <th className="text-left font-semibold px-2 py-2.5">Equipment</th>
                    <th className="text-left font-semibold px-2 py-2.5 w-32">Progress</th>
                    <th className="text-left font-semibold px-2 py-2.5">ETA</th>
                    <th className="text-left font-semibold px-2 py-2.5">Remaining</th>
                    <th className="text-left font-semibold px-2 py-2.5">Health</th>
                    <th className="text-left font-semibold px-4 py-2.5">Exceptions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((op) => (
                    <tr
                      key={op.id}
                      data-testid={`op-row-${op.plate}`}
                      onClick={() => openDetail(op)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-mono-yms font-semibold text-slate-900">{op.plate}</div>
                        <div className="text-[10px] text-slate-500">{op.driver}</div>
                      </td>
                      <td className="px-2 py-2.5 font-mono-yms font-bold text-slate-900">{op.dockCode}</td>
                      <td className="px-2 py-2.5">
                        <StatusPill status={op.queueStatus || (op.operationType === "Unloading" ? "UNLOADING" : "LOADING")} />
                      </td>
                      <td className="px-2 py-2.5 text-slate-700">{op.material}</td>
                      <td className="px-2 py-2.5 text-[11px] text-slate-700">{op.laborTeam}</td>
                      <td className="px-2 py-2.5 text-[11px] text-slate-700">{op.equipment}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                            <div
                              className={`h-full ${progressBarClass(op)}`}
                              style={{ width: `${op.progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono-yms text-[11px] font-semibold text-slate-700 w-10 text-right">
                            {op.progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 font-mono-yms text-slate-700 whitespace-nowrap">
                        {op.etaCompletionLabel || "—"}
                      </td>
                      <td className="px-2 py-2.5 font-mono-yms text-slate-700 whitespace-nowrap">
                        {op.remainingLabel || "—"}
                      </td>
                      <td className="px-2 py-2.5">
                        {op.operationHealth || op.health ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider ${healthClassName(op.operationHealth || op.health)}`}>
                            {(op.operationHealth || op.health).replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {op.exceptionSummary ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 text-[11px] font-semibold">
                            <AlertTriangle className="w-3 h-3" /> {op.exceptionSummary}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {filtered.length === 0 && (
              <EmptyState query={search || filter} label={filter === "completed" ? "completed operations" : "active operations"} />
            )}
          </div>
          {filter !== "completed" && (
            <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-4">
              <span className="inline-flex items-center gap-1"><Forklift className="w-3 h-3" /> Labor & equipment from live assignments only</span>
              <span>Progress vs dock SLA · auto-refresh 30s</span>
            </div>
          )}
        </SectionCard>
      </PageContent>
    </>
  );
};

export default LoadingOps;
