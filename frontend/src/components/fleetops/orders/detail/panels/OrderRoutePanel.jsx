import MapView from "@/components/common/MapView";

export default function OrderRoutePanel({ order, etaLabel, loading, polyline }) {
  if (!order) return null;

  return (
    <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
      <div className="px-4 py-2.5 border-b border-black/[0.08] flex items-center justify-between">
        <div className="overline">Route</div>
        <span className="text-xs font-mono text-[#374151]">
          {order.distance} km · ETA {etaLabel}
        </span>
      </div>
      <div className="h-[420px]">
        <MapView
          loading={loading}
          routePoints={polyline?.length >= 2 ? polyline : undefined}
          markers={[
            {
              id: "pickup",
              lat: order.pickup.lat,
              lng: order.pickup.lng,
              label: "Pickup",
              popup: order.pickup.name,
              color: "#10B981",
            },
            {
              id: "dropoff",
              lat: order.dropoff.lat,
              lng: order.dropoff.lng,
              label: "Drop-off",
              popup: order.dropoff.name,
              color: "#F59E0B",
            },
          ]}
          testid="order-map"
        />
      </div>
    </div>
  );
}
