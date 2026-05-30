import { normalizeStatus, TERMINAL_ORDER_STATUSES } from "@/domain/fleetops/status";

const ACTIVE_DRIVER_STATUSES = new Set(["online", "active", "on_duty", "on-duty"]);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function parseTs(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Aggregate dispatcher KPIs from mapped orders + drivers. */
export function computeOperationalMetrics(orders = [], drivers = []) {
  const now = Date.now();
  const today0 = startOfToday();
  const terminal = new Set(TERMINAL_ORDER_STATUSES);

  const byStatus = {};
  let activeOrders = 0;
  let delayedOrders = 0;
  let slaRisk = 0;
  let completedToday = 0;
  let failedDeliveries = 0;
  let totalDeliveryMs = 0;
  let deliveryCount = 0;

  for (const order of orders) {
    const status = normalizeStatus(order.status);
    byStatus[status] = (byStatus[status] || 0) + 1;

    if (!terminal.has(status)) activeOrders += 1;
    if (status === "delayed" || status === "failed") delayedOrders += 1;
    if (status === "failed") failedDeliveries += 1;

    const created = parseTs(order.createdAt);
    const updated = parseTs(order.updatedAt) || created;
    if (["delivered", "completed"].includes(status) && updated && updated >= today0) {
      completedToday += 1;
      if (created && updated > created) {
        totalDeliveryMs += updated - created;
        deliveryCount += 1;
      }
    }

    if (!terminal.has(status) && created && now - created > 4 * 60 * 60 * 1000) {
      slaRisk += 1;
    }
    if (order.priority === "high" && !terminal.has(status)) {
      slaRisk += 0; // already counted via age — high priority flag in risk engine
    }
  }

  const activeDrivers = drivers.filter((d) => ACTIVE_DRIVER_STATUSES.has(normalizeStatus(d.status))).length;
  const driversWithJobs = new Set(
    orders
      .filter((o) => o.driverId && !terminal.has(normalizeStatus(o.status)))
      .map((o) => String(o.driverId)),
  ).size;
  const utilization =
    drivers.length > 0 ? Math.round((driversWithJobs / drivers.length) * 100) : 0;

  const avgDeliveryHours =
    deliveryCount > 0 ? Math.round((totalDeliveryMs / deliveryCount / 3600000) * 10) / 10 : null;

  return {
    activeOrders,
    delayedOrders,
    completedToday,
    activeDrivers,
    failedDeliveries,
    avgDeliveryHours,
    slaRisk,
    ordersByStatus: Object.entries(byStatus)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    driverUtilization: utilization,
    totalOrders: orders.length,
    totalDrivers: drivers.length,
  };
}
