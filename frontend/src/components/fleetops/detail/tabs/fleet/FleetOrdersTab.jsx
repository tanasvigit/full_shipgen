import { useMemo } from "react";
import StatusBadge from "@/components/common/StatusBadge";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import { TableSkeleton } from "@/components/loaders";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { queryOrders } from "@/lib/fleetops/detailApi";
import { mapOrder, statusLabel } from "@/lib/mappers";

export default function FleetOrdersTab({ fleetId, enabled }) {
  const { data: rows, loading } = useDetailTabData(
    `fleet-orders-${fleetId}`,
    () => queryOrders({ fleet: fleetId, fleet_uuid: fleetId, limit: 50 }),
    { enabled: enabled && Boolean(fleetId) },
  );

  const orders = useMemo(() => (rows || []).map(mapOrder), [rows]);

  const stats = useMemo(() => {
    const active = orders.filter((o) => !["delivered", "canceled", "completed"].includes(o.status));
    return {
      total: orders.length,
      active: active.length,
      unassigned: orders.filter((o) => !o.driver?.id && !o.driverId).length,
      revenue: orders.reduce((s, o) => s + Number(o.total || 0), 0),
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="p-4">
        <TableSkeleton rows={5} testId="fleet-orders-skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" data-testid="fleet-orders-tab">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          ["Total", stats.total],
          ["Active", stats.active],
          ["Unassigned", stats.unassigned],
          ["Revenue", `₹${stats.revenue.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-black/[0.08] rounded-md p-3">
            <div className="overline">{label}</div>
            <div className="font-display text-lg font-bold tabular mt-1">{value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {orders.length === 0 ? (
          <div className="text-sm text-[#4B5563] text-center py-8">
            No orders assigned to this fleet&apos;s drivers or vehicles.
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="px-4 py-3 hover:bg-[#F1F2F5]/50">
              <div className="flex items-center gap-3">
                <DetailEntityLink entityKey="order" entityId={o.id} className="font-mono text-xs w-28 shrink-0">
                  {o.publicId}
                </DetailEntityLink>
                <span className="text-sm flex-1 truncate">{o.customer?.name || "—"}</span>
                <StatusBadge status={o.status} label={statusLabel(o.status)} />
                <span className="font-mono text-sm tabular w-20 text-right">
                  ₹{Number(o.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
