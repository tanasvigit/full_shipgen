import { useMemo } from "react";
import { useOperationalIntelligence } from "@/hooks/fleetops/useOperationalIntelligence";

export default function FleetMetricsWidget({ orders = [], drivers = [], vehicles = [], routes = [] }) {
  const { metrics } = useOperationalIntelligence(orders, drivers);
  const activeVehicleCount =
    vehicles.length ||
    new Set(
      orders
        .map((order) => order?.vehicleId || order?.vehicle_assigned_uuid || order?.vehicle_assigned_id)
        .filter(Boolean),
    ).size;
  const routeCount = routes.length || orders.filter((order) => order?.route || order?.route_uuid).length;
  const cards = useMemo(
    () => [
      { key: "orders", label: "Active orders", value: metrics?.activeOrders ?? 0 },
      { key: "drivers", label: "Active drivers", value: metrics?.activeDrivers ?? 0 },
      { key: "vehicles", label: "Active vehicles", value: activeVehicleCount },
      { key: "routes", label: "Route count", value: routeCount },
    ],
    [metrics, activeVehicleCount, routeCount],
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="fleet-metrics-widget">
      {cards.map((card) => (
        <div key={card.key} className="rounded-md border border-black/[0.08] bg-white p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#6B7280] font-mono">{card.label}</div>
          <div className="text-xl font-semibold text-[#0A0E1A]" data-testid={`fleet-metric-${card.key}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
