import MapView from "@/components/common/MapView";

export default function OrderRoutePanel({ order, etaLabel, loading, polyline, waypointMarkers = [] }) {
  if (!order) return null;

  const markers = [
    ...(waypointMarkers.length
      ? waypointMarkers
      : [
          order.pickup?.lat != null && {
            id: "pickup",
            lat: order.pickup.lat,
            lng: order.pickup.lng,
            label: "P",
            popup: order.pickup.name,
            color: "#10B981",
          },
          order.dropoff?.lat != null && {
            id: "dropoff",
            lat: order.dropoff.lat,
            lng: order.dropoff.lng,
            label: "D",
            popup: order.dropoff.name,
            color: "#F59E0B",
          },
        ].filter(Boolean)),
  ];

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
          markers={markers}
          testid="order-map"
        />
      </div>
    </div>
  );
}
