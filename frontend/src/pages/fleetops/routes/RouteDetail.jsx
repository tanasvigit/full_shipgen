import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import MapView from "@/components/common/MapView";
import DataTable from "@/components/common/DataTable";
import FleetopsDetailDrawerPage from "@/components/fleetops/detail/FleetopsDetailDrawerPage";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { normalizeOptimizationResult, resolveOrderIdsFromRoute, buildRouteStopRows, resolveRoutePickupDropoff, resolveOrderPlaces, resolveStopLocationName } from "@/lib/fleetops/routing";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import { DetailLoadingState, resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";
import ServiceRatesForRoutePicker from "@/components/fleetops/service-rates/ServiceRatesForRoutePicker";
import { ArrowLeft, Route as RouteIcon, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { parseApiError } from "@/lib/errors";
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

function stopWaypointsFromRoute(route) {
  const details = route?.details || route?.payload?.details || {};
  const stops = details?.stops?.length ? details.stops : details?.assignments || [];
  if (!Array.isArray(stops)) return [];
  return stops
    .filter((stop) => stop.lat != null && stop.lng != null)
    .map((stop) => [Number(stop.lat ?? stop.latitude), Number(stop.lng ?? stop.longitude)]);
}

function markersFromRoute(route) {
  if (!route) return [];
  const details = route.details || {};
  const stops = details?.stops?.length ? details.stops : details?.assignments || [];
  const places = resolveOrderPlaces(route);
  if (!Array.isArray(stops)) return [];
  return stops
    .map((s, i) => ({
      id: s.id || `stop-${i}`,
      lat: s.lat ?? s.latitude,
      lng: s.lng ?? s.longitude,
      label: String((s.sequence ?? i) + 1),
      popup: resolveStopLocationName(s, places),
      color: s.type === "pickup" ? "#10B981" : s.type === "dropoff" ? "#F59E0B" : "#0066FF",
    }))
    .filter((m) => m.lat != null && m.lng != null);
}

/**
 * @param {{ embedded?: boolean, entityId?: string, activeTab?: string|null, onTabChange?: (tab: string) => void, onClose?: () => void }} props
 */
export default function RouteDetail({
  embedded = false,
  entityId: entityIdProp,
  activeTab: activeTabProp,
  onTabChange,
  onClose,
}) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const navigate = useNavigate();
  const { closeDetail } = useFleetopsDetailDrawer("route");
  const ability = useFleetopsAbility();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [serviceRateId, setServiceRateId] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setRoute(await fleetopsService.getRoute(id));
    } catch (err) {
      toast.error(parseApiError(err, "Route not found"));
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const routePoints = useMemo(() => stopWaypointsFromRoute(route), [route]);
  const markers = useMemo(() => markersFromRoute(route), [route]);
  const linkedOrderIds = useMemo(() => resolveOrderIdsFromRoute(route), [route]);

  const replanRoute = () => {
    if (!linkedOrderIds.length) {
      toast.error("No linked orders to re-plan");
      return;
    }
    const path = `/fleet-ops/operations/routes/new?order_ids=${encodeURIComponent(linkedOrderIds.join(","))}`;
    if (embedded) {
      closeDetail();
      navigate(path);
    } else {
      navigate(path);
    }
  };

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
      toast.error(parseApiError(err, "Optimize failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fleetopsService.deleteRoute(id);
      toast.success("Route deleted");
      setDeleteOpen(false);
      if (embedded) {
        closeDetail();
        onClose?.();
      } else {
        navigate("/fleet-ops/operations/routes");
      }
    } catch (err) {
      toast.error(parseApiError(err, "Delete failed"));
    }
  };

  const stopRows = useMemo(() => buildRouteStopRows(route), [route]);
  const routePlaces = useMemo(() => resolveRoutePickupDropoff(route), [route]);

  if (!id) {
    return <div className="p-8 text-[#374151]">Route not found.</div>;
  }

  if (loading && !route) {
    return (
      <DetailLoadingState embedded={embedded} message="Loading route…" testId="route-detail-loader" />
    );
  }

  if (!loading && !route) {
    return <div className="p-8 text-[#374151]">Route not found.</div>;
  }

  const routeTitle = route?.public_id || route?.order_public_id || route?.tracking_number || "Route";
  const routeStatus = route?.status || route?.order_status || null;
  const routeDescription = [routeStatus, route?.total_distance || route?.total_distance_m]
    .filter(Boolean)
    .join(" · ");

  const headerActions = [
    ...(ability.canUpdateOrder || ability.isDispatcher
      ? [
          ...(linkedOrderIds.length
            ? [
                {
                  id: "replan",
                  label: "Re-plan",
                  testId: "route-replan",
                  onClick: replanRoute,
                  disabled: busy || loading,
                  icon: <RouteIcon className="h-3.5 w-3.5 mr-1" />,
                },
              ]
            : []),
          {
            id: "optimize",
            label: "Optimize",
            testId: "route-optimize",
            onClick: optimize,
            disabled: busy || loading,
            icon: <Sparkles className="h-3.5 w-3.5 mr-1" />,
          },
        ]
      : []),
    ...(ability.canDeleteOrder
      ? [
          {
            id: "delete",
            label: "Delete",
            testId: "route-delete",
            onClick: () => setDeleteOpen(true),
            disabled: busy,
            icon: <Trash2 className="h-3.5 w-3.5 mr-1" />,
          },
        ]
      : []),
  ];

  const mapHeight = embedded ? "h-[320px]" : "h-[480px]";

  const mapPanel = (
    <div className={`${mapHeight} border border-black/[0.08] rounded-md overflow-hidden bg-white`}>
      <MapView
        loading={loading}
        markers={markers}
        routePoints={routePoints.length >= 2 ? routePoints : undefined}
        testid="route-detail-map"
      />
    </div>
  );

  const linkedOrderBlock =
    route?.order_public_id || route?.order_uuid ? (
      <div className="space-y-1">
        <p className="text-sm text-[#374151]">
          Linked order:{" "}
          <DetailEntityLink entityKey="order" entityId={route.order_uuid || route.order_public_id}>
            {route.order_public_id || route.order_uuid}
          </DetailEntityLink>
        </p>
        {(routePlaces.pickup !== "—" || routePlaces.dropoff !== "—") && (
          <p className="text-xs text-[#4B5563]">
            {routePlaces.pickup} <span className="text-[#9CA3AF]">→</span> {routePlaces.dropoff}
          </p>
        )}
      </div>
    ) : null;

  const stopsTable =
    stopRows.length > 0 ? (
      <DataTable
        testid="route-stops-table"
        columns={[
          { key: "sequence", header: "#", render: (r) => r.sequence },
          { key: "type", header: "Type", render: (r) => r.type || "—" },
          {
            key: "location",
            header: "Location",
            render: (r) => <span className="text-xs text-[#374151]">{r.location || "—"}</span>,
          },
          {
            key: "orderId",
            header: "Order",
            render: (r) =>
              r.orderId ? (
                <DetailEntityLink entityKey="order" entityId={r.orderId}>
                  <span className="font-mono text-xs">{r.orderId}</span>
                </DetailEntityLink>
              ) : (
                "—"
              ),
          },
          { key: "driver", header: "Driver", render: (r) => r.driver || "—" },
          {
            key: "distance",
            header: "Distance",
            render: (r) => {
              const meters = r.distance;
              if (meters == null || meters === "") return "—";
              const n = Number(meters);
              return Number.isFinite(n) && n > 1000 ? `${(n / 1000).toFixed(1)} km` : `${meters} m`;
            },
          },
          { key: "duration", header: "Duration (s)", render: (r) => r.duration ?? "—" },
        ]}
        data={stopRows}
        pageSize={25}
      />
    ) : (
      <p className="text-sm text-[#4B5563]">No stops on this route yet.</p>
    );

  const tabs = [
    {
      id: "map",
      label: "Map",
      testId: "route-tab-map",
      content: (
        <div className="p-4 space-y-4">
          {mapPanel}
          {linkedOrderBlock}
          {routeDescription && (
            <p className="text-xs font-mono text-[#4B5563] uppercase tracking-wide">{routeDescription}</p>
          )}
        </div>
      ),
    },
    {
      id: "stops",
      label: "Stops",
      badge: stopRows.length || undefined,
      testId: "route-tab-stops",
      content: <div className="p-4">{stopsTable}</div>,
    },
    {
      id: "rates",
      label: "Service rates",
      testId: "route-tab-rates",
      content: (
        <div className="p-4 max-w-md">
          <ServiceRatesForRoutePicker routeId={id} value={serviceRateId} onChange={setServiceRateId} />
        </div>
      ),
    },
  ];

  if (embedded) {
    return (
      <FleetopsDetailDrawerPage
        testId="route-detail-page"
        headerProps={{
          overline: "Route",
          title: routeTitle,
          publicId: route?.public_id || route?.uuid || id,
          status: routeStatus,
          actions: headerActions,
        }}
        tabs={{
          value: activeTabProp || "map",
          onValueChange: onTabChange,
          tabs,
        }}
        footer={
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
        }
      />
    );
  }

  return (
    <div data-testid="route-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Routes", to: "/fleet-ops/operations/routes" },
          { label: routeTitle },
        ]}
        title={routeTitle}
        description={routeDescription}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => (onClose ? onClose() : navigate(-1))}
              className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {(ability.canUpdateOrder || ability.isDispatcher) && linkedOrderIds.length > 0 && (
              <Button variant="outline" disabled={busy || loading} onClick={replanRoute} data-testid="route-replan">
                <RouteIcon className="h-4 w-4 mr-1" /> Re-plan
              </Button>
            )}
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
        {mapPanel}
        {linkedOrderBlock}
        <div className="max-w-md">
          <ServiceRatesForRoutePicker routeId={id} value={serviceRateId} onChange={setServiceRateId} />
        </div>
        {stopRows.length > 0 && stopsTable}
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
