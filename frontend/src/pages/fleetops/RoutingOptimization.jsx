import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import MapView from "@/components/common/MapView";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Route as RouteIcon, TrendingDown, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { fleetopsService } from "@/services/fleetops";
import { mapOrder, statusLabel } from "@/lib/mappers";

function planFromOrder(orderRaw) {
  const o = mapOrder(orderRaw);
  const pickup = o.pickup || {};
  const dropoff = o.dropoff || {};
  const points = [];
  if (pickup.lat && pickup.lng) points.push([Number(pickup.lat), Number(pickup.lng)]);
  if (dropoff.lat && dropoff.lng) points.push([Number(dropoff.lat), Number(dropoff.lng)]);
  const driverLabel = o.driverId ? String(o.driverId).slice(0, 8) : "Unassigned";

  return {
    id: o.id,
    publicId: o.publicId,
    name: `${pickup.name || "Pickup"} → ${dropoff.name || "Dropoff"}`,
    driver: driverLabel,
    vehicle: `${o.customer?.name || "Customer"}`,
    distance: Number(o.distance || 0),
    eta: String(o.eta || "—"),
    status: o.status,
    total: Number(o.total || 0),
    points,
  };
}

export default function RoutingOptimization() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fleetopsService.listOrders();
      const openOrders = rows.filter((r) => !["delivered", "canceled"].includes(String(r.status || "").toLowerCase()));
      const mapped = openOrders.map(planFromOrder);
      setPlans(mapped);
      setActiveId((prev) => {
        if (prev && mapped.some((p) => p.id === prev)) return prev;
        return mapped[0]?.id || null;
      });
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load orders for routing view.");
      setPlans([]);
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const active = plans.find((r) => r.id === activeId);

  const avgDistance = plans.length ? plans.reduce((s, p) => s + (p.distance || 0), 0) / plans.length : 0;

  return (
    <div data-testid="routing-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Operations" }, { label: "Routing" }]}
        overline="Operations · Live routes"
        title="Routing"
        description={
          loading ? "Loading open orders…" : `${plans.length} open orders · ~${avgDistance.toFixed(1)} km avg. reported distance`
        }
        actions={
          <>
            <Button variant="outline" className="bg-white border-black/[0.08] hover:bg-[#F5F6F8] text-[#374151] h-10 rounded-lg" onClick={() => reload()} data-testid="routing-refresh">
              Refresh
            </Button>
            <Button asChild variant="outline" className="bg-white border-black/[0.08] hover:bg-[#F5F6F8] text-[#374151] h-10 rounded-lg">
              <Link to="/fleet-ops/operations/orders/new" data-testid="routing-new-order">
                New order
              </Link>
            </Button>
          </>
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">
        <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-black/[0.06] overline flex items-center gap-2">
            <RouteIcon className="h-3 w-3" /> Open orders · {plans.length}
          </div>
          {!loading && plans.length === 0 && (
            <div className="p-4 text-sm text-[#4B5563]" data-testid="routing-empty">
              No active orders with routing context. Completed or canceled orders are hidden.
            </div>
          )}
          {plans.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              data-testid={`route-${r.id}`}
              className={`w-full text-left px-4 py-3 transition-colors border-l-2 border-b border-black/[0.05] ${
                activeId === r.id ? "bg-[#0066FF]/[0.08] border-l-[#0066FF]" : "hover:bg-[#F5F6F8] border-l-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] text-[#0066FF]">{r.publicId}</div>
                <StatusBadge status={r.status} label={statusLabel(r.status)} />
              </div>
              <div className="font-medium text-sm mt-1 truncate text-[#0A0E1A]">{r.name}</div>
              <div className="text-[11px] text-[#374151] mt-1 truncate">
                {r.vehicle} · Driver ref {r.driver}
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">
                <span>{r.distance ? `${r.distance} km` : "— km"}</span>
                <span>ETA {r.eta}</span>
              </div>
            </button>
          ))}
        </div>

        {active && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Metric icon={TrendingDown} label="Distance (API)" baseline="—" value={`${active.distance || 0} km`} delta="live" accent="emerald" />
              <Metric icon={Clock} label="ETA" baseline="—" value={active.eta} delta="live" accent="blue" />
              <Metric icon={Package} label="Order total" baseline="—" value={`$${active.total.toFixed(2)}`} delta={statusLabel(active.status)} accent="emerald" />
            </div>
            <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-black/[0.06]">
                <div>
                  <div className="overline">{active.publicId}</div>
                  <div className="font-display font-bold text-lg tracking-tight text-[#0A0E1A]">{active.name}</div>
                </div>
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link to={`/fleet-ops/operations/orders/${active.id}`}>Open order</Link>
                </Button>
              </div>
              <div className="h-[460px]">
                {active.points.length >= 2 ? (
                  <MapView
                    routePoints={active.points}
                    markers={active.points.map((p, i) => ({
                      id: `stop-${i}`,
                      lat: p[0],
                      lng: p[1],
                      label: i === 0 ? "Pickup" : "Dropoff",
                      color: i === 0 ? "#16A34A" : "#0066FF",
                    }))}
                    testid="routing-map"
                  />
                ) : (
                  <div className="h-full grid place-items-center text-sm text-[#4B5563] p-6" data-testid="routing-map-missing-coords">
                    Pickup/drop-off coordinates missing for this order — map unavailable until places include lat/lng.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, baseline, value, delta, accent = "default" }) {
  const cls =
    accent === "emerald" ? "text-[#15803D]" : accent === "blue" ? "text-[#0066FF]" : "text-[#0A0E1A]";
  return (
    <div className="bg-white border border-black/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="overline flex items-center gap-1.5">
          <Icon className="h-3 w-3" /> {label}
        </div>
        <span className={`text-[10px] font-mono font-semibold ${cls}`}>{delta}</span>
      </div>
      <div className="font-display text-2xl font-black tabular tracking-tight mt-2 text-[#0A0E1A]">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-[#4B5563] mt-0.5">Baseline {baseline}</div>
    </div>
  );
}
