import { useMemo } from "react";
import MapView from "@/components/common/MapView";
import { PageLoader } from "@/components/loaders";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { fleetopsService } from "@/services/fleetops";
import { positionToLatLng } from "@/lib/fleetops/detailApi";

export default function OrderTrackingTab({ orderId, order, driver, enabled }) {
  const { data: tracker, loading } = useDetailTabData(
    `order-tracker-${orderId}`,
    () => fleetopsService.getOrderTracker(orderId),
    { enabled: enabled && Boolean(orderId) },
  );

  const routePoints = useMemo(() => {
    const pts =
      tracker?.route ||
      tracker?.positions ||
      tracker?.polyline ||
      [];
    if (Array.isArray(pts) && pts.length && Array.isArray(pts[0])) {
      return pts.map((p) => [Number(p[0]), Number(p[1])]);
    }
    return (pts || [])
      .map((p) => {
        const ll = positionToLatLng(p);
        return ll.lat ? [ll.lat, ll.lng] : null;
      })
      .filter(Boolean);
  }, [tracker]);

  const markers = useMemo(() => {
    const list = [];
    if (order?.pickup?.lat) {
      list.push({
        id: "pickup",
        lat: order.pickup.lat,
        lng: order.pickup.lng,
        label: "Pickup",
        color: "#10B981",
      });
    }
    if (order?.dropoff?.lat) {
      list.push({
        id: "dropoff",
        lat: order.dropoff.lat,
        lng: order.dropoff.lng,
        label: "Drop-off",
        color: "#F59E0B",
      });
    }
    const live = tracker?.driver_location || tracker?.location || driver?.location;
    if (live?.lat || live?.latitude) {
      list.push({
        id: "driver-live",
        lat: Number(live.lat || live.latitude),
        lng: Number(live.lng || live.longitude),
        label: driver?.name || "Driver",
        color: "#0066FF",
      });
    }
    return list;
  }, [order, tracker, driver]);

  if (loading && !tracker) {
    return <PageLoader loading skeleton="detail" message="Loading tracking…" testId="order-tracking-loader" />;
  }

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
        <div className="px-4 py-2.5 border-b border-black/[0.08] flex justify-between overline">
          <span>Live tracking</span>
          <span className="font-mono text-[10px] text-[#4B5563]">
            {tracker?.status || order?.status || "—"}
          </span>
        </div>
        <div className="h-[420px]">
          <MapView
            markers={markers}
            routePoints={routePoints.length > 1 ? routePoints : undefined}
            loading={loading}
            testid="order-tracking-map"
          />
        </div>
      </div>
    </div>
  );
}
