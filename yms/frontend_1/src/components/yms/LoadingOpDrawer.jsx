import React, { useCallback, useEffect, useState } from "react";
import useYmsSyncRefresh from "../../hooks/useYmsSyncRefresh";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";
import { toast } from "sonner";
import {
  PackageCheck, Truck, Clock, AlertTriangle, Wrench, Users, Loader2,
  Play, Pause, CheckCircle2, Package,
} from "lucide-react";
import loadingOpsApi, { getOperationEvents, formatAuditEventLabel, EXCEPTION_TYPES, PAUSE_REASONS } from "../../services/loadingOpsApi";
import { healthClassName } from "../../services/loadingProgressEngine";
import LoadingExceptionTable from "./LoadingExceptionTable";
import { fetchResourceReadiness } from "../../services/docksApi";
import ResourceReadinessPanel from "./ResourceReadinessPanel";
import { canStartLoadingFromReadiness, canStartLoadingForVehicleStatus } from "../../utils/resourceGating";
import usePermissions from "../../hooks/usePermissions";
import YmsDrawerTopBar from "./YmsDrawerTopBar";
import YmsDrawerBody, { YMS_DRAWER_LOADING_CLASS } from "./YmsDrawerBody";
import useBundlePermissionFlags from "../../hooks/useBundlePermissionFlags";

