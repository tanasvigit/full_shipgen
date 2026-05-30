import { useMemo } from "react";
import MapView from "@/components/common/MapView";
import { PageLoader } from "@/components/loaders";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { fetchPositionMetrics, positionToLatLng, queryPositions } from "@/lib/fleetops/detailApi";

export default function DriverPositionsTab({ driverId, driver, enabled }) {
  const { data: positions, loading } = useDetailTabData(
    `driver-positions-${driverId}`,
    () => queryPositions({ subject_uuid: driverId, limit: 200 }),
    { enabled: enabled && Boolean(driverId) },
  );

  const positionIds = useMemo(() => (positions || []).map((p) => p.uuid || p.id).filter(Boolean), [positions]);

  const { data: metrics } = useDetailTabData(
    `driver-pos-metrics-${driverId}`,
    () => fetchPositionMetrics(positionIds),
    { enabled: enabled && positionIds.length > 0 },
  );

  const routePoints = useMemo(() => {
    const pts = (positions || [])
      .map(positionToLatLng)
      .filter((p) => p.lat && p.lng);
    return pts.map((p) => [p.lat, p.lng]);
  }, [positions]);

  const last = positions?.[positions.length - 1];
  const lastPt = last ? positionToLatLng(last) : null;
  const fallback = driver?.location
    ? { lat: Number(driver.location.lat), lng: Number(driver.location.lng) }
    : { lat: 40.7589, lng: -73.9851 };

  const marker = lastPt?.lat
    ? { id: driverId, lat: lastPt.lat, lng: lastPt.lng, label: driver?.name, color: "#10B981" }
    : { id: driverId, lat: fallback.lat, lng: fallback.lng, label: driver?.name, color: "#10B981" };

  if (loading && !positions?.length) {
    return <PageLoader loading skeleton="detail" message="Loading positions…" testId="driver-positions-loader" />;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-white border border-black/[0.08] rounded-md p-3">
          <div className="overline">Points</div>
          <div className="text-lg font-bold tabular mt-1">{positions?.length || 0}</div>
        </div>
        <div className="bg-white border border-black/[0.08] rounded-md p-3">
          <div className="overline">Speed</div>
          <div className="text-lg font-bold tabular mt-1">
            {last?.speed != null ? `${Number(last.speed)} km/h` : "—"}
          </div>
        </div>
        <div className="bg-white border border-black/[0.08] rounded-md p-3">
          <div className="overline">Heading</div>
          <div className="text-lg font-bold tabular mt-1">{last?.heading ?? last?.bearing ?? "—"}</div>
        </div>
        <div className="bg-white border border-black/[0.08] rounded-md p-3">
          <div className="overline">Metrics</div>
          <div className="text-lg font-bold tabular mt-1">
            {metrics?.metrics?.length ?? metrics?.distance ?? "—"}
          </div>
        </div>
      </div>
      <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
        <div className="px-4 py-2.5 border-b border-black/[0.08] overline">
          Route trail · {driver?.location?.label || "Live position"}
        </div>
        <div className="h-[360px]">
          <MapView
            markers={[marker]}
            routePoints={routePoints.length > 1 ? routePoints : undefined}
            testid="driver-map"
          />
        </div>
      </div>
    </div>
  );
}
