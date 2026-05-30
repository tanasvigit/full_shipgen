import StatusBadge from "@/components/common/StatusBadge";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import { TableSkeleton } from "@/components/loaders";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { queryOrders } from "@/lib/fleetops/detailApi";
import { mapOrder, statusLabel } from "@/lib/mappers";

export default function VehicleOrdersTab({ vehicleId, enabled }) {
  const { data: rows, loading } = useDetailTabData(
    `vehicle-orders-${vehicleId}`,
    () => queryOrders({ vehicle: vehicleId, vehicle_uuid: vehicleId, limit: 50 }),
    { enabled: enabled && Boolean(vehicleId) },
  );

  const orders = (rows || []).map(mapOrder);

  if (loading) {
    return (
      <div className="p-4">
        <TableSkeleton rows={4} testId="vehicle-orders-skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {orders.length === 0 ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">No trips for this vehicle.</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="px-4 py-3 flex items-center gap-3">
              <DetailEntityLink entityKey="order" entityId={o.id} className="font-mono text-xs">
                {o.publicId}
              </DetailEntityLink>
              <span className="text-sm flex-1 truncate">{o.customer.name}</span>
              <StatusBadge status={o.status} label={statusLabel(o.status)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