export const LoadingOpDrawer = () => {
  const { loadingOp, closeLoadingOp } = useUI();
  const { canTransitionVehicle, canWriteYardEvent } = usePermissions();
  const { loadingOpsBundleOptions } = useBundlePermissionFlags();
  const open = !!loadingOp;
  const [op, setOp] = useState(null);
  const [events, setEvents] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [exceptionNote, setExceptionNote] = useState("");
  const [pauseReason, setPauseReason] = useState("OTHER");

  const refresh = useCallback(async () => {
    if (!loadingOp?.queueEntryId) return;
    setLoading(true);
    try {
      const { operations, events: allEvents } = await loadingOpsApi.fetchLoadingOpsBundle(
        loadingOpsBundleOptions
      );
      const found = operations.find((o) => o.queueEntryId === loadingOp.queueEntryId);
      setOp(found || null);
      if (found) {
        setEvents(getOperationEvents(allEvents, found));
        if (found.vehicleId) {
          setReadiness(await fetchResourceReadiness(found.vehicleId));
        } else {
          setReadiness(null);
        }
      } else {
        setReadiness(null);
      }
    } catch (e) {
      toast.error(e.message || "Failed to load operation");
    } finally {
      setLoading(false);
    }
  }, [loadingOp?.queueEntryId, loadingOpsBundleOptions]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useYmsSyncRefresh(refresh, open);

  const afterAction = async () => {
    await refresh();
    await loadingOp?.onUpdated?.();
  };

  const run = async (fn, msg) => {
    setWorking(true);
    try {
      await fn();
      if (msg) toast.success(msg);
      await afterAction();
    } catch (e) {
      toast.error(e.message || "Action failed");
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  const vehicleStatus = op?.displayStatus || op?.vehicle?.status;
  const showStart = ["DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING"].includes(op?.queueStatus);
  const canStart =
    showStart &&
    canStartLoadingForVehicleStatus(vehicleStatus) &&
    canStartLoadingFromReadiness(readiness);
  const canComplete = op?.queueStatus === "LOADING";
  const canPause = op?.queueStatus === "LOADING" && !op?.paused;
  const canResume = op?.paused;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeLoadingOp()}>
      <SheetContent data-testid="loading-op-drawer" hideClose className="w-full sm:max-w-md overflow-y-auto max-h-[100dvh] flex flex-col p-0">
        <YmsDrawerTopBar>
          <SheetHeader className="p-0 text-left space-y-1">
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <PackageCheck className="w-5 h-5" />
              {op?.operationType || "Operation"} — {op?.plate}
            </SheetTitle>
          </SheetHeader>
        </YmsDrawerTopBar>

        {loading && !op ? (
          <div className={YMS_DRAWER_LOADING_CLASS}>Loading…</div>
        ) : op ? (
          <YmsDrawerBody>
            <div className="flex items-center justify-between gap-2">
              <StatusPill status={op.paused ? "WAITING" : op.displayStatus === "LOADING" ? "LOADING" : "DOCK_ASSIGNED"} />
              <span className="font-mono-yms text-[11px] text-slate-500">{op.dockCode}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[12px] space-y-2">
              <div className="flex items-center gap-2 font-mono-yms font-bold">
                <Truck className="w-4 h-4" /> {op.plate}
              </div>
              <div className="text-slate-600">{op.driver} · {op.transporter}</div>
              <div>Material: {op.material}</div>
              <div>Dock: {op.dockCode} — {op.dockName}</div>
              <div>Started: {op.startedTime}</div>
              {(op.operationHealth || op.health) && (
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider ${healthClassName(op.operationHealth || op.health)}`}>
                    {(op.operationHealth || op.health).replace("_", " ")}
                  </span>
                </div>
              )}
              {op.paused && (
                <div className="text-[11px] text-slate-600 border border-slate-200 rounded-md p-2 bg-white">
                  <div className="font-semibold text-slate-800">Paused</div>
                  <div>Since: {op.pausedSince ? new Date(op.pausedSince).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                  <div>Reason: {op.pauseReason || "—"}</div>
                  <div>Duration: {op.pausedDurationMin ?? 0} min · total {op.totalPausedMin ?? 0} min</div>
                </div>
              )}
              <div className="mt-2">
                <div className="h-1.5 bg-slate-200 rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${
                      op.hasException
                        ? "bg-amber-500"
                        : op.health === "DELAYED"
                          ? "bg-red-600"
                          : op.health === "AT_RISK"
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                    }`}
                    style={{ width: `${op.progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono-yms text-slate-500 mt-1">
                  <span>{op.progressPct}%</span>
                  <span>{op.etaCompletionLabel || "—"}</span>
                </div>
                <div className="text-[10px] font-mono-yms text-slate-500 mt-0.5">
                  {op.remainingLabel || "—"}
                  {op.plannedDurationMin ? ` · planned ${op.plannedDurationMin} min` : ""}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                <div><Wrench className="w-3 h-3 inline mr-1" />{op.equipment}</div>
                <div><Users className="w-3 h-3 inline mr-1" />{op.laborTeam}</div>
              </div>
            </div>

            <ResourceReadinessPanel readiness={readiness} />

            <div className="border border-slate-200 rounded-md p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Exception panel
              </div>
              <LoadingExceptionTable
                rows={op.structuredExceptions || op.exceptions || []}
                compact
                working={working}
                onAssign={canWriteYardEvent ? (ex, owner) =>
                  run(() => loadingOpsApi.assignOperationException(ex.id, owner), "Assigned")
                : undefined}
                onResolve={canWriteYardEvent ? (ex) => {
                  const notes = window.prompt("Resolution notes (optional):") ?? "";
                  run(
                    () => loadingOpsApi.resolveOperationException(ex.id, "operator", notes || undefined),
                    "Resolved"
                  );
                } : undefined}
                onClose={canWriteYardEvent ? (ex) =>
                  run(() => loadingOpsApi.closeOperationException(ex.id, "manager"), "Closed")
                : undefined}
              />
            </div>

            {(canTransitionVehicle || canWriteYardEvent) && (
            <div className="grid grid-cols-2 gap-2">
              {canTransitionVehicle && showStart && (
                <>
                  <button
                    type="button"
                    disabled={working || !canStart}
                    title={
                      !canStart && readiness?.missing?.length
                        ? `Missing: ${readiness.missing.join(", ")}`
                        : undefined
                    }
                    onClick={() =>
                      run(() => loadingOpsApi.startLoadingOperation(op), "Loading started")
                    }
                    className={`inline-flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-md ${
                      canStart ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Play className="w-3 h-3" /> Start Loading
                  </button>
                  <button
                    type="button"
                    disabled={working || !canStart}
                    title={
                      !canStart && readiness?.missing?.length
                        ? `Missing: ${readiness.missing.join(", ")}`
                        : undefined
                    }
                    onClick={() =>
                      run(() => loadingOpsApi.startUnloadingOperation(op), "Unloading started")
                    }
                    className={`inline-flex items-center justify-center gap-1 border text-[11px] font-semibold py-2 rounded-md ${
                      canStart
                        ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                        : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Play className="w-3 h-3" /> Start Unloading
                  </button>
                </>
              )}
              {canTransitionVehicle && canComplete && (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => run(() => loadingOpsApi.completeOperation(op), "Operation completed")}
                  className="inline-flex items-center justify-center gap-1 bg-emerald-600 text-white text-[11px] font-semibold py-2 rounded-md col-span-2"
                >
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </button>
              )}
              {canWriteYardEvent && canPause && (
                <button
                  type="button"
                  disabled={working}
                  onClick={() =>
                    run(
                      () => loadingOpsApi.pauseOperation(op, pauseReason, exceptionNote || undefined),
                      "Paused"
                    )
                  }
                  className="inline-flex items-center justify-center gap-1 border border-slate-300 text-[11px] font-semibold py-2 rounded-md"
                >
                  <Pause className="w-3 h-3" /> Pause
                </button>
              )}
              {canWriteYardEvent && canResume && (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => run(() => loadingOpsApi.resumeOperation(op), "Resumed")}
                  className="inline-flex items-center justify-center gap-1 border border-emerald-300 bg-emerald-50 text-[11px] font-semibold py-2 rounded-md"
                >
                  <Play className="w-3 h-3" /> Resume
                </button>
              )}
            </div>
            )}

            {canWriteYardEvent && (
            <div className="border border-slate-200 rounded-md p-3 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">Create exception</div>
              <input
                className="w-full text-[12px] border border-slate-300 rounded-md px-2 py-1.5"
                placeholder="Description (optional)"
                value={exceptionNote}
                onChange={(e) => setExceptionNote(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                {EXCEPTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    disabled={working}
                    onClick={() =>
                      run(
                        () => loadingOpsApi.createOperationException(op, t.value, exceptionNote || t.label),
                        "Exception created"
                      )
                    }
                    className={`text-[10px] font-semibold border py-2 rounded-md ${
                      t.critical ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            {canWriteYardEvent && canPause && (
              <div className="border border-slate-200 rounded-md p-3 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Pause reason</div>
                <select
                  className="w-full text-[12px] border border-slate-300 rounded-md px-2 py-1.5"
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                >
                  {PAUSE_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent activity
              </div>
              {events.length === 0 ? (
                <div className="text-[11px] text-slate-500">No events yet</div>
              ) : (
                <ul className="space-y-1.5 max-h-36 overflow-y-auto thin-scroll text-[11px]">
                  {events.map((e) => (
                    <li key={e.id} className="border-b border-slate-100 pb-1">
                      <span className="font-semibold">{formatAuditEventLabel(e.event_type)}</span>
                      <span className="text-slate-500 ml-1">
                        {new Date(e.event_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {e.event_note && <div className="text-slate-500 truncate">{e.event_note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </YmsDrawerBody>
        ) : (
          <div className={`${YMS_DRAWER_LOADING_CLASS} py-8`}>Operation not found</div>
        )}
        {working && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 px-5 pb-4">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing…
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default LoadingOpDrawer;
