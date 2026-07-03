import { useMemo } from "react";
import MapView from "@/components/common/MapView";
import { closedTrailPoints, extractBorderGeometry, toLeafletPolygon } from "@/lib/fleetops/geofence";

const ZONE_COLORS = ["#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

function buildTrail(points, color, highlighted, label) {
  const trailPoints = closedTrailPoints(points);
  if (trailPoints.length < 3) return null;
  return { points: trailPoints, color, highlighted, label };
}

/**
 * Read-only overview map for a service area and its zones (uses shared MapView / Google or Leaflet).
 */
export default function ServiceAreaMapPanel({
  serviceAreaBorder,
  zones = [],
  height = "360px",
  testId = "service-area-overview-map",
  emptyMessage = "Draw a service area boundary or add zone polygons to preview them on the map.",
}) {
  const routeTrails = useMemo(() => {
    const trails = [];
    const areaPoints = toLeafletPolygon(serviceAreaBorder);
    const areaTrail = buildTrail(areaPoints, "#0066FF", true, "Service area");
    if (areaTrail) trails.push(areaTrail);

    zones.forEach((zone, index) => {
      const border = extractBorderGeometry(zone?.raw || zone);
      const zonePoints = toLeafletPolygon(border);
      const zoneTrail = buildTrail(
        zonePoints,
        zone?.raw?.color || ZONE_COLORS[index % ZONE_COLORS.length],
        false,
        zone?.name || zone?.raw?.name || `Zone ${index + 1}`,
      );
      if (zoneTrail) trails.push(zoneTrail);
    });

    return trails;
  }, [serviceAreaBorder, zones]);

  if (!routeTrails.length) {
    return (
      <div
        className="rounded-lg border border-dashed border-black/[0.12] bg-[#FAFAFA] p-8 text-center text-sm text-[#4B5563]"
        data-testid={`${testId}-empty`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid={testId}>
      <div style={{ height }} className="rounded-lg overflow-hidden">
        <MapView routeTrails={routeTrails} fitOnce testid={`${testId}-canvas`} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[#4B5563]">
        {routeTrails.map((trail) => (
          <span key={trail.label} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: trail.color }} />
            {trail.label}
          </span>
        ))}
      </div>
    </div>
  );
}
