import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import KpiCard from "@/components/common/KpiCard";
import MapView from "@/components/common/MapView";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity, Package, Plus, MapPin, Radio, Zap } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { fleetopsService } from "@/services/fleetops";
import { mapDriver, mapOrder, statusLabel } from "@/lib/mappers";
import { toast } from "sonner";
import PageLoaderOverlay from "@/components/loaders/overlays/PageLoaderOverlay";
import { useOperationalIntelligence } from "@/hooks/fleetops/useOperationalIntelligence";
import OperationalMetricsStrip from "@/components/fleetops/intelligence/OperationalMetricsStrip";
import RiskAlertsBar from "@/components/fleetops/intelligence/RiskAlertsBar";
import { useFleetopsRealtimeChannel } from "@/hooks/fleetops/useFleetopsRealtimeChannel";
import { resolveCompanyChannelId } from "@/domain/fleetops/realtime/socketConfig";
import FleetMetricsWidget from "@/components/fleetops/dashboard/FleetMetricsWidget";
import { getDashboardWidgets, registerDashboardWidget } from "@/domain/fleetops/extensions/dashboardRegistry";
import { registerIamDashboardWidgets } from "@/domain/iam/registerIamDashboard";

const accentByLabel = {
  "Open orders": "cyan",
  "Active drivers": "amber",
  "Delivered (total)": "emerald",
};

const HOURS = ["00", "04", "08", "12", "16", "20"];

function buildHourly(orders) {
  const bins = Object.fromEntries(HOURS.map((h) => [h, 0]));
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    if (Number.isNaN(d.getTime())) return;
    const hr = String(Math.floor(d.getHours() / 4) * 4).padStart(2, "0");
    if (bins[hr] !== undefined) bins[hr] += 1;
  });
  return HOURS.map((hr) => ({ hr, v: bins[hr] }));
}

