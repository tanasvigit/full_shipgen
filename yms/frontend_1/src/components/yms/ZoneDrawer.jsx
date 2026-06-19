import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import StatusPill from "./StatusPill";
import { toast } from "sonner";
import {
  MapPin, Pencil, Trash2, Truck, Activity, Gauge, Loader2,
} from "lucide-react";
import yardZonesApi from "../../services/yardZonesApi";
import { useUI } from "../../contexts/UIContext";
import ZoneDetailBadge from "./ZoneDetailBadge";

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{label}</span>
    <span className={`text-[12.5px] font-semibold text-slate-900 ${mono ? "font-mono-yms" : ""}`}>{value}</span>
  </div>
);

export const ZoneDrawer = ({ zoneId, open, onOpenChange, onEdit, onDeleted, recentEvents = [] }) => {
  const { openVehicle } = useUI();
  const [zone, setZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const data = await yardZonesApi.getZone(zoneId);
      setZone(data);
    } catch (e) {
      toast.error(e.message || "Failed to load zone");
      setZone(null);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    if (open && zoneId) load();
  }, [open, zoneId, load]);

  const zoneEvents = useMemo(() => {
    if (!zone || !recentEvents.length) return [];
    const vehicleIds = new Set((zone.vehiclesPresent || []).map((v) => v.id));
    return recentEvents
      .filter(
        (e) =>
          vehicleIds.has(e.vehicle_id) ||
          (e.event_note || "").includes(zone.zoneCode) ||
          ["ZONE_CREATED", "ZONE_UPDATED", "ZONE_DELETED", "ZONE_STATUS_CHANGED"].includes(e.event_type)
      )
      .slice(0, 10);
  }, [zone, recentEvents]);

  const handleDelete = async () => {
    if (!zone?.id) return;
    if (zone.isMandatory) {
      toast.error("Mandatory system zones cannot be deleted");
      return;
    }
    if (!window.confirm(`Delete zone "${zone.name}" (${zone.zoneCode})?`)) return;
    setDeleting(true);
    try {
      await yardZonesApi.deleteZone(zone.id);
      toast.success("Zone deleted");
      onOpenChange(false);
      await onDeleted?.();
    } catch (e) {
      toast.error(e.message || "Cannot delete zone");
    } finally {
      setDeleting(false);
    }
  };

  const utilization = zone?.pct ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-testid="zone-drawer"
        side="right"
        className="w-full sm:max-w-md p-0 overflow-y-auto thin-scroll bg-white border-l border-slate-200"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{zone?.name || "Zone"}</SheetTitle>
        </SheetHeader>

        <div className="bg-slate-900 text-white px-5 py-5">
          <div className="flex items-center gap-3">
            <ZoneDetailBadge zone={zone} size="sm" className="mx-0 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg font-bold leading-tight truncate">{zone?.name || "—"}</div>
              <div className="font-mono-yms text-[11px] text-slate-400 mt-0.5">{zone?.zoneCode || "—"}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <StatusPill status={zone?.status || "ACTIVE"} />
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              {(zone?.zoneType || "").replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {loading && (
          <div className="px-5 py-8 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading zone…
          </div>
        )}

        {zone && !loading && (
          <>
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Capacity
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-md p-2">
                  <div className="font-mono-yms text-xl font-bold">{zone.occupied}</div>
                  <div className="text-[9px] uppercase text-slate-500">Occupied</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-2">
                  <div className="font-mono-yms text-xl font-bold">{zone.availableSlots}</div>
                  <div className="text-[9px] uppercase text-slate-500">Available</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-2">
                  <div className="font-mono-yms text-xl font-bold">{zone.capacity}</div>
                  <div className="text-[9px] uppercase text-slate-500">Max</div>
                </div>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-sm overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${utilization}%`,
                    background: utilization > 85 ? "#DC2626" : utilization > 65 ? "#D97706" : zone.color,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1 text-right font-mono-yms">{utilization}% utilization</div>
            </div>

            <div className="px-5 py-3 border-b border-slate-200">
              <InfoRow label="Zone Type" value={(zone.zoneType || "").replace(/_/g, " ")} />
              <InfoRow label="Occupancy" value={`${zone.occupied} / ${zone.capacity}`} mono />
              <InfoRow label="Available Slots" value={zone.availableSlots} mono />
              {zone.description && <InfoRow label="Description" value={zone.description} />}
              {zone.remarks && <InfoRow label="Remarks" value={zone.remarks} />}
            </div>

            <div className="px-5 py-3 border-b border-slate-200">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                Vehicles Present ({zone.vehiclesPresent?.length || 0})
              </div>
              {(zone.vehiclesPresent || []).length === 0 ? (
                <p className="text-[11px] text-slate-500">No vehicles in this zone</p>
              ) : (
                <div className="space-y-1 max-h-[160px] overflow-y-auto thin-scroll">
                  {zone.vehiclesPresent.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        openVehicle({
                          vehicleId: v.id,
                          onQueueUpdated: () => load(),
                        })
                      }
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono-yms text-[12px] font-semibold">{v.vehicle_number}</span>
                      <StatusPill status={v.status} className="ml-auto scale-90" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-b border-slate-200">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Recent Activity
              </div>
              {zoneEvents.length === 0 ? (
                <p className="text-[11px] text-slate-500">No recent events</p>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto thin-scroll">
                  {zoneEvents.map((ev) => (
                    <div key={ev.id} className="text-[11px] border-b border-slate-50 pb-1">
                      <div className="font-mono-yms text-slate-800">{ev.event_type}</div>
                      <div className="text-slate-500">
                        {new Date(ev.event_time).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {ev.event_note ? ` — ${ev.event_note}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 sticky bottom-0 bg-white border-t border-slate-200 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onEdit?.(zone)}
                className="inline-flex items-center justify-center gap-1.5 border border-slate-300 text-slate-700 text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-md hover:bg-slate-50"
              >
                <Pencil className="w-3 h-3" /> Edit Zone
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || zone.isMandatory}
                className="inline-flex items-center justify-center gap-1.5 border border-red-300 text-red-700 text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-md hover:bg-red-50 disabled:opacity-40"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ZoneDrawer;
