import { useMemo } from "react";
import StatusBadge from "@/components/common/StatusBadge";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import { TableSkeleton } from "@/components/loaders";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { queryOrders } from "@/lib/fleetops/detailApi";
import { mapOrder, statusLabel } from "@/lib/mappers";

export default function DriverOrdersTab({ driverId, enabled }) {
  const { data: rows, loading } = useDetailTabData(
    `driver-orders-${driverId}`,
    () => queryOrders({ driver: driverId, driver_uuid: driverId, limit: 50 }),
    { enabled: enabled && Boolean(driverId) },
  );

  const orders = useMemo(() => (rows || []).map(mapOrder), [rows]);

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "delivered");
    const failed = orders.filter((o) => o.status === "canceled");
    const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    return {
      total: orders.length,
      active: orders.filter((o) => !["delivered", "canceled"].includes(o.status)).length,
      delivered: delivered.length,
      failed: failed.length,
      revenue,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="p-4">
        <TableSkeleton rows={5} testId="driver-orders-skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          ["Total", stats.total],
          ["Active", stats.active],
          ["Delivered", stats.delivered],
          ["Failed", stats.failed],
          ["Revenue", `$${stats.revenue.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-black/[0.08] rounded-md p-3">
            <div className="overline">{label}</div>
            <div className="font-display text-lg font-bold tabular mt-1">{value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {orders.length === 0 ? (
          <div className="text-sm text-[#4B5563] text-center py-8">No orders for this driver.</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="px-4 py-3 hover:bg-[#F1F2F5]/50">
              <div className="flex items-center gap-3">
                <DetailEntityLink entityKey="order" entityId={o.id} className="font-mono text-xs w-28 shrink-0">
                  {o.publicId}
                </DetailEntityLink>
                <span className="text-sm flex-1 truncate">{o.customer.name}</span>
                <StatusBadge status={o.status} label={statusLabel(o.status)} />
                <span className="font-mono text-sm tabular w-20 text-right">
                  ${Number(o.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