export default function Dashboard() {
  const [ordersState, setOrdersState] = useState([]);
  const [driversState, setDriversState] = useState([]);
  const [loading, setLoading] = useState(true);

  const liveOrders = ordersState.filter((o) => ["en_route", "dispatched"].includes(o.status));
  const liveDrivers = driversState.filter((d) => d.status === "online");

  useEffect(() => {
    registerDashboardWidget({
      key: "fleet-metrics-core",
      order: 10,
      render: ({ orders, drivers, vehicles, routes }) => (
        <FleetMetricsWidget orders={orders} drivers={drivers} vehicles={vehicles} routes={routes} />
      ),
    });
    registerIamDashboardWidgets();
  }, []);

  useEffect(() => {
    let active = true;
    let cancelledPoll = false;

    const pollDriversOnly = async () => {
      try {
        const driversResponse = await fleetopsService.listDrivers();
        if (cancelledPoll) return;
        setDriversState(driversResponse.map(mapDriver));
      } catch {
        /* avoid toast spam — keep existing driver markers */
      }
    };

    const load = async () => {
      setLoading(true);
      try {
        const [ordersResponse, driversResponse] = await Promise.all([
          fleetopsService.listOrders(),
          fleetopsService.listDrivers(),
        ]);
        if (!active) return;
        setOrdersState(ordersResponse.map(mapOrder));
        setDriversState(driversResponse.map(mapDriver));
      } catch {
        if (active) toast.error("Could not load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const pollId = setInterval(pollDriversOnly, 45000);

    return () => {
      active = false;
      cancelledPoll = true;
      clearInterval(pollId);
    };
  }, []);

  const companyChannel = resolveCompanyChannelId();
  useFleetopsRealtimeChannel(
    companyChannel,
    () => {
      void (async () => {
        try {
          const [ordersResponse, driversResponse] = await Promise.all([
            fleetopsService.listOrders(),
            fleetopsService.listDrivers(),
          ]);
          setOrdersState(ordersResponse.map(mapOrder));
          setDriversState(driversResponse.map(mapDriver));
        } catch {
          /* silent background refresh */
        }
      })();
    },
    { enabled: Boolean(companyChannel), debounceMs: 1200 },
  );

  const { metrics, risks } = useOperationalIntelligence(ordersState, driversState);

  const ordersByHour = useMemo(() => buildHourly(ordersState), [ordersState]);
  const maxBar = Math.max(1, ...ordersByHour.map((d) => d.v));
  const dashboardWidgets = getDashboardWidgets();

  const kpis = useMemo(() => {
    const open = ordersState.filter((o) => !["delivered", "canceled"].includes(o.status)).length;
    const delivered = ordersState.filter((o) => o.status === "delivered").length;
    const mk = (id, label, value, series) => ({
      id,
      label,
      value,
      delta: "",
      trend: "neutral",
      series,
    });
    return [
      mk("open", "Open orders", open, ordersByHour.map((x) => x.v)),
      mk("drivers", "Active drivers", liveDrivers.length, liveDrivers.map((_, i) => i)),
      mk("done", "Delivered (total)", delivered, ordersState.slice(0, 7).map((o, i) => (o.status === "delivered" ? i + 2 : i))),
    ];
  }, [ordersState, liveDrivers.length, ordersByHour]);

  const recentActivity = useMemo(
    () =>
      [...ordersState]
        .filter((o) => o.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8)
        .map((o) => ({
          id: o.id,
          actor: "Operations",
          action: "updated",
          target: `${o.publicId} · ${o.customer?.name}`,
          time: statusLabel(o.status),
        })),
    [ordersState],
  );

  const mapMarkers = [
    ...liveDrivers.map((d) => ({
      id: d.id,
      lat: d.location.lat,
      lng: d.location.lng,
      label: d.name,
      popup: `${d.publicId || d.id} · ${(d.skills || []).join(", ") || "Standard"}`,
      color: "#0066FF",
      live: true,
    })),
    ...liveOrders.map((o) => ({
      id: o.id,
      lat: o.dropoff.lat,
      lng: o.dropoff.lng,
      label: o.publicId,
      popup: `${o.customer.name} · ${statusLabel(o.status)}`,
      color: "#EA580C",
    })),
  ];

  return (
    <PageLoaderOverlay loading={loading && ordersState.length === 0} message="Loading dashboard…" testId="dashboard-page-loader">
    <div data-testid="dashboard-page" className="bg-[#F5F6F8] min-h-full">
      <PageHeader
        overline="Operations · Live"
        title="Command Center"
        description={loading ? "Loading live operations data…" : "Real-time snapshot of orders and drivers across your tenant."}
        actions={
          <>
            <Button
              variant="outline"
              asChild
              className="border-black/[0.08] hover:bg-black/[0.05] hover:text-[#0A0E1A] bg-transparent text-[#374151] h-10 rounded-lg"
              data-testid="dashboard-orders-link"
            >
              <Link to="/fleet-ops/operations/orders">
                All orders <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
            <Button
              asChild
              className="bg-[#0066FF] hover:bg-[#0040CC] text-white font-semibold h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)] hover:shadow-[0_14px_32px_-8px_rgba(0,102,255,0.6)] transition-all"
              data-testid="dashboard-new-order"
            >
              <Link to="/fleet-ops/operations/orders/new">
                <Plus className="h-4 w-4 mr-1.5" /> New order
              </Link>
            </Button>
          </>
        }
      />

      <div className="p-7 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <KpiCard
              key={k.id}
              label={k.label}
              value={k.value}
              delta={k.delta}
              trend={k.trend}
              series={k.series}
              accent={accentByLabel[k.label] || "cyan"}
              testid={`kpi-${k.id}`}
            />
          ))}
        </div>
        <div className="bg-[#F5F6F8]" data-testid="dashboard-widgets-zone">
          <div className="mb-4">
            <FleetMetricsWidget orders={ordersState} drivers={driversState} vehicles={[]} routes={[]} />
          </div>
          {dashboardWidgets
            .filter((widget) => widget.key !== "fleet-metrics-core")
            .map((widget) => (
            <div key={widget.key} className="mb-4">
              {widget.render({
                orders: ordersState,
                drivers: driversState,
                vehicles: [],
                routes: [],
              })}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="relative lg:col-span-2 bg-white border border-black/[0.06] rounded-2xl overflow-hidden anim-rise">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-accent/40 to-transparent" />
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06] relative">
              <div>
                <div className="overline flex items-center gap-2">
                  <span className="status-dot text-[#00E676]" />
                  Live Fleet · Realtime
                </div>
                <div className="font-display font-black text-[22px] tracking-[-0.035em] mt-1 text-[#0A0E1A]">
                  <span className="tabular text-cyan-accent">{liveDrivers.length}</span> drivers ·{" "}
                  <span className="tabular text-cyan-accent">{liveOrders.length}</span> orders in motion
                </div>
              </div>
              <Link
                to="/fleet-ops/operations/orders"
                className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-accent hover:text-[#0A0E1A] transition-colors flex items-center gap-1.5"
              >
                Ops board <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="h-[440px] relative">
              <MapView markers={mapMarkers} testid="dashboard-map" fitOnce />
              <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-cyan-accent/40 pointer-events-none" />
              <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-cyan-accent/40 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-cyan-accent/40 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-cyan-accent/40 pointer-events-none" />
              <div className="hidden lg:flex absolute top-3 left-1/2 -translate-x-1/2 items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F6F8]/80 backdrop-blur-md border border-black/[0.08] font-mono text-[10px] tracking-[0.22em] uppercase text-[#0A0E1A]/95 pointer-events-none">
                <Radio className="h-3 w-3 text-[#00E676] animate-pulse" />
                Map · polled 45s
              </div>
            </div>
          </div>

          <div className="relative bg-white border border-black/[0.06] rounded-2xl overflow-hidden anim-rise">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
              <div>
                <div className="overline flex items-center gap-2">
                  <Zap className="h-3 w-3 text-cyan-accent" /> Throughput · sampled
                </div>
                <div className="font-display font-black text-[22px] tracking-[-0.035em] mt-1 text-[#0A0E1A]">Orders by bucket</div>
              </div>
            </div>
            <div className="h-[440px] p-3 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByHour} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bar-cyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0066FF" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0066FF" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(10,14,26,0.06)" vertical={false} />
                  <XAxis
                    dataKey="hr"
                    stroke="#9CA3AF"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                  />
                  <YAxis stroke="#9CA3AF" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,102,255,0.25)",
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "JetBrains Mono",
                      padding: "8px 12px",
                      boxShadow: "0 12px 28px -8px rgba(10,14,26,0.12)",
                    }}
                    cursor={{ fill: "rgba(0,102,255,0.06)" }}
                    labelStyle={{ color: "#6B7280", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}
                    itemStyle={{ color: "#0066FF" }}
                  />
                  <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                    {ordersByHour.map((entry, idx) => (
                      <Cell key={idx} fill={entry.v === maxBar ? "#0066FF" : "url(#bar-cyan)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-black/[0.06] rounded-2xl overflow-hidden anim-rise">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
              <div>
                <div className="overline flex items-center gap-2">
                  <Package className="h-3 w-3 text-cyan-accent" /> Recent Orders
                </div>
                <div className="font-display font-black text-[22px] tracking-[-0.035em] mt-1 text-[#0A0E1A]">Latest activity</div>
              </div>
              <Link
                to="/fleet-ops/operations/orders"
                className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-accent hover:text-[#0A0E1A] transition-colors flex items-center gap-1.5"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  {["Order", "Customer", "Route", "Status", "Total"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.22em] font-mono font-semibold text-[#4B5563] border-b border-black/[0.06]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordersState.slice(0, 6).map((o, i) => (
                  <tr
                    key={o.id}
                    className="border-b border-white/[0.04] hover:bg-black/[0.03] transition-colors group"
                    style={{ animation: `rise 0.4s cubic-bezier(0.22,0.8,0.32,1) both`, animationDelay: `${i * 50}ms` }}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/fleet-ops/operations/orders/${o.id}`}
                        className="font-mono text-[12px] text-cyan-accent hover:text-[#0A0E1A] transition-colors"
                      >
                        {o.publicId}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#0A0E1A]">{o.customer.name}</td>
                    <td className="px-5 py-3.5 text-[11px] text-[#374151] font-mono tracking-tight">
                      {(o.pickup?.name || "—").split(" ")[0]} <span className="text-cyan-accent/50">→</span> {(o.dropoff?.name || "—").split(" ")[0]}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.status} label={statusLabel(o.status)} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[13px] tabular text-right text-[#0A0E1A]">${Number(o.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && ordersState.length === 0 && (
              <div className="p-8 text-center text-sm text-[#4B5563]">No orders yet for this workspace.</div>
            )}
          </div>

          <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden anim-rise">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
              <div>
                <div className="overline flex items-center gap-2">
                  <Activity className="h-3 w-3 text-cyan-accent" /> Activity Stream
                </div>
                <div className="font-display font-black text-[22px] tracking-[-0.035em] mt-1 text-[#0A0E1A]">Recent orders</div>
              </div>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {recentActivity.map((a, i) => (
                <div
                  key={a.id}
                  className="p-5 text-sm hover:bg-black/[0.025] transition-colors"
                  style={{ animation: `rise 0.4s cubic-bezier(0.22,0.8,0.32,1) both`, animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 grid place-items-center bg-cyan-accent/[0.08] border border-cyan-accent/20 rounded-lg shrink-0">
                      <MapPin className="h-3.5 w-3.5 text-cyan-accent" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] leading-snug">
                        <span className="font-semibold text-[#0A0E1A]">{a.actor}</span> <span className="text-[#374151]">{a.action}</span>{" "}
                        <span className="text-[#0A0E1A]">{a.target}</span>
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#4B5563] mt-1.5">{a.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && recentActivity.length === 0 && (
                <div className="p-8 text-center text-sm text-[#4B5563]">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLoaderOverlay>
  );
}
