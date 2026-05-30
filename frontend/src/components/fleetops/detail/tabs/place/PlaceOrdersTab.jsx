import StatusBadge from "@/components/common/StatusBadge";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { queryOrders } from "@/lib/fleetops/detailApi";
import { mapOrder, statusLabel } from "@/lib/mappers";

export default function PlaceOrdersTab({ placeId, enabled }) {
  const { data: rows, loading } = useDetailTabData(
    `place-orders-${placeId}`,
    () => queryOrders({ place: placeId, place_uuid: placeId, limit: 50 }),
    { enabled: enabled && Boolean(placeId) },
  );
  const orders = (rows || []).map(mapOrder);

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {loading ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">No orders linked to this place.</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="px-4 py-3 flex items-center gap-3">
              <DetailEntityLink entityKey="order" entityId={o.id} className="font-mono text-xs">
                {o.publicId}
              </DetailEntityLink>
              <StatusBadge status={o.status} label={statusLabel(o.status)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
