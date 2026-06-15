import { useMemo } from "react";
import MapView from "@/components/common/MapView";
import { stopWaypointsFromMappedOrder, stopWaypointsFromOrder } from "@/lib/maps/stopWaypoints";

export default function OrderRoutePanel({
  order,
  etaLabel,
  loading,
  polyline,
  waypointMarkers = [],
  rawOrder,
}) {
  const markers = useMemo(
    () =>
      [
        ...(waypointMarkers.length
          ? waypointMarkers
          : [
              order?.pickup?.lat != null && {
                id: "pickup",
                lat: order.pickup.lat,
                lng: order.pickup.lng,
                label: "P",
                popup: order.pickup.name,
                color: "#10B981",
              },
              order?.dropoff?.lat != null && {
                id: "dropoff",
                lat: order.dropoff.lat,
                lng: order.dropoff.lng,
                label: "D",
                popup: order.dropoff.name,
                color: "#F59E0B",
              },
            ].filter(Boolean)),
      ],
    [order, waypointMarkers],
  );

  const routePoints = useMemo(() => {
    if (polyline?.length >= 2) return polyline;
    if (waypointMarkers.length >= 2) {
      return waypointMarkers
        .filter((marker) => marker.lat != null && marker.lng != null)
        .map((marker) => [Number(marker.lat), Number(marker.lng)]);
    }
    const fromOrder = stopWaypointsFromOrder(order, rawOrder);
    return fromOrder.length >= 2 ? fromOrder : stopWaypointsFromMappedOrder(order);
  }, [order, polyline, rawOrder, waypointMarkers]);

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
          routePoints={routePoints.length >= 2 ? routePoints : undefined}
          markers={markers}
          testid="order-map"
        />
      </div>
    </div>
  );
}
