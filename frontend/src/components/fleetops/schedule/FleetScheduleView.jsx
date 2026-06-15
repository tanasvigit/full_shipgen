import { useCallback, useEffect, useMemo, useState } from "react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapOrder } from "@/lib/mappers";
import { bestFitDriversToOrders } from "@/lib/fleetops/allocation";
import {
  buildFleetScheduleOrderMap,
  fleetScheduleWeekRange,
  isUnassignedFleetOrder,
  orderScheduledDayKey,
  patchOrdersWithSchedule,
  summarizeBestFitResult,
} from "@/lib/fleetops/fleetScheduleHelpers";
import OrderScheduleDialog from "@/components/fleetops/orders/modals/OrderScheduleDialog";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import { toast } from "sonner";
import { Calendar, Sparkles, Truck, Package } from "lucide-react";

function OrderChip({ order, selectedOrderIds, setSelectedOrderIds, selectable = true, variant = "unassigned" }) {
  if (!selectable) {
    return (
      <div
        className={`px-1.5 py-1 rounded font-mono truncate text-[10px] border ${
          variant === "assigned"
            ? "bg-[#EEF2FF] border-[#0066FF]/20 text-[#0040CC]"
            : "bg-[#F1F2F5] border-black/[0.06] text-[#374151]"
        }`}
        title={order.publicId}
      >
        {order.publicId}
      </div>
    );
  }

  const selected = selectedOrderIds?.has(order.id) ?? false;

  return (
    <label className="flex items-center gap-1 px-1.5 py-1 rounded bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A]/80 cursor-pointer">
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => {
          const next = new Set(selectedOrderIds);
          if (v) next.add(order.id);
          else next.delete(order.id);
          setSelectedOrderIds(next);
        }}
      />
      <span className="font-mono truncate text-[10px]">{order.publicId}</span>
    </label>
  );
}

export default function FleetScheduleView({ weekOffset = 0, refreshKey = 0 }) {
  const { openDetail: openOrderDetail } = useFleetopsDetailDrawer("order");
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
  const weekRange = useMemo(() => fleetScheduleWeekRange(weekStart, weekEnd), [weekStart, weekEnd]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
  const defaultScheduleDate = format(weekStart, "yyyy-MM-dd");

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
      const merged = buildFleetScheduleOrderMap(unassignedOrders, weekOrders, mapOrder);
      setDrivers(rawDrivers.map(mapDriverRow));
      setOrders([...merged.values()]);
      setSelectedOrderIds((prev) => {
        const next = new Set();
        for (const id of prev) {
          const order = merged.get(id);
          if (order && isUnassignedFleetOrder(order)) next.add(id);
        }
        return next;
      });
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

  const unassignedOrders = useMemo(() => orders.filter(isUnassignedFleetOrder), [orders]);
  const assignedInWeekCount = useMemo(
    () => orders.filter((o) => o.driverId && orderScheduledDayKey(o)).length,
    [orders],
  );

  const selectedIds = [...selectedOrderIds];
  const selectedUnassignedIds = selectedIds.filter((id) => {
    const order = orders.find((o) => o.id === id);
    return order && isUnassignedFleetOrder(order);
  });

  const unassignedByDay = useMemo(() => {
    const map = {};
    const firstDayKey = format(days[0], "yyyy-MM-dd");
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      map[key] = unassignedOrders.filter((o) => {
        const sched = orderScheduledDayKey(o);
        if (!sched) return key === firstDayKey;
        return sched === key;
      });
    }
    return map;
  }, [unassignedOrders, days]);

  const assignedByDriverDay = useMemo(() => {
    const map = {};
    for (const driver of drivers) {
      map[driver.id] = {};
      for (const day of days) {
        const key = format(day, "yyyy-MM-dd");
        map[driver.id][key] = orders.filter((o) => {
          if (String(o.driverId || "") !== String(driver.id)) return false;
          const sched = orderScheduledDayKey(o);
          if (!sched) return false;
          return sched === key;
        });
      }
    }
    return map;
  }, [orders, drivers, days]);

  const handleBestFit = async () => {
    if (!selectedUnassignedIds.length) {
      toast.error("Select unassigned orders from the Unassigned row (assigned orders cannot be best-fit).");
      return;
    }

    const skippedAssigned = selectedIds.length - selectedUnassignedIds.length;
    setAssigning(true);
    try {
      const orderPublicIds = selectedUnassignedIds
        .map((oid) => {
          const order = orders.find((o) => o.id === oid);
          return order?.publicId || order?.public_id;
        })
        .filter(Boolean);

      const driverPublicIds = drivers.map((d) => d.publicId || d.public_id || d.id).filter(Boolean);

      const result = await bestFitDriversToOrders({
        orderIds: orderPublicIds,
        driverIds: driverPublicIds,
        apply: true,
      });

      const summary = summarizeBestFitResult(result, { skippedAssigned });
      if (summary.tone === "success") toast.success(summary.text);
      else if (summary.tone === "error") toast.error(summary.text);
      else if (summary.tone === "warning") toast.warning(summary.text);
      else toast.message(summary.text);

      setSelectedOrderIds(new Set());
      await reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || err?.message || "Best-fit assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-[#4B5563]" data-testid="fleet-schedule-loading">
        Loading fleet schedule…
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="fleet-schedule-view">
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!selectedUnassignedIds.length || assigning}
          onClick={handleBestFit}
          data-testid="fleet-schedule-best-fit"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" /> {assigning ? "Assigning…" : "Best-fit driver"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!selectedUnassignedIds.length}
          onClick={() => setScheduleOpen(true)}
          data-testid="fleet-schedule-bulk"
        >
          <Calendar className="h-3.5 w-3.5 mr-1" /> Bulk schedule
        </Button>
        <span className="text-xs text-[#6B7280] self-center" data-testid="fleet-schedule-stats">
          {drivers.length} drivers · {unassignedOrders.length} unassigned · {assignedInWeekCount} assigned this week ·{" "}
          {weekLabel}
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
                            selectable
                            variant="unassigned"
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
                        {dayOrders.length === 0 ? (
                          <div className="h-12 mx-1 border border-dashed border-black/[0.08] rounded-sm grid place-items-center text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">
                            —
                          </div>
                        ) : (
                          dayOrders.slice(0, 4).map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              className="w-full text-left"
                              onClick={() => openOrderDetail(o.id)}
                              data-testid={`fleet-schedule-order-${o.publicId}`}
                            >
                              <OrderChip order={o} selectable={false} variant="assigned" />
                            </button>
                          ))
                        )}
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
        Select unassigned orders to bulk-schedule or run best-fit (shift-aware). Orders without a schedule date appear
        under Monday. Click assigned orders to open order details.
      </p>

      <OrderScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        orderIds={selectedUnassignedIds}
        defaultDate={defaultScheduleDate}
        onScheduled={async ({ results } = {}) => {
          if (results?.length) {
            setOrders((prev) => patchOrdersWithSchedule(prev, results));
          }
          setSelectedOrderIds(new Set());
          await reload();
        }}
      />
    </div>
  );
}
