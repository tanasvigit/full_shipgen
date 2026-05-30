import { normalizeStatus, TERMINAL_ORDER_STATUSES, isTerminalOrderStatus } from "@/domain/fleetops/status";

const STALL_MS = 90 * 60 * 1000;

function ts(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Per-order delivery risk signals (heuristic, no ML).
 * @returns {{ level: 'info'|'warning'|'danger', code: string, message: string }[]}
 */
export function evaluateOrderDeliveryRisks(order, { now = Date.now(), driver } = {}) {
  if (!order) return [];
  const risks = [];
  const status = normalizeStatus(order.status);
  const updated = ts(order.updatedAt) || ts(order.createdAt) || now;
  const age = now - updated;

  if (status === "delayed" || status === "failed") {
    risks.push({
      level: "danger",
      code: "status-delayed",
      message: `Order is ${status.replace(/_/g, " ")}.`,
    });
  }

  if (!isTerminalOrderStatus(status) && age > STALL_MS) {
    risks.push({
      level: "warning",
      code: "stalled",
      message: `No progress for ${Math.round(age / 60000)} minutes.`,
    });
  }

  if (["created", "dispatched"].includes(status) && !order.driverId) {
    risks.push({
      level: "warning",
      code: "unassigned",
      message: "No driver assigned yet.",
    });
  }

  if (order.priority === "high" && !isTerminalOrderStatus(status)) {
    risks.push({
      level: "warning",
      code: "high-priority",
      message: "High priority — monitor closely.",
    });
  }

  const scheduled = ts(order.scheduledAt);
  if (scheduled && scheduled < now && ["created", "dispatched"].includes(status)) {
    risks.push({
      level: "danger",
      code: "pickup-late",
      message: "Scheduled pickup window passed.",
    });
  }

  if (driver && normalizeStatus(driver.status) === "offline" && ["dispatched", "en_route", "started"].includes(status)) {
    risks.push({
      level: "danger",
      code: "driver-offline",
      message: "Assigned driver appears offline.",
    });
  }

  if (["delivered", "completed"].includes(status) && order.podRequired && !order.hasProof) {
    risks.push({
      level: "warning",
      code: "proof-missing",
      message: "Proof of delivery may be missing.",
    });
  }

  return risks;
}

/** Fleet-wide risk summary for alerts strip. */
export function evaluateFleetDeliveryRisks(orders = [], drivers = [], options = {}) {
  const now = options.now || Date.now();
  const driverById = new Map(drivers.map((d) => [String(d.id), d]));
  const flagged = [];

  for (const order of orders) {
    const driver = order.driverId ? driverById.get(String(order.driverId)) : null;
    const risks = evaluateOrderDeliveryRisks(order, { now, driver });
    const top = risks.sort((a, b) => (b.level === "danger" ? 1 : 0) - (a.level === "danger" ? 1 : 0))[0];
    if (top) flagged.push({ orderId: order.id, publicId: order.publicId, ...top });
  }

  const danger = flagged.filter((f) => f.level === "danger");
  const warning = flagged.filter((f) => f.level === "warning");

  return {
    flagged,
    dangerCount: danger.length,
    warningCount: warning.length,
    topAlerts: [...danger, ...warning].slice(0, 8),
  };
}

export function orderRiskLevel(risks = []) {
  if (risks.some((r) => r.level === "danger")) return "danger";
  if (risks.some((r) => r.level === "warning")) return "warning";
  return null;
}
