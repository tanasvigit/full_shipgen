import { useEffect, useMemo, useState } from "react";
import { fleetopsService } from "@/services/fleetops";

/**
 * Ember key-metrics widget — loads GET /fleet-ops/metrics/ (G051).
 */
export default function FleetMetricsWidget({ orders = [], drivers = [], vehicles = [], routes = [], className = "" }) {
  const [apiMetrics, setApiMetrics] = useState(null);

  useEffect(() => {
    fleetopsService
      .getFleetOpsMetrics()
      .then(setApiMetrics)
      .catch(() => setApiMetrics(null));
  }, []);

  const cards = useMemo(() => {
    if (apiMetrics && typeof apiMetrics === "object" && Object.keys(apiMetrics).length > 0) {
      const entries = Object.entries(apiMetrics).slice(0, 8);
      return entries.map(([key, value]) => ({
        key,
        label: key.replace(/_/g, " "),
        value: typeof value === "object" ? JSON.stringify(value) : value,
      }));
    }
    const activeOrders = orders.filter((o) => !["delivered", "canceled", "cancelled"].includes(String(o.status || "").toLowerCase())).length;
    const activeDrivers = drivers.filter((d) => ["online", "active", "on_duty"].includes(String(d.status || "").toLowerCase())).length;
    const activeVehicles =
      vehicles.length ||
      new Set(orders.map((o) => o?.vehicleId || o?.vehicle_assigned_uuid).filter(Boolean)).size;
    return [
      { key: "orders", label: "Active orders", value: activeOrders },
      { key: "drivers", label: "Active drivers", value: activeDrivers },
      { key: "vehicles", label: "Active vehicles", value: activeVehicles },
      { key: "routes", label: "Routes", value: routes.length },
    ];
  }, [apiMetrics, orders, drivers, vehicles, routes]);

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`} data-testid="fleet-metrics-widget">
      {cards.map((card) => (
        <div key={card.key} className="rounded-md border border-black/[0.08] bg-white p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#6B7280] font-mono">{card.label}</div>
          <div className="text-xl font-semibold text-[#0A0E1A] tabular" data-testid={`fleet-metric-${card.key}`}>
            {card.value ?? "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
