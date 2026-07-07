import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import MapView from "@/components/common/MapView";
import MapMarkerContextMenu from "@/components/fleetops/map/MapMarkerContextMenu";
import PositionReplayPanel from "@/components/fleetops/map/PositionReplayPanel";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { useFleetopsRealtimeChannel } from "@/hooks/fleetops/useFleetopsRealtimeChannel";
import { resolveCompanyChannelId } from "@/domain/fleetops/realtime/socketConfig";
import { parseApiError } from "@/lib/errors";
import { coordsFromGeoPoint } from "@/lib/fleetops/geofence";

const MAX_MARKERS = 500;

function toMarker(item, kind, color) {
  const fromRoot = coordsFromGeoPoint(item);
  const fromLocation = coordsFromGeoPoint(item.location);
  const lat = fromRoot.lat ?? fromLocation.lat ?? item.latitude ?? item.lat;
  const lng = fromRoot.lng ?? fromLocation.lng ?? item.longitude ?? item.lng;
  if (lat == null || lng == null) return null;
  const id = item.uuid || item.id;
  return {
    id: `${kind}-${id}`,
    lat: Number(lat),
    lng: Number(lng),
    label: item.name || item.plate || item.public_id || kind,
    popup: `${kind} · ${item.name || item.plate || id}`,
    color,
    entityKey: kind,
    subjectUuid: id,
  };
}

export default function FleetTrackingHub() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [fleetFilter, setFleetFilter] = useState("all");
  const [showDrivers, setShowDrivers] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showOrders, setShowOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replaySubject, setReplaySubject] = useState(null);
  const [routeTrails, setRouteTrails] = useState([]);
  const [mapContextMenu, setMapContextMenu] = useState(null);
  const companyChannel = resolveCompanyChannelId();
  const liveParams = useMemo(
    () => (fleetFilter !== "all" ? { fleet: fleetFilter, fleet_id: fleetFilter } : {}),
    [fleetFilter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const drivers = await fleetopsService.getLiveDrivers(liveParams).catch(() => []);
      const [v, o, f] = await Promise.all([
        fleetopsService.getLiveVehicles(liveParams, { drivers }).catch(() => []),
        fleetopsService.getLiveOrders(liveParams).catch(() => []),
        fleetopsService.listFleets().catch(() => []),
      ]);
      setDrivers(drivers);
      setVehicles(v);
      setOrders(o);
      setFleets(f);
    } catch (err) {
      toast.error(parseApiError(err, "Could not load live fleet data"));
    } finally {
      setLoading(false);
    }
  }, [liveParams]);

  const refreshLiveState = useCallback(async () => {
    try {
      const drivers = await fleetopsService.getLiveDrivers(liveParams).catch(() => []);
      const [v, o] = await Promise.all([
        fleetopsService.getLiveVehicles(liveParams, { drivers }).catch(() => []),
        fleetopsService.getLiveOrders(liveParams).catch(() => []),
      ]);
      setDrivers(drivers);
      setVehicles(v);
      setOrders(o);
    } catch {
      /* silent realtime refresh */
    }
  }, [liveParams]);

  useEffect(() => {
    load();
  }, [load]);

  useFleetopsRealtimeChannel(companyChannel, () => refreshLiveState(), {
    enabled: Boolean(companyChannel),
    debounceMs: 800,
  });

  const markers = useMemo(() => {
    const out = [];
    if (showVehicles) {
      for (const v of vehicles) {
        const m = toMarker(v, "vehicle", "#0066FF");
        if (m) out.push(m);
      }
    }
    if (showDrivers) {
      for (const d of drivers) {
        const m = toMarker(d, "driver", "#10B981");
        if (m) out.push(m);
      }
    }
    if (showOrders) {
      for (const o of orders) {
        const drop = o.dropoff || o.payload?.dropoff || o;
        const m = toMarker({ ...drop, name: o.public_id || o.publicId || "Order" }, "order", "#F59E0B");
        if (m) out.push(m);
      }
    }
    return out.slice(0, MAX_MARKERS);
  }, [drivers, vehicles, orders, showDrivers, showVehicles, showOrders]);

  const vehicleMarkerCount = useMemo(
    () => markers.filter((m) => m.entityKey === "vehicle").length,
    [markers],
  );

  return (
    <div data-testid="fleet-tracking-hub">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Connectivity" },
          { label: "Fleet tracking" },
        ]}
        overline="Connectivity"
        title="Fleet tracking"
        description={`${markers.length} live markers (cap ${MAX_MARKERS}) · Right-click markers for actions`}
        actions={
          <Button variant="outline" onClick={load} data-testid="tracking-refresh">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        }
      />
      <div className="px-6 pb-2 flex flex-wrap gap-3 items-center">
        <Select value={fleetFilter} onValueChange={setFleetFilter}>
          <SelectTrigger className="w-[200px]" data-testid="tracking-fleet-filter">
            <SelectValue placeholder="All fleets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fleets</SelectItem>
            {fleets.map((f) => (
              <SelectItem key={f.uuid || f.id} value={String(f.uuid || f.id)}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="text-xs flex items-center gap-1">
          <input type="checkbox" checked={showDrivers} onChange={(e) => setShowDrivers(e.target.checked)} /> Drivers
        </label>
        <label className="text-xs flex items-center gap-1">
          <input type="checkbox" checked={showVehicles} onChange={(e) => setShowVehicles(e.target.checked)} /> Vehicles
        </label>
        <label className="text-xs flex items-center gap-1">
          <input type="checkbox" checked={showOrders} onChange={(e) => setShowOrders(e.target.checked)} /> Orders
        </label>
      </div>
      <div className="p-6 pt-2 space-y-4">
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden h-[560px] relative">
          <MapView
            markers={markers}
            routeTrails={routeTrails}
            loading={loading}
            testid="fleet-tracking-map"
            zoom={markers.length ? 11 : 8}
            onMarkerClick={(m) => {
              if (m.subjectUuid) setReplaySubject({ uuid: m.subjectUuid, label: m.label });
            }}
            onMarkerContextMenu={(m, e) => {
              setMapContextMenu({
                marker: m,
                position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY },
              });
            }}
          />
          <MapMarkerContextMenu
            marker={mapContextMenu?.marker}
            position={mapContextMenu?.position}
            onClose={() => setMapContextMenu(null)}
            onOpenDetail={(entityKey, entityId) => {
              if (entityKey === "driver") navigate(`/fleet-ops/management/drivers/${entityId}`);
              if (entityKey === "vehicle") navigate(`/fleet-ops/management/vehicles/${entityId}`);
            }}
          />
        </div>
        {replaySubject && (
          <PositionReplayPanel
            subjectUuid={replaySubject.uuid}
            subjectLabel={replaySubject.label}
            onTrailChange={setRouteTrails}
          />
        )}
        <p className="text-xs text-[#4B5563] font-mono" data-testid="tracking-live-api-note">
          Data source: fleet-ops/live/* · Blue = vehicles · Green = drivers · Orange = orders
          {showVehicles && vehicleMarkerCount === 0
            ? " · No vehicle positions yet — set vehicle location, device GPS (not 0,0), or assign a driver with location"
            : ""}
        </p>
      </div>
    </div>
  );
}
