import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "@/components/common/MapView";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseApiError } from "@/lib/errors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import {
  assignmentsForCommit,
  extractStopsFromOrders,
  normalizeOptimizationResult,
  runRouteOptimization,
} from "@/lib/fleetops/routing";
import { pickAllocationEngine } from "@/lib/fleetops/allocation";
import RouteOrderPicker from "@/components/fleetops/routing/RouteOrderPicker";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Sparkles, Save } from "lucide-react";

const STEPS = ["Stops", "Engine", "Optimize", "Save"];

async function loadOrdersByIds(orderIds) {
  const loaded = [];
  for (const id of orderIds) {
    try {
      loaded.push(await fleetopsService.getOrder(id));
    } catch {
      /* skip missing */
    }
  }
  return loaded;
}

export default function RouteOptimizationWizard({
  orderIds = [],
  allowOrderSelection = false,
  onComplete,
}) {
  const navigate = useNavigate();
  const hasPrefilledOrders = orderIds.length > 0;
  const needsOrderSelection = allowOrderSelection && !hasPrefilledOrders;

  const [step, setStep] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(!needsOrderSelection);
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState("greedy");
  const [engines, setEngines] = useState([]);
  const [result, setResult] = useState(null);
  const [routingSettings, setRoutingSettings] = useState({});
  const [ordersConfirmed, setOrdersConfirmed] = useState(hasPrefilledOrders);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const stops = useMemo(() => extractStopsFromOrders(orders), [orders]);

  const loadEngines = useCallback(async () => {
    const [engineList, settings] = await Promise.all([
      fleetopsService.getOrchestratorEngines().catch(() => []),
      fleetopsService.getRoutingSettings().catch(() => ({})),
    ]);
    setEngines(engineList);
    setRoutingSettings(settings);
    setEngine(pickAllocationEngine(engineList, settings?.default_engine || "greedy"));
  }, []);

  const loadPrefilledOrders = useCallback(async () => {
    setLoading(true);
    try {
      await loadEngines();
      setOrders(await loadOrdersByIds(orderIds));
      setOrdersConfirmed(true);
    } finally {
      setLoading(false);
    }
  }, [loadEngines, orderIds]);

  useEffect(() => {
    if (hasPrefilledOrders) {
      loadPrefilledOrders();
    } else if (!needsOrderSelection) {
      loadEngines().finally(() => setLoading(false));
    }
  }, [hasPrefilledOrders, needsOrderSelection, loadPrefilledOrders, loadEngines]);

  const handleConfirmOrderSelection = async () => {
    const ids = [...selectedKeys];
    if (!ids.length) {
      toast.error("Select at least one order");
      return;
    }
    setBusy(true);
    setLoading(true);
    try {
      await loadEngines();
      setOrders(await loadOrdersByIds(ids));
      setOrdersConfirmed(true);
      setStep(0);
    } catch (err) {
      toast.error(parseApiError(err, "Failed to load selected orders"));
    } finally {
      setBusy(false);
      setLoading(false);
    }
  };

  const mapMarkers = useMemo(
    () =>
      (result?.sequencedStops?.length ? result.sequencedStops : stops).map((s, i) => ({
        id: s.id || `stop-${i}`,
        lat: s.lat,
        lng: s.lng,
        label: String(i + 1),
        popup: `${s.name} (${s.type})`,
        color: s.type === "pickup" ? "#10B981" : s.type === "dropoff" ? "#F59E0B" : "#0066FF",
      })),
    [result, stops],
  );

  const routePoints = useMemo(() => {
    const activeStops = result?.sequencedStops?.length ? result.sequencedStops : stops;
    return activeStops
      .filter((stop) => stop.lat != null && stop.lng != null)
      .map((stop) => [Number(stop.lat), Number(stop.lng)]);
  }, [result, stops]);

  const handleOptimize = async () => {
    setBusy(true);
    try {
      const orderPublicIds = orders.map((o) => o.public_id || o.publicId || o.uuid || o.id).filter(Boolean);
      const normalized = await runRouteOptimization({ orders, orderIds: orderPublicIds, engine });
      if (!normalized.assignments?.length) {
        const msg = normalized.raw?.message || "No route assignments returned. Check drivers/vehicles and order stops.";
        throw new Error(msg);
      }
      setResult(normalized);
      setStep(2);
      toast.success(`Optimized ${normalized.assignments.length} assignment(s)`);
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!result?.assignments?.length) {
      toast.error("Run optimization first");
      return;
    }
    setBusy(true);
    try {
      const commitBody = assignmentsForCommit(result.assignments);
      const commitResult = await fleetopsService.runOrchestratorCommit(commitBody);

      const manifestId = commitResult?.manifests?.[0];
      let savedRouteId = null;
      for (const order of orders) {
        const oid = order?.uuid || order?.id;
        if (!oid) continue;
        try {
          const created = await fleetopsService.createRoute({
            order_uuid: oid,
            details: {
              assignments: result.assignments,
              polyline: result.polyline,
              stops: result.sequencedStops,
            },
            total_distance: Math.round(result.totalDistance || 0),
            total_time: Math.round(result.totalDuration || 0),
          });
          if (!savedRouteId) {
            savedRouteId = created?.uuid || created?.id || created?.public_id || null;
          }
        } catch {
          /* route may already exist */
        }
      }

      toast.success(
        savedRouteId
          ? "Route plan saved"
          : manifestId
            ? `Plan saved — manifest ${manifestId}`
            : "Route plan committed",
      );
      onComplete?.({ manifestId, savedRouteId, commitResult, result });
      if (savedRouteId) {
        navigate(`/fleet-ops/operations/routes?route=${encodeURIComponent(savedRouteId)}`);
      } else if (manifestId) {
        navigate(`/fleet-ops/admin/manifests/${manifestId}`);
      } else {
        navigate("/fleet-ops/operations/routes");
      }
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (needsOrderSelection && !ordersConfirmed) {
    return (
      <div className="space-y-4" data-testid="route-optimization-wizard">
        <div className="overline">Step 1 · Select orders</div>
        <p className="text-sm text-[#4B5563]">
          Choose open orders to include in this route plan. You can also plan routes from the Orders map by selecting orders and clicking Plan routes.
        </p>
        <RouteOrderPicker
          selectedKeys={selectedKeys}
          onSelectedKeysChange={setSelectedKeys}
          onContinue={handleConfirmOrderSelection}
          continueLabel="Review stops"
          disabled={busy}
        />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-[#4B5563]" data-testid="route-wizard-loading">Loading orders…</div>;
  }

  return (
    <div className="space-y-4" data-testid="route-optimization-wizard">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#4B5563]">
        {STEPS.map((label, i) => (
          <span key={label} className={i === step ? "text-[#0066FF] font-semibold" : ""}>
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {needsOrderSelection && ordersConfirmed ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-[#374151]">{orders.length} order(s) in plan</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={busy}
            onClick={() => {
              setOrders([]);
              setOrdersConfirmed(false);
              setResult(null);
              setStep(0);
            }}
            data-testid="route-wizard-change-orders"
          >
            Change orders
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-3 min-h-[320px]">
          {step === 0 && (
            <>
              <div className="overline">Stops ({stops.length})</div>
              <ol className="text-sm space-y-1 max-h-64 overflow-auto">
                {stops.map((s, i) => (
                  <li key={s.id} className="font-mono text-xs">
                    {i + 1}. {s.name} <span className="text-[#6B7280]">({s.type})</span>
                  </li>
                ))}
              </ol>
              {!stops.length && <p className="text-sm text-[#4B5563]">No geocoded stops on selected orders.</p>}
            </>
          )}
          {step === 1 && (
            <>
              <div className="overline">Optimization engine</div>
              <Label className="text-xs">Engine</Label>
              <Select value={engine} onValueChange={setEngine}>
                <SelectTrigger data-testid="route-wizard-engine">
                  <SelectValue placeholder="Select engine" />
                </SelectTrigger>
                <SelectContent>
                  {(engines.length ? engines : [{ id: "greedy", name: "Greedy" }, { id: "vroom", name: "VROOM" }]).map((e) => {
                    const id = typeof e === "string" ? e : e.id || e.identifier || e.name;
                    const label = typeof e === "string" ? e : e.name || id;
                    return (
                      <SelectItem key={id} value={String(id).toLowerCase()}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {routingSettings?.osrm_host && (
                <p className="text-xs text-[#6B7280]">OSRM host: {routingSettings.osrm_host}</p>
              )}
              {routingSettings?.vroom_host && (
                <p className="text-xs text-[#6B7280]">VROOM host: {routingSettings.vroom_host}</p>
              )}
            </>
          )}
          {(step === 2 || step === 3) && result && (
            <>
              <div className="overline">Optimization result</div>
              <p className="text-sm">
                Distance: <span className="font-mono">{Math.round(result.totalDistance || 0)} m</span>
                {" · "}
                Duration: <span className="font-mono">{Math.round(result.totalDuration || 0)} s</span>
              </p>
              <ul className="text-xs space-y-1 max-h-48 overflow-auto">
                {result.assignments.map((a, i) => (
                  <li key={a.order_id || i} className="font-mono">
                    #{a.sequence ?? i + 1} {a.order_id} → driver {a.driver_id || "—"} / vehicle {a.vehicle_id || "—"}
                  </li>
                ))}
              </ul>
              {result.unassigned?.length > 0 && (
                <p className="text-xs text-amber-700">Unassigned: {result.unassigned.join(", ")}</p>
              )}
            </>
          )}
        </div>

        <div className="h-[320px] border border-black/[0.08] rounded-md overflow-hidden bg-white">
          <MapView markers={mapMarkers} routePoints={routePoints.length >= 2 ? routePoints : undefined} testid="route-wizard-map" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {step > 0 && (
          <Button type="button" variant="outline" disabled={busy} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}
        {step === 0 && (
          <Button type="button" disabled={!stops.length || busy} onClick={() => setStep(1)} data-testid="route-wizard-next">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        {step === 1 && (
          <Button type="button" disabled={busy} onClick={handleOptimize} data-testid="route-wizard-optimize">
            <Sparkles className="h-4 w-4 mr-1" /> {busy ? "Optimizing…" : "Optimize route"}
          </Button>
        )}
        {step === 2 && (
          <Button type="button" disabled={busy} onClick={() => setStep(3)} data-testid="route-wizard-review">
            Review & save <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        {step === 3 && (
          <Button type="button" disabled={busy} onClick={handleSave} data-testid="route-wizard-save">
            <Save className="h-4 w-4 mr-1" /> {busy ? "Saving…" : "Save plan"}
          </Button>
        )}
      </div>
    </div>
  );
}
