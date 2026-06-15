import { useMemo } from "react";
import MapView from "@/components/common/MapView";
import { toLeafletPolygon } from "@/lib/fleetops/geofence";

function polygonTrail(points, color, label) {
  if (!points?.length) return null;
  return { points, color, highlighted: true, label };
}

export default function FleetMapTab({ fleetApi, fleetDrivers = [], enabled = true }) {
  const serviceArea = fleetApi?.service_area;
  const zone = fleetApi?.zone;

  const { markers, routeTrails } = useMemo(() => {
    if (!enabled) return { markers: [], routeTrails: [] };
    const trails = [];
    const saPoints = toLeafletPolygon(serviceArea?.border);
    const zonePoints = toLeafletPolygon(zone?.border);
    const saTrail = polygonTrail(saPoints, "#0066FF", "Service area");
    const zoneTrail = polygonTrail(zonePoints, "#10B981", "Zone");
    if (saTrail) trails.push(saTrail);
    if (zoneTrail) trails.push(zoneTrail);

    const driverMarkers = (fleetDrivers || [])
      .map((d) => {
        const lat = d.location?.lat || d.latitude;
        const lng = d.location?.lng || d.longitude;
        if (!lat || !lng) return null;
        return {
          id: d.id,
          lat: Number(lat),
          lng: Number(lng),
          label: d.name,
          color: "#F59E0B",
          popup: `Driver · ${d.name}`,
        };
      })
      .filter(Boolean);

    return { markers: driverMarkers, routeTrails: trails };
  }, [enabled, serviceArea, zone, fleetDrivers]);

  const hasGeometry = routeTrails.length > 0 || markers.length > 0;

  return (
    <div className="p-4" data-testid="fleet-map-tab">
      <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
        {!hasGeometry ? (
          <div className="p-8 text-sm text-[#4B5563] text-center">
            No service area boundary or driver positions to display. Assign a service area on the fleet profile.
          </div>
        ) : (
          <div className="h-[420px]">
            <MapView markers={markers} routeTrails={routeTrails} fitOnce testid="fleet-service-area-map" />
          </div>
        )}
        <div className="px-4 py-3 border-t border-black/[0.08] flex flex-wrap gap-4 text-xs text-[#4B5563]">
          {serviceArea?.name && <span>Service area: {serviceArea.name}</span>}
          {zone?.name && <span>Zone: {zone.name}</span>}
          {markers.length > 0 && <span>{markers.length} driver position(s)</span>}
        </div>
      </div>
    </div>
  );
}
