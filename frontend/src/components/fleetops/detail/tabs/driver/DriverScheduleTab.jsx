import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/loaders";
import { fleetopsService } from "@/services/fleetops";
import SetDriverAvailabilityDialog from "@/components/fleetops/driver/SetDriverAvailabilityDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { Plus } from "lucide-react";

export default function DriverScheduleTab({ driverId, enabled }) {
  const [items, setItems] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [hos, setHos] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availOpen, setAvailOpen] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !driverId) return;
    setLoading(true);
    try {
      const [scheduleItems, avails, hosStatus, shift] = await Promise.all([
        fleetopsService.listDriverScheduleItems(driverId),
        fleetopsService.listDriverAvailabilities(driverId),
        fleetopsService.getDriverHosStatus(driverId).catch(() => null),
        fleetopsService.getDriverActiveShift(driverId).catch(() => null),
      ]);
      setItems(scheduleItems);
      setAvailabilities(avails);
      setHos(hosStatus);
      setActiveShift(shift);
    } finally {
      setLoading(false);
    }
  }, [driverId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const weekPreview = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (!items?.length) {
      return days.map((day, i) => ({ day, text: i < 5 ? "No shifts" : "Off" }));
    }
    return days.map((day) => ({
      day,
      text: `${items.filter((it) => String(it.weekday || it.day || "").toLowerCase().startsWith(day.toLowerCase().slice(0, 3))).length || items.length} item(s)`,
    }));
  }, [items]);

  if (loading) {
    return (
      <div className="p-4">
        <TableSkeleton rows={3} testId="driver-schedule-skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" data-testid="driver-schedule-tab">
      <div className="flex flex-wrap gap-2 items-center">
        {hos && (
          <StatusBadge
            status={hos.status || hos.duty_status || "unknown"}
            label={`HOS: ${hos.status || hos.duty_status || "—"}`}
          />
        )}
        {activeShift && (
          <span className="text-xs font-mono text-[#374151]" data-testid="driver-active-shift">
            Active shift: {activeShift.title || activeShift.name || activeShift.start_at || "on duty"}
          </span>
        )}
        <Button size="sm" variant="outline" className="ml-auto h-8" onClick={() => setAvailOpen(true)} data-testid="driver-set-availability">
          <Plus className="h-3.5 w-3.5 mr-1" /> Set availability
        </Button>
      </div>

      <div className="bg-white border border-black/[0.08] rounded-md p-5 grid grid-cols-7 gap-2 text-xs">
        {weekPreview.map(({ day, text }, i) => (
          <div
            key={day}
            className={`border border-black/[0.08] rounded-sm p-3 ${i < 5 ? "bg-blue-500/5" : "bg-[#F1F2F5]/40"}`}
          >
            <div className="overline">{day}</div>
            <div className="font-mono text-[#1F2937] mt-2">{text}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        <div className="px-4 py-2 overline bg-[#F5F6F8]">Schedule items</div>
        {!items?.length ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">No schedule items from driver API.</div>
        ) : (
          items.map((item) => (
            <div key={item.id || item.uuid} className="px-4 py-3 text-sm">
              <div className="font-medium">{item.title || item.name || "Shift"}</div>
              <div className="text-xs font-mono text-[#4B5563] mt-1">
                {item.start_at || item.starts_at || "—"} → {item.end_at || item.ends_at || "—"}
              </div>
            </div>
          ))
        )}
      </div>

      {availabilities.length > 0 && (
        <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
          <div className="px-4 py-2 overline bg-[#F5F6F8]">Availabilities</div>
          {availabilities.map((a) => (
            <div key={a.id || a.uuid} className="px-4 py-3 text-sm font-mono text-xs">
              {a.start_at || a.starts_at} → {a.end_at || a.ends_at}
            </div>
          ))}
        </div>
      )}

      <SetDriverAvailabilityDialog open={availOpen} onOpenChange={setAvailOpen} driverId={driverId} onSaved={load} />
    </div>
  );
}
