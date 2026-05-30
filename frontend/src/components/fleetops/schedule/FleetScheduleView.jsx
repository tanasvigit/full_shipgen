import { useCallback, useEffect, useMemo, useState } from "react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapOrder } from "@/lib/mappers";
import { suggestBestDriverForOrder } from "@/lib/fleetops/allocation";
import OrderScheduleDialog from "@/components/fleetops/orders/modals/OrderScheduleDialog";
import SchedulingConflictDialog from "@/components/fleetops/schedule/SchedulingConflictDialog";
import { detectScheduleConflicts } from "@/lib/fleetops/scheduleConflicts";
import { schedulesService } from "@/services/schedules";
import { toast } from "sonner";
import { Calendar, Sparkles, Truck } from "lucide-react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);

export default function FleetScheduleView({ weekOffset = 0 }) {
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [conflictOpen, setConflictOpen] = useState(false);

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [rawDrivers, rawOrders, rawItems] = await Promise.all([
        fleetopsService.listDrivers(),
        fleetopsService.listOrders({ without_driver: 1, limit: 100 }),
        schedulesService.listScheduleItems().catch(() => []),
      ]);
      setDrivers(rawDrivers.map(mapDriverRow));
      setOrders(rawOrders.map(mapOrder));
      setItems(Array.isArray(rawItems) ? rawItems : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, weekOffset]);

  const selectedIds = [...selectedOrderIds];

  const ordersByDay = useMemo(() => {
    const map = {};
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      map[key] = orders.filter((o) => {
        const sched = o.scheduledAt || o.scheduled_at;
        if (!sched) return key === format(new Date(), "yyyy-MM-dd");
        return String(sched).slice(0, 10) === key;
      });
    }
    return map;
  }, [orders, days]);

  const handleBestFit = async () => {
    if (!selectedIds.length) {
      toast.error("Select orders first");
      return;
    }
    let assigned = 0;
    for (const oid of selectedIds) {
      const order = orders.find((o) => o.id === oid || o.publicId === oid);
      if (!order) continue;
      const best = await suggestBestDriverForOrder(order, drivers);
      if (!best) continue;
      try {
        await fleetopsService.patchOrder(order.id, {
          driver_assigned_uuid: best.id || best.uuid,
        });
        assigned += 1;
      } catch {
        /* skip */
      }
    }
    toast.success(`Best-fit assigned ${assigned} order(s)`);
    await reload();
  };

  const handleBulkSchedule = async () => {
    const draft = {
      driver_uuid: drivers[0]?.id,
      weekday: "Mon",
      start_hour: 8,
      end_hour: 17,
    };
    const found = detectScheduleConflicts(items, draft);
    if (found.length) {
      setConflicts(found);
      setConflictOpen(true);
      return;
    }
    setScheduleOpen(true);
  };

  if (loading) {
    return <div className="p-4 text-sm text-[#4B5563]" data-testid="fleet-schedule-loading">Loading fleet schedule…</div>;
  }

  return (
    <div className="space-y-4" data-testid="fleet-schedule-view">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!selectedIds.length} onClick={handleBestFit} data-testid="fleet-schedule-best-fit">
          <Sparkles className="h-3.5 w-3.5 mr-1" /> Best-fit driver
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!selectedIds.length} onClick={handleBulkSchedule} data-testid="fleet-schedule-bulk">
          <Calendar className="h-3.5 w-3.5 mr-1" /> Bulk schedule
        </Button>
        <span className="text-xs text-[#6B7280] self-center">{drivers.length} drivers · {orders.length} unassigned orders</span>
      </div>

      <div className="overflow-x-auto border border-black/[0.08] rounded-md bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black/[0.08] bg-[#F5F6F8]">
              <th className="text-left px-3 py-2 font-mono uppercase tracking-wider text-[#4B5563] sticky left-0 bg-[#F5F6F8]">Driver</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="text-center px-2 py-2 font-mono text-[#4B5563] min-w-[120px]">
                  {format(d, "EEE d")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id} className="border-b border-black/[0.05]" data-testid={`fleet-schedule-driver-${driver.id}`}>
                <td className="px-3 py-2 sticky left-0 bg-white font-medium whitespace-nowrap">
                  <Truck className="h-3 w-3 inline mr-1 text-[#0066FF]" />
                  {driver.name}
                </td>
                {days.map((d) => {
                  const key = format(d, "yyyy-MM-dd");
                  const dayOrders = ordersByDay[key] || [];
                  return (
                    <td key={key} className="px-1 py-1 align-top">
                      <div className="space-y-1 min-h-[48px]">
                        {dayOrders.slice(0, 4).map((o) => (
                          <label
                            key={o.id}
                            className="flex items-center gap-1 px-1.5 py-1 rounded bg-[#EEF0F4] hover:bg-[#E0E7FF] cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedOrderIds.has(o.id)}
                              onCheckedChange={(v) => {
                                const next = new Set(selectedOrderIds);
                                if (v) next.add(o.id);
                                else next.delete(o.id);
                                setSelectedOrderIds(next);
                              }}
                            />
                            <span className="font-mono truncate">{o.publicId}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OrderScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        orderIds={selectedIds}
        onScheduled={async () => {
          setSelectedOrderIds(new Set());
          await reload();
        }}
      />

      <SchedulingConflictDialog open={conflictOpen} onOpenChange={setConflictOpen} conflicts={conflicts} />
    </div>
  );
}
