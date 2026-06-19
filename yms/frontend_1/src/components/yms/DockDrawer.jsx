import React, { useCallback, useEffect, useState } from "react";
import useYmsSyncRefresh from "../../hooks/useYmsSyncRefresh";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";
import EditDockDialog from "./EditDockDialog";
import { toast } from "sonner";
import {
  Warehouse,
  Truck,
  Wrench,
  Users,
  Clock,
  Loader2,
  CheckCircle2,
  Play,
  Pencil,
  Trash2,
  MapPin,
  Tag,
  Calendar,
} from "lucide-react";
import docksApi, {
  getCallableQueueEntries,
  getDockEvents,
  buildDockTimeline,
  fetchResourceReadiness,
  buildDockAssignmentLifecycle,
  currentAssignmentStage,
  resolveAssignmentLifecycleStage,
  parseMaterialLabel,
} from "../../services/docksApi";
import ResourceReadinessPanel from "./ResourceReadinessPanel";
import { canStartLoadingFromReadiness, computeMandatoryReadiness } from "../../utils/resourceGating";
import { formatDockTypeLabel } from "../../utils/dockTypeSelectors";
import usePermissions from "../../hooks/usePermissions";
import useBundlePermissionFlags from "../../hooks/useBundlePermissionFlags";

export const DockDrawer = () => {
  const { dock, closeDock } = useUI();
  const {
    canWriteDock,
    canAssignDock,
    canTransitionVehicle,
    canWriteLabor,
    canWriteEquipment,
    canStartLoading,
  } = usePermissions();
  const { dockBundleOptions } = useBundlePermissionFlags();
  const bundleOptions = dockBundleOptions;
  const open = !!dock;
  const [row, setRow] = useState(null);
  const [events, setEvents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [callable, setCallable] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [assignQueueId, setAssignQueueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignmentLifecycle, setAssignmentLifecycle] = useState([]);
  const [assignLaborId, setAssignLaborId] = useState("");
  const [assignEquipmentId, setAssignEquipmentId] = useState("");
  const [availableLabor, setAvailableLabor] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);

  const refresh = useCallback(async () => {
    if (!dock?.dockId) return;
    setLoading(true);
    try {
      const bundle = await docksApi.fetchDocksBundle(bundleOptions);
      const found = bundle.rows.find((r) => r.id === dock.dockId);
      setRow(found || null);
      setEvents(getDockEvents(bundle.events, dock.dockId, 20));
      setCallable(getCallableQueueEntries(bundle.queueEntries, bundle.vehicles));
      setAvailableLabor(
        (bundle.labor || []).filter((t) =>
          ["ON_DUTY", "AVAILABLE"].includes(t.status) && !t.assigned_dock_id
        )
      );
      setAvailableEquipment(
        (bundle.equipment || []).filter(
          (e) => e.status === "IDLE" && !e.assigned_dock_id
        )
      );
      if (found?.hasActiveAssignment && found?.laborRow?.laborId) {
        setAssignLaborId(found.laborRow.laborId);
      } else {
        setAssignLaborId("");
      }
      if (found?.hasActiveAssignment && found?.equipRow?.equipmentId) {
        setAssignEquipmentId(found.equipRow.equipmentId);
      } else {
        setAssignEquipmentId("");
      }
      if (found) {
        setTimeline(buildDockTimeline(bundle.appointments, found, bundle.vehicles));
        if (found.hasActiveAssignment && found.currentVehicleId) {
          const readinessRow = await fetchResourceReadiness(found.currentVehicleId);
          setReadiness(readinessRow);
          setAssignmentLifecycle(
            buildDockAssignmentLifecycle(found.vehicle, found.queue, readinessRow)
          );
        } else {
          setReadiness(null);
          setAssignmentLifecycle([]);
        }
      }
    } catch (e) {
      toast.error(e.message || "Failed to load dock");
    } finally {
      setLoading(false);
    }
  }, [dock?.dockId, bundleOptions]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useYmsSyncRefresh(refresh, open);

  const afterAction = async () => {
    await refresh();
    await dock?.onUpdated?.();
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

  const handleDelete = async () => {
    if (!row || !window.confirm(`Delete "${row.name}" (${row.code})?`)) return;
    try {
      await docksApi.deleteDock(row.id);
      toast.success(`${row.code} deleted`);
      closeDock();
      await dock?.onUpdated?.();
    } catch (e) {
      toast.error(e.message || "Failed to delete dock");
    }
  };

  if (!open) return null;

  const hasActiveAssignment = !!row?.hasActiveAssignment;
  const canAssign = canAssignDock && row?.status === "AVAILABLE" && !hasActiveAssignment && callable.length > 0;
  const canRelease = hasActiveAssignment && row?.currentVehicle && row.status !== "AVAILABLE";
  const lifecycleStage = resolveAssignmentLifecycleStage(row?.vehicle, row?.queue, readiness);
  const canStartLoadingNow =
    row?.queue &&
    lifecycleStage === "READY_FOR_LOADING" &&
    canStartLoadingFromReadiness(readiness);
  const showStartLoading =
    row?.queue &&
    ["DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING"].includes(row.queue.status);

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && closeDock()}>
        <SheetContent data-testid="dock-drawer" className="w-full sm:max-w-md overflow-y-auto max-h-[100dvh] flex flex-col p-0">
          <SheetHeader>
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <Warehouse className="w-5 h-5" />
              {row?.name || "Dock"}
            </SheetTitle>
            {row && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono-yms text-[11px] text-slate-500">{row.code}</span>
                {canWriteDock && (
                <button type="button" onClick={() => setEditOpen(true)} className="p-1 rounded border border-slate-200" title="Edit">
                  <Pencil className="w-3 h-3" />
                </button>
                )}
                {canWriteDock && (
                <button type="button" onClick={handleDelete} className="p-1 rounded border border-red-200 text-red-700" title="Delete">
                  <Trash2 className="w-3 h-3" />
                </button>
                )}
              </div>
            )}
          </SheetHeader>

          {loading && !row ? (
            <div className="py-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : row ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <StatusPill status={row.status} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                  {row.rawType?.replace(/_/g, " ") || row.type}
                </span>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                  Dock Information
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[12px] space-y-1.5">
                  <div className="font-display font-bold text-slate-900">{row.name}</div>
                  <div className="text-[10px] font-mono-yms text-slate-500">Code: {row.code}</div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5" /> Zone: {row.zone}
                  </div>
                  <div className="text-slate-600">Capacity: {row.maxCapacity}</div>
                  <div className="pt-1">
                    <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
                      Supported Vehicle Types
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(row.supportedVehicles || []).map((v) => (
                        <span key={v} className="text-[9px] font-bold uppercase bg-white border border-slate-200 px-1.5 py-0.5 rounded-sm">
                          {formatDockTypeLabel(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
                      Supported Material Types
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(row.supportedMaterialTypes || []).map((m) => (
                        <span key={m} className="text-[9px] font-bold uppercase bg-white border border-slate-200 px-1.5 py-0.5 rounded-sm">
                          <Tag className="w-2.5 h-2.5 inline" /> {formatDockTypeLabel(m)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                  Current Assignment
                </div>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-md p-3 text-[12px] space-y-2">
                  {row.currentVehicle ? (
                    <>
                      <div className="flex items-center gap-2 font-mono-yms font-bold text-slate-900">
                        <Truck className="w-4 h-4" /> {row.currentVehicle}
                      </div>
                      <div className="text-slate-600">Queue: {row.queueNumber || "—"}</div>
                      <div className="text-slate-600">Appointment: {row.appointmentRef || "—"}</div>
                      <div className="text-slate-600">Material: {parseMaterialLabel(row.material) || "—"}</div>
                      <div className="text-slate-600">Vehicle Type: {row.vehicle?.vehicle_type || "—"}</div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-3.5 h-3.5" /> Labor: {row.laborTeam}
                        {row.laborDerived && <span className="text-[9px] text-slate-400">(derived)</span>}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Wrench className="w-3.5 h-3.5" /> Equipment: {row.equipment}
                        {row.equipmentDerived && <span className="text-[9px] text-slate-400">(derived)</span>}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-3.5 h-3.5" /> Assigned since: {row.assignedSinceLabel}
                      </div>
                      <div className="text-slate-600">
                        Expected completion: ~{row.etaCloseMin || row.estimatedServiceTimeMin}m
                      </div>
                      <div className="text-slate-600">
                        Current stage: {currentAssignmentStage(row.vehicle, row.queue, readiness)}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Loading progress</div>
                        <div className="h-1.5 bg-slate-200 rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${row.status === "DELAYED" ? "bg-amber-500" : "bg-slate-900"}`}
                            style={{ width: `${row.progressPct}%` }}
                          />
                        </div>
                        <div className="text-[10px] font-mono-yms text-slate-500 mt-1">{row.progressPct}%</div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-emerald-700 font-semibold">Ready for next vehicle</div>
                      <div className="text-slate-500">No active assignment</div>
                    </div>
                  )}
                </div>
              </div>

              {hasActiveAssignment && <ResourceReadinessPanel readiness={readiness} />}

              {hasActiveAssignment && row.currentVehicle && (canWriteLabor || canWriteEquipment) && (
                <div className="border border-slate-200 rounded-md p-3 space-y-3">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Assign resources to dock</div>
                  {canWriteLabor && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Labor team</label>
                    <select
                      data-testid="dock-assign-labor"
                      className="w-full text-[12px] border border-slate-300 rounded-md px-2 py-1.5"
                      value={assignLaborId}
                      onChange={(e) => setAssignLaborId(e.target.value)}
                      disabled={working}
                    >
                      <option value="">Select labor team…</option>
                      {availableLabor.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.team_code} · {t.team_name} · {t.status}
                        </option>
                      ))}
                      {row.laborRow && !availableLabor.find((t) => t.id === row.laborRow.laborId) && (
                        <option value={row.laborRow.laborId}>
                          {row.laborCode} · {row.laborTeam} (current)
                        </option>
                      )}
                    </select>
                    <button
                      type="button"
                      disabled={!assignLaborId || working}
                      onClick={() =>
                        run(
                          () => docksApi.assignLaborToDock(row.id, assignLaborId),
                          "Labor assigned to dock"
                        )
                      }
                      className="w-full border border-slate-300 text-slate-800 text-xs font-semibold py-2 rounded-md disabled:opacity-50"
                    >
                      Assign Labor
                    </button>
                  </div>
                  )}
                  {canWriteEquipment && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Equipment</label>
                    <select
                      data-testid="dock-assign-equipment"
                      className="w-full text-[12px] border border-slate-300 rounded-md px-2 py-1.5"
                      value={assignEquipmentId}
                      onChange={(e) => setAssignEquipmentId(e.target.value)}
                      disabled={working}
                    >
                      <option value="">Select equipment…</option>
                      {availableEquipment.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.equipment_code} · {e.equipment_name || e.equipment_type} · {e.status}
                        </option>
                      ))}
                      {row.equipRow && !availableEquipment.find((e) => e.id === row.equipRow.equipmentId) && (
                        <option value={row.equipRow.equipmentId}>
                          {row.equipmentCode} · {row.equipment} (current)
                        </option>
                      )}
                    </select>
                    <button
                      type="button"
                      disabled={!assignEquipmentId || working}
                      onClick={() =>
                        run(
                          () => docksApi.assignEquipmentToDock(row.id, assignEquipmentId),
                          "Equipment assigned to dock"
                        )
                      }
                      className="w-full border border-slate-300 text-slate-800 text-xs font-semibold py-2 rounded-md disabled:opacity-50"
                    >
                      Assign Equipment
                    </button>
                  </div>
                  )}
                </div>
              )}

              {hasActiveAssignment && assignmentLifecycle.length > 0 && row.currentVehicle && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Dock Assignment Lifecycle</div>
                  <div className="space-y-1.5 border border-slate-100 rounded-md p-2">
                    {assignmentLifecycle.map((step) => (
                      <div key={step.step} className="flex items-center gap-2 text-[11px]">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            step.state === "current"
                              ? "bg-amber-500"
                              : step.state === "done"
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                          }`}
                        />
                        <span
                          className={
                            step.state === "current"
                              ? "font-bold text-amber-700"
                              : step.state === "done"
                                ? "text-slate-800"
                                : "text-slate-400"
                          }
                        >
                          {step.step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canAssign && (
                <div className="border border-slate-200 rounded-md p-3 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Assign from queue</div>
                  <select
                    className="w-full text-[12px] border border-slate-300 rounded-md px-2 py-1.5"
                    value={assignQueueId}
                    onChange={(e) => setAssignQueueId(e.target.value)}
                  >
                    <option value="">Select queue entry…</option>
                    {callable.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.plate} · {q.queueNumber} · {q.status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!assignQueueId || working}
                    onClick={() =>
                      run(() => docksApi.assignQueueToDock(row.id, assignQueueId), "Dock assigned")
                    }
                    className="w-full bg-slate-900 text-white text-xs font-semibold py-2 rounded-md"
                  >
                    Assign Vehicle
                  </button>
                </div>
              )}

              {(canWriteDock || canTransitionVehicle) && (
              <div className="grid grid-cols-2 gap-2">
                {canTransitionVehicle && canStartLoading && showStartLoading && (
                  <button
                    type="button"
                    disabled={working || !canStartLoading}
                    title={
                      !canStartLoadingNow && readiness?.missing?.length
                        ? `Missing: ${readiness.missing.join(", ")}`
                        : undefined
                    }
                    onClick={() => run(() => docksApi.startLoadingAtDock(row.id, bundleOptions), "Loading started")}
                    className={`inline-flex items-center justify-center gap-1 border text-[11px] font-semibold py-2 rounded-md ${
                      canStartLoadingNow
                        ? "border-violet-300 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Play className="w-3 h-3" /> Start Loading
                  </button>
                )}
                {canWriteDock && canRelease && (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => run(() => docksApi.releaseDock(row.id, bundleOptions), "Dock released")}
                    className="inline-flex items-center justify-center gap-1 border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-semibold py-2 rounded-md"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Release
                  </button>
                )}
                {canWriteDock && (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => run(() => docksApi.setDockStatus(row.id, "MAINTENANCE"), "Marked maintenance")}
                  className="inline-flex items-center justify-center gap-1 border border-slate-300 text-slate-700 text-[11px] font-semibold py-2 rounded-md"
                >
                  <Wrench className="w-3 h-3" /> Maintenance
                </button>
                )}
                {canWriteDock && row.backendStatus !== "AVAILABLE" && !row.currentVehicle && (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => run(() => docksApi.setDockStatus(row.id, "AVAILABLE"), "Dock available")}
                    className="inline-flex items-center justify-center gap-1 border border-slate-300 text-slate-700 text-[11px] font-semibold py-2 rounded-md"
                  >
                    Set Available
                  </button>
                )}
              </div>
              )}

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Dock Timeline
                </div>
                <ul className="space-y-1.5 text-[11px] border border-slate-100 rounded-md p-2">
                  {timeline.map((slot, i) => (
                    <li key={i} className="flex justify-between gap-2 border-b border-slate-50 pb-1 last:border-0">
                      <span className="font-mono-yms text-slate-600">{slot.time}</span>
                      <span className={`font-semibold truncate ${slot.type === "FREE" ? "text-emerald-600" : "text-slate-800"}`}>
                        {slot.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">
                  Recent Activity · Yard Events
                </div>
                {events.length === 0 ? (
                  <div className="text-[11px] text-slate-500">No dock events yet</div>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto thin-scroll text-[11px]">
                    {events.map((e) => (
                      <li key={e.id} className="border-l-2 border-slate-200 pl-2">
                        <div className="flex justify-between gap-2">
                          <span className="font-mono-yms font-semibold text-slate-800">{e.event_type}</span>
                          <span className="text-slate-400 shrink-0">
                            {new Date(e.event_time).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {e.event_note && <div className="text-slate-500">{e.event_note}</div>}
                        {e.created_by && <div className="text-[10px] text-slate-400">by {e.created_by}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {row.currentVehicleId && (
                <button
                  type="button"
                  className="w-full text-[11px] text-slate-600 underline"
                  onClick={() => {
                    closeDock();
                    dock.openVehicle?.({
                      vehicleId: row.currentVehicleId,
                      appointmentId: row.appointmentId,
                      queueEntryId: row.queueEntryId,
                      onQueueUpdated: dock.onUpdated,
                    });
                  }}
                >
                  Open vehicle / queue view
                </button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">Dock not found</div>
          )}
          {working && (
            <div className="fixed bottom-4 right-4 bg-slate-900 text-white text-xs px-3 py-2 rounded-md flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Processing…
            </div>
          )}
        </SheetContent>
      </Sheet>
      <EditDockDialog open={editOpen} dock={row} onOpenChange={setEditOpen} onUpdated={afterAction} />
    </>
  );
};

export default DockDrawer;
