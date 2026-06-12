import { useCallback, useEffect, useMemo, useState } from "react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapOrder } from "@/lib/mappers";
import { bestFitDriversToOrders } from "@/lib/fleetops/allocation";
import OrderScheduleDialog from "@/components/fleetops/orders/modals/OrderScheduleDialog";
import { toast } from "sonner";
import { Calendar, Sparkles, Truck, Package } from "lucide-react";

function orderScheduledDay(order) {
  const raw = order?.scheduledAt;
  if (!raw) return null;
  return String(raw).slice(0, 10);
}

function OrderChip({ order, selectedOrderIds, setSelectedOrderIds }) {
  return (
    <label
      key={order.id}
      className="flex items-center gap-1 px-1.5 py-1 rounded bg-[#EEF0F4] hover:bg-[#E0E7FF] cursor-pointer"
    >
      <Checkbox
        checked={selectedOrderIds.has(order.id)}
        onCheckedChange={(v) => {
          const next = new Set(selectedOrderIds);
          if (v) next.add(order.id);
          else next.delete(order.id);
          setSelectedOrderIds(next);
        }}
      />
      <span className="font-mono truncate">{order.publicId}</span>
    </label>
  );
}

export default function FleetScheduleView({ weekOffset = 0, refreshKey = 0 }) {
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  );
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekRange = useMemo(
    () => `${format(weekStart, "yyyy-MM-dd")},${format(weekEnd, "yyyy-MM-dd")}`,
    [weekStart, weekEnd],
  );
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [rawDrivers, weekOrders, unassignedOrders] = await Promise.all([
        fleetopsService.listDrivers(),
        fleetopsService.listOrders({
          scheduled_at: weekRange,
          "filter[scheduled_at]": weekRange,
          limit: 200,
        }),
        fleetopsService.listOrders({
          without_driver: 1,
          "filter[without_driver]": 1,
          limit: 100,
        }),
      ]);
      const merged = new Map();
      for (const raw of [...weekOrders, ...unassignedOrders]) {
        const mapped = mapOrder(raw);
        merged.set(mapped.id, mapped);
      }
      setDrivers(rawDrivers.map(mapDriverRow));
      setOrders([...merged.values()]);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load fleet schedule.");
      setDrivers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [weekRange]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  const selectedIds = [...selectedOrderIds];

  const unassignedByDay = useMemo(() => {
    const map = {};
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      map[key] = orders.filter((o) => {
        if (o.driverId) return false;
        const sched = orderScheduledDay(o);
        if (!sched) return key === format(days[0], "yyyy-MM-dd");
        return sched === key;
      });
    }
    return map;
  }, [orders, days]);

  const assignedByDriverDay = useMemo(() => {
    const map = {};
    for (const driver of drivers) {
      map[driver.id] = {};
      for (const day of days) {
        const key = format(day, "yyyy-MM-dd");
        map[driver.id][key] = orders.filter((o) => {
          if (String(o.driverId || "") !== String(driver.id)) return false;
          const sched = orderScheduledDay(o);
          if (!sched) return false;
          return sched === key;
        });
      }
    }
    return map;
  }, [orders, drivers, days]);

  const handleBestFit = async () => {
    if (!selectedIds.length) {
      toast.error("Select orders first");
      return;
    }
    setAssigning(true);
    try {
      const orderPublicIds = selectedIds
        .map((oid) => {
          const order = orders.find((o) => o.id === oid || o.publicId === oid);
          return order?.publicId || order?.public_id || oid;
        })
        .filter(Boolean);

      const driverPublicIds = drivers.map((d) => d.publicId || d.public_id || d.id).filter(Boolean);

      const result = await bestFitDriversToOrders({
        orderIds: orderPublicIds,
        driverIds: driverPublicIds,
        apply: true,
      });

      const assigned = result?.summary?.applied ?? result?.assignments?.length ?? 0;
      const unassigned = Array.isArray(result?.unassigned) ? result.unassigned.length : 0;

      if (assigned > 0) {
        toast.success(`Best-fit assigned ${assigned} order(s)`);
      }
      if (unassigned > 0) {
        toast.message(`${unassigned} order(s) could not be assigned — no eligible driver on shift`);
      }
      if (assigned === 0 && unassigned === 0) {
        toast.message("No orders were assigned");
      }

      setSelectedOrderIds(new Set());
      await reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || err?.message || "Best-fit assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-[#4B5563]" data-testid="fleet-schedule-loading">Loading fleet schedule…</div>;
  }

  return (
    <div className="space-y-4" data-testid="fleet-schedule-view">
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!selectedIds.length || assigning}
          onClick={handleBestFit}
          data-testid="fleet-schedule-best-fit"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" /> {assigning ? "Assigning…" : "Best-fit driver"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!selectedIds.length}
          onClick={() => setScheduleOpen(true)}
          data-testid="fleet-schedule-bulk"
        >
          <Calendar className="h-3.5 w-3.5 mr-1" /> Bulk schedule
        </Button>
        <span className="text-xs text-[#6B7280] self-center">
          {drivers.length} drivers · {orders.length} unassigned orders · {weekLabel}
        </span>
      </div>

      <div className="overflow-x-auto border border-black/[0.08] rounded-md bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black/[0.08] bg-[#F5F6F8]">
              <th className="text-left px-3 py-2 font-mono uppercase tracking-wider text-[#4B5563] sticky left-0 bg-[#F5F6F8] min-w-[160px]">
                Resource
              </th>
              {days.map((d) => (
                <th key={d.toISOString()} className="text-center px-2 py-2 font-mono text-[#4B5563] min-w-[120px]">
                  {format(d, "EEE d")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/[0.08] bg-[#FFFBEB]/40" data-testid="fleet-schedule-unassigned-row">
              <td className="px-3 py-2 sticky left-0 bg-[#FFFBEB]/40 font-medium whitespace-nowrap">
                <Package className="h-3 w-3 inline mr-1 text-[#A16207]" />
                Unassigned
              </td>
              {days.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const dayOrders = unassignedByDay[key] || [];
                return (
                  <td key={key} className="px-1 py-1 align-top">
                    <div className="space-y-1 min-h-[48px]">
                      {dayOrders.length === 0 ? (
                        <div className="h-12 mx-1 border border-dashed border-black/[0.08] rounded-sm grid place-items-center text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">
                          —
                        </div>
                      ) : (
                        dayOrders.slice(0, 6).map((o) => (
                          <OrderChip
                            key={o.id}
                            order={o}
                            selectedOrderIds={selectedOrderIds}
                            setSelectedOrderIds={setSelectedOrderIds}
                          />
                        ))
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
            {drivers.map((driver) => (
              <tr key={driver.id} className="border-b border-black/[0.05]" data-testid={`fleet-schedule-driver-${driver.id}`}>
                <td className="px-3 py-2 sticky left-0 bg-white font-medium whitespace-nowrap">
                  <Truck className="h-3 w-3 inline mr-1 text-[#0066FF]" />
                  {driver.name}
                </td>
                {days.map((d) => {
                  const key = format(d, "yyyy-MM-dd");
                  const dayOrders = assignedByDriverDay[driver.id]?.[key] || [];
                  return (
                    <td key={key} className="px-1 py-1 align-top">
                      <div className="space-y-1 min-h-[48px]">
                        {dayOrders.slice(0, 4).map((o) => (
                          <OrderChip
                            key={o.id}
                            order={o}
                            selectedOrderIds={selectedOrderIds}
                            setSelectedOrderIds={setSelectedOrderIds}
                          />
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

      <p className="text-[11px] font-mono text-[#6B7280]">
        Unscheduled orders appear under the first day of the week. After bulk schedule, they move to the chosen date column.
      </p>

      <OrderScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        orderIds={selectedIds}
        onScheduled={async () => {
          setSelectedOrderIds(new Set());
          await reload();
        }}
      />
    </div>
  );
}
