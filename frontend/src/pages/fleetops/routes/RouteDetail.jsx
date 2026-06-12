import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import MapView from "@/components/common/MapView";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { normalizeOptimizationResult, resolveOrderIdsFromRoute } from "@/lib/fleetops/routing";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import ServiceRatesForRoutePicker from "@/components/fleetops/service-rates/ServiceRatesForRoutePicker";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function polylineFromRoute(route) {
  const details = route?.details || route?.payload?.details;
  if (Array.isArray(details?.polyline) && details.polyline.length >= 2) return details.polyline;
  if (Array.isArray(details?.stops) && details.stops.length >= 2) {
    return details.stops
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => [Number(s.lat), Number(s.lng)]);
  }
  if (Array.isArray(details?.polyline)) return details.polyline;
  if (Array.isArray(details?.coordinates)) {
    return details.coordinates.map((c) => (Array.isArray(c) ? [c[1] ?? c[0], c[0] ?? c[1]] : c));
  }
  return [];
}

function markersFromRoute(route) {
  const details = route?.details || {};
  const stops = details?.stops?.length ? details.stops : details?.assignments || [];
  if (!Array.isArray(stops)) return [];
  return stops
    .map((s, i) => ({
      id: s.id || `stop-${i}`,
      lat: s.lat ?? s.latitude,
      lng: s.lng ?? s.longitude,
      label: String((s.sequence ?? i) + 1),
      popup: s.name || s.type || s.order_id || s.orderId,
      color: s.type === "pickup" ? "#10B981" : s.type === "dropoff" ? "#F59E0B" : "#0066FF",
    }))
    .filter((m) => m.lat != null && m.lng != null);
}

export default function RouteDetail() {
  const { id } = useParams();
  const ability = useFleetopsAbility();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [serviceRateId, setServiceRateId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRoute(await fleetopsService.getRoute(id));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Route not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const polyline = useMemo(() => polylineFromRoute(route), [route]);
  const markers = useMemo(() => markersFromRoute(route), [route]);

  const optimize = async () => {
    if (!ability.canUpdateOrder && !ability.isDispatcher) {
      toast.error("No permission to optimize routes");
      return;
    }
    setBusy(true);
    try {
      const orderIds = resolveOrderIdsFromRoute(route);
      const result = await fleetopsService.optimizeRoutes({
        route,
        route_uuid: id,
        orders: orderIds,
      });
      let orders = route?.order ? [route.order] : [];
      if (!orders.length && orderIds.length) {
        try {
          orders = [await fleetopsService.getOrder(orderIds[0])];
        } catch {
          /* use assignment-only normalization */
        }
      }
      const normalized = normalizeOptimizationResult(result, orders);
      await fleetopsService.updateRoute(id, {
        details: {
          ...route?.details,
          assignments: normalized.assignments,
          polyline: normalized.polyline,
          stops: normalized.sequencedStops,
        },
        total_distance: Math.round(normalized.totalDistance || 0),
        total_time: Math.round(normalized.totalDuration || 0),
      });
      toast.success("Route optimized");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Optimize failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fleetopsService.deleteRoute(id);
      toast.success("Route deleted");
      window.location.href = "/fleet-ops/operations/routes";
    } catch (err) {
      toast.error(err?.friendlyMessage || "Delete failed");
    }
  };

  const stopRows = useMemo(() => {
    const stops = route?.details?.stops || [];
    if (stops.length) {
      return stops.map((s, i) => ({
        id: s.id || `${s.order_id || s.orderId}-${i}`,
        sequence: s.sequence ?? i + 1,
        orderId: s.order_id || s.orderId,
        type: s.type,
        driverId: s.driver_id || s.driverId,
        distance: s.distance,
        duration: s.duration,
      }));
    }
    const assignments = route?.details?.assignments || [];
    return assignments.map((a, i) => ({
      id: a.order_id || i,
      sequence: a.sequence ?? i + 1,
      orderId: a.order_id,
      driverId: a.driver_id,
      distance: a.distance,
      duration: a.duration,
    }));
  }, [route]);

  return (
    <div data-testid="route-detail-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Routes", to: "/fleet-ops/operations/routes" }, { label: id }]}
        title={route?.public_id || route?.order_public_id || route?.tracking_number || "Route"}
        description={[route?.status || route?.order_status, route?.total_distance || route?.total_distance_m].filter(Boolean).join(" · ")}
        actions={
          <>
            {(ability.canUpdateOrder || ability.isDispatcher) && (
              <Button variant="outline" disabled={busy || loading} onClick={optimize} data-testid="route-optimize">
                <Sparkles className="h-4 w-4 mr-1" /> Optimize
              </Button>
            )}
            {ability.canDeleteOrder && (
              <Button variant="outline" disabled={busy} onClick={() => setDeleteOpen(true)} data-testid="route-delete">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="h-[480px] border border-black/[0.08] rounded-md overflow-hidden bg-white">
          <MapView
            loading={loading}
            markers={markers}
            routePoints={polyline.length >= 2 ? polyline : undefined}
            testid="route-detail-map"
          />
        </div>
        {route?.order_public_id && (
          <p className="text-sm text-[#374151]">
            Linked order:{" "}
            <Link className="text-[#0066FF] font-mono" to={`/fleet-ops/operations/orders/${route.order_uuid || route.order_public_id}`}>
              {route.order_public_id}
            </Link>
          </p>
        )}
        <div className="max-w-md">
          <ServiceRatesForRoutePicker routeId={id} value={serviceRateId} onChange={setServiceRateId} />
        </div>
        {stopRows.length > 0 && (
          <DataTable
            testid="route-stops-table"
            columns={[
              { key: "sequence", header: "#", render: (r) => r.sequence },
              { key: "type", header: "Type", render: (r) => r.type || "—" },
              { key: "orderId", header: "Order", render: (r) => <span className="font-mono text-xs">{r.orderId}</span> },
              { key: "driverId", header: "Driver", render: (r) => r.driverId || "—" },
              { key: "distance", header: "Distance (m)", render: (r) => r.distance ?? "—" },
              { key: "duration", header: "Duration (s)", render: (r) => r.duration ?? "—" },
            ]}
            data={stopRows}
            pageSize={25}
          />
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete route?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
