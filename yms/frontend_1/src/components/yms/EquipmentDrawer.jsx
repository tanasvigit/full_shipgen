import React, { useCallback, useEffect, useMemo, useState } from "react";
import useYmsSyncRefresh from "../../hooks/useYmsSyncRefresh";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";
import { toast } from "sonner";
import {
  Wrench,
  MapPin,
  BatteryFull,
  BatteryLow,
  Loader2,
  User,
  Warehouse,
  Truck,
  Calendar,
  Tag,
} from "lucide-react";
import equipmentApi, {
  BATTERY_BLOCK_ASSIGN_PCT,
  BATTERY_WARN_PCT,
  getEquipmentEvents,
} from "../../services/equipmentApi";
import CurrentAssignmentPanel from "./CurrentAssignmentPanel";
import useBundlePermissionFlags from "../../hooks/useBundlePermissionFlags";

export const EquipmentDrawer = () => {
  const { equipment, closeEquipment } = useUI();
  const { equipmentBundleOptions } = useBundlePermissionFlags();
  const open = !!equipment;
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
    if (!equipment?.equipmentId) return;
    setLoading(true);
    try {
      const bundle = await equipmentApi.fetchEquipmentBundle(equipmentBundleOptions);
      const found = bundle.rows.find((r) => r.equipmentId === equipment.equipmentId);
      setRow(found || null);
      setDocks(bundle.docks.filter((d) => d.status !== "MAINTENANCE" && d.status !== "BLOCKED"));
      setVehicles(bundle.vehicles.filter((v) => v.status !== "EXITED" && v.status !== "CANCELLED"));
      setQueue(bundle.queue || []);
      setAppointments(bundle.appointments || []);
      setEvents(getEquipmentEvents(bundle.events, equipment.equipmentId));
      if (found?.assignedDockId) setAssignDockId(found.assignedDockId);
      if (found?.assignedVehicleId) setAssignVehicleId(found.assignedVehicleId);
    } catch (e) {
      toast.error(e.message || "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }, [equipment?.equipmentId, equipmentBundleOptions]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useYmsSyncRefresh(refresh, open);

  const afterAction = async () => {
    await refresh();
    await equipment?.onUpdated?.();
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
  const vehicleLabel = (id) => vehicles.find((v) => v.id === id)?.vehicle_number || id;

  if (!open) return null;

  const canAssign =
    row && ["IDLE", "ASSIGNED"].includes(row.status) && !row.batteryBlocked;
  const canRelease =
    row && (row.assignedDockId || row.assignedVehicleId || ["ASSIGNED", "IN_USE"].includes(row.status));
  const inMaintenance = row?.status === "MAINTENANCE";

  const handleAssign = async () => {
    if (assignMode === "dock") {
      if (!assignDockId) {
        toast.error("Select a dock");
        return;
      }
      await run(
        () =>
          equipmentApi.assignToDock(row.equipmentId, assignDockId, {
            vehicleId: assignVehicleId || undefined,
          }),
        "Equipment assigned to dock"
      );
    } else if (assignMode === "vehicle") {
      if (!assignVehicleId) {
        toast.error("Select a vehicle");
        return;
      }
      await run(
        () =>
          equipmentApi.assignToVehicle(row.equipmentId, assignVehicleId, {
            dockId: assignDockId || undefined,
          }),
        "Equipment assigned to vehicle"
      );
    } else {
      const qe = activeQueueOptions.find((q) => q.id === assignQueueId);
      if (!qe) {
        toast.error("Select a queue entry");
        return;
      }
      const assignFn = qe.dock_id
        ? () =>
            equipmentApi.assignToDock(row.equipmentId, qe.dock_id, {
              vehicleId: qe.vehicle_id,
              queueEntryId: qe.id,
            })
        : () =>
            equipmentApi.assignToVehicle(row.equipmentId, qe.vehicle_id, {
              queueEntryId: qe.id,
            });
      await run(assignFn, "Equipment assigned via queue entry");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeEquipment()}>
      <SheetContent data-testid="equipment-drawer" className="w-full sm:max-w-md overflow-y-auto max-h-[100dvh] flex flex-col p-0">
        <SheetHeader>
          <SheetTitle className="font-display text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            {row?.name || "Equipment"}
          </SheetTitle>
        </SheetHeader>

        {loading && !row ? (
          <div className="py-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : row ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <StatusPill status={row.status} />
              <span className="font-mono-yms text-[11px] text-slate-500">{row.code}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                {row.type.replace(/_/g, " ")}
              </span>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                Equipment Information
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[12px] space-y-2">
                <div className="font-display font-bold text-slate-900">{row.name}</div>
                <div className="text-[10px] font-mono-yms text-slate-500">Code: {row.code}</div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Tag className="w-3.5 h-3.5 shrink-0" /> Type: {row.type.replace(/_/g, " ")}
                </div>
                <div className="text-slate-600">Model: {row.model}</div>
                {row.assetNumber !== "—" && (
                  <div className="text-slate-600">Asset: {row.assetNumber}</div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-3.5 h-3.5 shrink-0" /> Operator: {row.operator}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {row.location}
                </div>
                {row.remarks && (
                  <p className="text-slate-500 text-[11px] border-t border-slate-200 pt-2">{row.remarks}</p>
                )}
              </div>
            </div>

            {row.battery !== null && row.battery !== undefined && (
              <div className="border border-slate-200 rounded-md p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1">
                    {row.batteryLow ? (
                      <BatteryLow className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <BatteryFull className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    Battery Level
                  </span>
                  <span className={`font-mono-yms font-bold ${row.batteryLow ? "text-red-600" : "text-slate-800"}`}>
                    {row.battery}%
                    {row.batteryBlocked && (
                      <span className="text-red-600 font-normal ml-1">(cannot assign)</span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${row.batteryBlocked ? "bg-red-500" : row.batteryLow ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${row.battery}%` }}
                  />
                </div>
                {row.battery < BATTERY_WARN_PCT && (
                  <p className="text-[10px] text-amber-700 mt-1">Warning: battery below {BATTERY_WARN_PCT}%</p>
                )}
              </div>
            )}

            <CurrentAssignmentPanel
              testId="equipment-current-assignment"
              source={row}
              refs={{ docks, vehicles, queueEntries: queue, appointments }}
            />

            {canAssign && (
              <div className="space-y-2 border border-slate-200 rounded-md p-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Assign Equipment
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
                    data-testid="equipment-assign-dock"
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
                    data-testid="equipment-assign-vehicle"
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
                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm"
                    value={assignQueueId}
                    onChange={(e) => setAssignQueueId(e.target.value)}
                    disabled={working}
                  >
                    <option value="">Select queue entry…</option>
                    {activeQueueOptions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.queue_number} · {q.status}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  data-testid="equipment-assign-submit"
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
                  disabled={working}
                  className="py-2 border border-slate-300 text-xs font-semibold rounded-md"
                  onClick={() => run(() => equipmentApi.release(row.equipmentId), "Released")}
                >
                  Release
                </button>
              )}
              {row.status === "ASSIGNED" && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-slate-300 text-xs font-semibold rounded-md"
                  onClick={() => run(() => equipmentApi.markInUse(row.equipmentId), "Marked in use")}
                >
                  Mark in use
                </button>
              )}
              {!inMaintenance && row.status !== "CHARGING" && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-amber-300 text-amber-800 text-xs font-semibold rounded-md"
                  onClick={() => run(() => equipmentApi.markMaintenance(row.equipmentId), "Sent to maintenance")}
                >
                  Maintenance
                </button>
              )}
              {inMaintenance && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-md"
                  onClick={() =>
                    run(() => equipmentApi.completeMaintenance(row.equipmentId), "Maintenance complete")
                  }
                >
                  Complete maint.
                </button>
              )}
              {row.status !== "CHARGING" && !inMaintenance && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-amber-200 text-xs font-semibold rounded-md"
                  onClick={() => run(() => equipmentApi.markCharging(row.equipmentId), "Charging")}
                >
                  Charging
                </button>
              )}
              {["IN_USE", "ASSIGNED"].includes(row.status) && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-slate-300 text-xs font-semibold rounded-md"
                  onClick={() => run(() => equipmentApi.markIdle(row.equipmentId), "Marked idle")}
                >
                  Mark idle
                </button>
              )}
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                Recent Activity · Yard Events
              </div>
              {events.length === 0 ? (
                <p className="text-[11px] text-slate-500">No equipment events yet.</p>
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
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">Equipment not found</div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EquipmentDrawer;
