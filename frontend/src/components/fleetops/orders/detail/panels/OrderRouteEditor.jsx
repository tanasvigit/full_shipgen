import { useMemo, useState } from "react";
import OrderRoutePanel from "./OrderRoutePanel";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";
import { RefreshCw, Sparkles, ChevronUp, ChevronDown } from "lucide-react";

export default function OrderRouteEditor({
  order,
  rawOrder,
  etaLabel,
  loading,
  editable = false,
  onSaved,
}) {
  const [busy, setBusy] = useState(false);
  const [waypoints, setWaypoints] = useState([]);

  const initialWaypoints = useMemo(() => {
    const entities = rawOrder?.payload?.entities || rawOrder?.entities || [];
    if (!Array.isArray(entities)) return [];
    return entities.map((e, i) => ({
      id: e?.uuid || e?.id || `wp-${i}`,
      name: e?.name || e?.destination?.name || `Stop ${i + 1}`,
      type: e?.type || e?.destination_type || "waypoint",
    }));
  }, [rawOrder]);

  const displayWaypoints = waypoints.length ? waypoints : initialWaypoints;

  const polylinePoints = useMemo(() => {
    const pts = [];
    const pickup = rawOrder?.payload?.pickup || rawOrder?.pickup;
    const dropoff = rawOrder?.payload?.dropoff || rawOrder?.dropoff;
    if (pickup?.location?.coordinates) {
      const [lng, lat] = pickup.location.coordinates;
      if (lat != null && lng != null) pts.push([Number(lat), Number(lng)]);
    } else if (pickup?.lat != null) {
      pts.push([Number(pickup.lat), Number(pickup.lng)]);
    }
    if (dropoff?.location?.coordinates) {
      const [lng, lat] = dropoff.location.coordinates;
      if (lat != null && lng != null) pts.push([Number(lat), Number(lng)]);
    } else if (dropoff?.lat != null) {
      pts.push([Number(dropoff.lat), Number(dropoff.lng)]);
    }
    return pts;
  }, [rawOrder]);

  const moveWaypoint = (index, dir) => {
    const next = [...displayWaypoints];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setWaypoints(next);
  };

  const handleRefreshRoute = async () => {
    if (!order?.id) return;
    setBusy(true);
    try {
      const pickup = rawOrder?.payload?.pickup_uuid || rawOrder?.pickup_uuid;
      const dropoff = rawOrder?.payload?.dropoff_uuid || rawOrder?.dropoff_uuid;
      await fleetopsService.saveOrderRoute(order.id, { pickup, dropoff });
      toast.success("Route updated");
      onSaved?.();
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleOptimize = async () => {
    if (!order?.id) return;
    setBusy(true);
    try {
      await fleetopsService.optimizeOrderRoute(order.id);
      toast.success("Route optimized");
      onSaved?.();
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveOrder = async () => {
    if (!order?.id || !waypoints.length) return;
    setBusy(true);
    try {
      await fleetopsService.patchOrder(order.id, {
        payload: {
          entities: waypoints.map((wp, i) => ({ ...wp, order: i })),
        },
      });
      toast.success("Waypoint order saved");
      setWaypoints([]);
      onSaved?.();
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4" data-testid="order-route-editor">
      <OrderRoutePanel order={order} etaLabel={etaLabel} loading={loading} polyline={polylinePoints} />
      <div className="bg-white border border-black/[0.08] rounded-md p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="overline">Stops</div>
          {editable && (
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={handleOptimize} data-testid="order-route-optimize">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Optimize
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={handleRefreshRoute} data-testid="order-route-save">
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${busy ? "animate-spin" : ""}`} />
                Refresh route
              </Button>
              {waypoints.length > 0 && (
                <Button type="button" size="sm" disabled={busy} onClick={handleSaveOrder} data-testid="order-waypoints-save">
                  Save order
                </Button>
              )}
            </div>
          )}
        </div>
        {displayWaypoints.length === 0 ? (
          <p className="text-sm text-[#4B5563]">No waypoint entities on payload.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {displayWaypoints.map((wp, idx) => (
              <li key={wp.id} className="flex gap-2 items-center justify-between">
                <span className="flex gap-2 items-start flex-1">
                  <span className="font-mono text-[10px] text-[#4B5563] w-5">{idx + 1}.</span>
                  <span>
                    <span className="font-medium text-[#0A0E1A]">{wp.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[#4B5563] ml-2">{wp.type}</span>
                  </span>
                </span>
                {editable && (
                  <span className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => moveWaypoint(idx, -1)}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={idx === displayWaypoints.length - 1} onClick={() => moveWaypoint(idx, 1)}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
