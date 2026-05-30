import { normalizeStatus, isTerminalOrderStatus } from "@/domain/fleetops/status";

const ONLINE = new Set(["online", "active", "on_duty", "on-duty"]);

function haversineKm(a, b) {
  if (!a?.lat || !b?.lat) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Practical dispatcher suggestions from current fleet snapshot.
 */
export function buildDispatcherSuggestions(orders = [], drivers = []) {
  const suggestions = [];
  const activeOrders = orders.filter((o) => !isTerminalOrderStatus(o.status));
  const ordersByDriver = new Map();

  for (const o of activeOrders) {
    if (!o.driverId) continue;
    const k = String(o.driverId);
    ordersByDriver.set(k, (ordersByDriver.get(k) || 0) + 1);
  }

  const unassigned = activeOrders.filter((o) => !o.driverId && ["created", "dispatched"].includes(normalizeStatus(o.status)));
  if (unassigned.length) {
    suggestions.push({
      id: "unassigned-orders",
      type: "assign",
      priority: "high",
      title: `${unassigned.length} order(s) need a driver`,
      detail: "Assign available drivers to pending dispatches.",
      orderIds: unassigned.slice(0, 5).map((o) => o.id),
    });
  }

  const idleDrivers = drivers.filter(
    (d) => ONLINE.has(normalizeStatus(d.status)) && !ordersByDriver.has(String(d.id)),
  );
  if (idleDrivers.length && unassigned.length) {
    suggestions.push({
      id: "idle-drivers",
      type: "fleet",
      priority: "medium",
      title: `${idleDrivers.length} driver(s) available`,
      detail: `Consider ${idleDrivers.slice(0, 3).map((d) => d.name).join(", ")} for open orders.`,
      driverIds: idleDrivers.slice(0, 5).map((d) => d.id),
    });
  }

  const overloaded = [...ordersByDriver.entries()].filter(([, count]) => count >= 4);
  if (overloaded.length) {
    suggestions.push({
      id: "overloaded-drivers",
      type: "balance",
      priority: "high",
      title: `${overloaded.length} driver(s) may be overloaded`,
      detail: "Redistribute active orders to balance workload.",
      driverIds: overloaded.map(([id]) => id),
    });
  }

  for (const order of unassigned.slice(0, 3)) {
    if (!order.dropoff?.lat) continue;
    const nearby = drivers
      .filter((d) => ONLINE.has(normalizeStatus(d.status)) && d.location?.lat)
      .map((d) => ({ driver: d, km: haversineKm(order.dropoff, d.location) }))
      .filter((x) => x.km < 25)
      .sort((a, b) => a.km - b.km)[0];
    if (nearby) {
      suggestions.push({
        id: `nearby-${order.id}-${nearby.driver.id}`,
        type: "nearby",
        priority: "medium",
        title: `Nearby driver for ${order.publicId}`,
        detail: `${nearby.driver.name} ~${Math.round(nearby.km)} km from dropoff.`,
        orderId: order.id,
        driverId: nearby.driver.id,
      });
    }
  }

  const priority = { high: 0, medium: 1, low: 2 };
  return suggestions.sort((a, b) => priority[a.priority] - priority[b.priority]).slice(0, 6);
}
