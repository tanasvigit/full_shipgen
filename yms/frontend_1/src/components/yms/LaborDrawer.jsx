import React, { useCallback, useEffect, useMemo, useState } from "react";
import useYmsSyncRefresh from "../../hooks/useYmsSyncRefresh";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";
import { toast } from "sonner";
import {
  HardHat,
  Clock,
  Users,
  MapPin,
  Loader2,
  Warehouse,
  User,
  Phone,
  Truck,
  Calendar,
  Tag,
} from "lucide-react";
import laborApi from "../../services/laborApi";
import CurrentAssignmentPanel from "./CurrentAssignmentPanel";
import YmsDrawerTopBar from "./YmsDrawerTopBar";
import YmsDrawerBody, { YMS_DRAWER_LOADING_CLASS } from "./YmsDrawerBody";
import useBundlePermissionFlags from "../../hooks/useBundlePermissionFlags";

export const LaborDrawer = () => {
  const { labor, closeLabor } = useUI();
  const { laborBundleOptions } = useBundlePermissionFlags();
  const open = !!labor;
  const [row, setRow] = useState(null);
  const [events, setEvents] = useState([]);
  const [docks, setDocks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [assignDockId, setAssignDockId] = useState("");
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [assignQueueId, setAssignQueueId] = useState("");
  const [assignMode, setAssignMode] = useState("dock");

  const refresh = useCallback(async () => {
    if (!labor?.laborId) return;
    setLoading(true);
    try {
      const bundle = await laborApi.fetchLaborBundle(laborBundleOptions);
      const found = bundle.rows.find((r) => r.laborId === labor.laborId);
      setRow(found || null);
      setDocks(bundle.docks.filter((d) => d.status !== "MAINTENANCE" && d.status !== "BLOCKED"));
      setVehicles(bundle.vehicles.filter((v) => v.status !== "EXITED" && v.status !== "CANCELLED"));
      setQueue(bundle.queue || []);
      setAppointments(bundle.appointments || []);
      setEvents(laborApi.getLaborEvents(bundle.events, labor.laborId));
      if (found?.assignedDockId) setAssignDockId(found.assignedDockId);
      if (found?.assignedVehicleId) setAssignVehicleId(found.assignedVehicleId);
    } catch (e) {
      toast.error(e.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [labor?.laborId, laborBundleOptions]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useYmsSyncRefresh(refresh, open);

  const afterAction = async () => {
    await refresh();
    await labor?.onUpdated?.();
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

  const activeQueueOptions = useMemo(
    () =>
      (queue || []).filter((q) =>
        ["WAITING", "CALLED", "DOCK_ASSIGNED", "LOADING"].includes(q.status)
      ),
    [queue]
  );

  const dockLabel = (id) => docks.find((d) => d.id === id)?.dock_code || id;
  const vehicleLabel = (id) =>
    vehicles.find((v) => v.id === id)?.vehicle_number || id;

  if (!open) return null;

  const canAssign = row && ["ON_DUTY", "AVAILABLE", "ASSIGNED"].includes(row.status);
  const canRelease = row && (row.assignedDockId || row.assignedVehicleId || row.status === "ASSIGNED");
  const onBreak = row?.status === "BREAK";
  const isAssigned = row?.status === "ASSIGNED";

  const handleAssign = async () => {
    if (assignMode === "dock") {
      if (!assignDockId) {
        toast.error("Select a dock");
        return;
      }
      await run(
        () =>
          laborApi.assignToDock(row.laborId, assignDockId, {
            vehicleId: assignVehicleId || undefined,
          }),
        "Team assigned to dock"
      );
    } else if (assignMode === "vehicle") {
      if (!assignVehicleId) {
        toast.error("Select a vehicle");
        return;
      }
      await run(
        () =>
          laborApi.assignToVehicle(row.laborId, assignVehicleId, {
            dockId: assignDockId || undefined,
          }),
        "Team assigned to vehicle"
      );
    } else {
      const qe = activeQueueOptions.find((q) => q.id === assignQueueId);
      if (!qe) {
        toast.error("Select a queue entry");
        return;
      }
      const assignFn = qe.dock_id
        ? () =>
            laborApi.assignToDock(row.laborId, qe.dock_id, {
              vehicleId: qe.vehicle_id,
              queueEntryId: qe.id,
              assignment: `Queue ${qe.queue_number}`,
            })
        : () =>
            laborApi.assignToVehicle(row.laborId, qe.vehicle_id, {
              queueEntryId: qe.id,
              assignment: `Queue ${qe.queue_number}`,
            });
      await run(assignFn, "Team assigned via queue entry");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeLabor()}>
      <SheetContent data-testid="labor-drawer" hideClose className="w-full sm:max-w-md overflow-y-auto max-h-[100dvh] flex flex-col p-0">
        <YmsDrawerTopBar>
          <SheetHeader className="p-0 text-left space-y-1">
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <HardHat className="w-5 h-5" />
              {row?.name || "Labor team"}
            </SheetTitle>
          </SheetHeader>
        </YmsDrawerTopBar>

        {loading && !row ? (
          <div className={`${YMS_DRAWER_LOADING_CLASS} flex items-center justify-center gap-2`}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : row ? (
          <YmsDrawerBody>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <StatusPill status={row.status} />
              <span className="font-mono-yms text-[11px] text-slate-500">{row.code}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                {row.materialType.replace(/_/g, " ")}
              </span>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                Team Information
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[12px] space-y-2">
                <div className="font-display font-bold text-slate-900">{row.name}</div>
                <div className="text-[10px] font-mono-yms text-slate-500">Team code: {row.code}</div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Tag className="w-3.5 h-3.5 shrink-0" /> Material: {row.materialType.replace(/_/g, " ")}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 shrink-0" /> Shift: {row.shift}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-3.5 h-3.5 shrink-0" /> Supervisor: {row.supervisor}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 shrink-0" /> {row.supervisorPhone}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  {row.members} members · {row.available} available · {row.assignedCount} assigned
                </div>
                {row.remarks && (
                  <p className="text-slate-500 text-[11px] border-t border-slate-200 pt-2">{row.remarks}</p>
                )}
              </div>
            </div>

            <CurrentAssignmentPanel
              testId="labor-current-assignment"
              source={row}
              refs={{ docks, vehicles, queueEntries: queue, appointments }}
            />
            {isAssigned && (
              <p className="text-[10px] text-slate-500 -mt-2">
                Auto-released when loading completes or dock is released.
              </p>
            )}

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="uppercase tracking-wider font-semibold text-slate-500">Utilization</span>
                <span className="font-mono-yms font-bold">{row.utilPct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                <div className="h-full bg-slate-900" style={{ width: `${row.utilPct}%` }} />
              </div>
            </div>

            {canAssign && (
              <div className="space-y-2 border border-slate-200 rounded-md p-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Assign Team
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { id: "dock", label: "Dock" },
                    { id: "vehicle", label: "Vehicle" },
                    { id: "queue", label: "Queue entry" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAssignMode(m.id)}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-sm border ${
                        assignMode === m.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {assignMode === "dock" && (
                  <select
                    data-testid="labor-assign-dock"
                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm"
                    value={assignDockId}
                    onChange={(e) => setAssignDockId(e.target.value)}
                    disabled={working}
                  >
                    <option value="">Select dock…</option>
                    {docks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.dock_code} — {d.dock_name}
                      </option>
                    ))}
                  </select>
                )}

                {assignMode === "vehicle" && (
                  <select
                    data-testid="labor-assign-vehicle"
                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm"
                    value={assignVehicleId}
                    onChange={(e) => setAssignVehicleId(e.target.value)}
                    disabled={working}
                  >
                    <option value="">Select vehicle…</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} — {v.status}
                      </option>
                    ))}
                  </select>
                )}

                {assignMode === "queue" && (
                  <select
                    data-testid="labor-assign-queue"
                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm"
                    value={assignQueueId}
                    onChange={(e) => setAssignQueueId(e.target.value)}
                    disabled={working}
                  >
                    <option value="">Select queue entry…</option>
                    {activeQueueOptions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.queue_number} · {q.status}
                        {q.dock_id ? ` · dock linked` : ""}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  data-testid="labor-assign-submit"
                  disabled={working}
                  className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-md disabled:opacity-50"
                  onClick={handleAssign}
                >
                  Confirm assignment
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {canRelease && (
                <button
                  type="button"
                  data-testid="labor-release-btn"
                  disabled={working}
                  className="py-2 border border-slate-300 text-xs font-semibold rounded-md"
                  onClick={() => run(() => laborApi.release(row.laborId), "Team released")}
                >
                  Release
                </button>
              )}
              {row.status === "OFF_DUTY" && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-md"
                  onClick={() => run(() => laborApi.markOnDuty(row.laborId), "On duty")}
                >
                  On duty
                </button>
              )}
              {row.status !== "OFF_DUTY" && row.status !== "UNAVAILABLE" && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-slate-300 text-xs font-semibold rounded-md"
                  onClick={() => run(() => laborApi.markOffDuty(row.laborId), "Off duty")}
                >
                  Off duty
                </button>
              )}
              {!onBreak && ["ON_DUTY", "ASSIGNED", "AVAILABLE"].includes(row.status) && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-amber-300 text-amber-800 text-xs font-semibold rounded-md"
                  onClick={() => run(() => laborApi.markBreak(row.laborId), "On break")}
                >
                  Break
                </button>
              )}
              {onBreak && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-md"
                  onClick={() => run(() => laborApi.endBreak(row.laborId), "Break ended")}
                >
                  End break
                </button>
              )}
              {row.status !== "UNAVAILABLE" && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-red-200 text-red-800 text-xs font-semibold rounded-md"
                  onClick={() => run(() => laborApi.markUnavailable(row.laborId), "Unavailable")}
                >
                  Unavailable
                </button>
              )}
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                Activity History · Recent Yard Events
              </div>
              {events.length === 0 ? (
                <p className="text-[11px] text-slate-500">No team events yet.</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {events.map((ev) => (
                    <li key={ev.id} className="text-[11px] border-l-2 border-slate-200 pl-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-yms text-slate-800 font-semibold">{ev.event_type}</span>
                        <span className="text-slate-400 shrink-0">
                          {new Date(ev.event_time).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {ev.event_note && <div className="text-slate-500 mt-0.5">{ev.event_note}</div>}
                      {ev.created_by && (
                        <div className="text-[10px] text-slate-400">by {ev.created_by}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </YmsDrawerBody>
        ) : (
          <div className={YMS_DRAWER_LOADING_CLASS}>Team not found</div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default LaborDrawer;
