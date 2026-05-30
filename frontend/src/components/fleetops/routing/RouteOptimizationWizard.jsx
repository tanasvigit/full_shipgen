import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "@/components/common/MapView";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import {
  assignmentsForCommit,
  extractStopsFromOrders,
  normalizeOptimizationResult,
  runRouteOptimization,
} from "@/lib/fleetops/routing";
import { pickAllocationEngine } from "@/lib/fleetops/allocation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Sparkles, Save } from "lucide-react";

const STEPS = ["Stops", "Engine", "Optimize", "Save"];

export default function RouteOptimizationWizard({ orderIds = [], onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState("greedy");
  const [engines, setEngines] = useState([]);
  const [result, setResult] = useState(null);
  const [routingSettings, setRoutingSettings] = useState({});

  const stops = useMemo(() => extractStopsFromOrders(orders), [orders]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [engineList, settings] = await Promise.all([
        fleetopsService.getOrchestratorEngines().catch(() => []),
        fleetopsService.getRoutingSettings().catch(() => ({})),
      ]);
      setEngines(engineList);
      setRoutingSettings(settings);
      setEngine(pickAllocationEngine(engineList, settings?.default_engine || "greedy"));

      const loaded = [];
      for (const id of orderIds) {
        try {
          loaded.push(await fleetopsService.getOrder(id));
        } catch {
          /* skip missing */
        }
      }
      setOrders(loaded);
    } finally {
      setLoading(false);
    }
  }, [orderIds]);

  useEffect(() => {
    load();
  }, [load]);

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

  const polyline = result?.polyline?.length >= 2 ? result.polyline : stops.map((s) => [s.lat, s.lng]).filter((p) => p[0] != null);

  const handleOptimize = async () => {
    setBusy(true);
    try {
      const normalized = await runRouteOptimization({ orders, orderIds, engine });
      setResult(normalized);
      setStep(2);
      toast.success(`Optimized ${normalized.assignments.length} assignment(s)`);
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
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
      for (const order of orders) {
        const oid = order?.uuid || order?.id;
        if (!oid) continue;
        try {
          await fleetopsService.createRoute({
            order_uuid: oid,
            details: { assignments: result.assignments, polyline: result.polyline },
            total_distance: result.totalDistance,
            total_time: result.totalDuration,
          });
        } catch {
          /* route may already exist */
        }
      }

      toast.success(manifestId ? `Plan saved — manifest ${manifestId}` : "Route plan committed");
      onComplete?.({ manifestId, commitResult, result });
      if (manifestId) {
        navigate(`/fleet-ops/operations/routes/${manifestId}`);
      } else {
        navigate("/fleet-ops/operations/routes");
      }
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

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
          <MapView markers={mapMarkers} routePoints={polyline.length >= 2 ? polyline : undefined} testid="route-wizard-map" />
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
