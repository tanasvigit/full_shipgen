/**
 * Operational recommendations derived from live Control Tower alerts and yard data.
 */

import controlTowerAlertsApi from "./controlTowerAlertsApi";
import ymsApi from "./ymsApi";
import { formatINR } from "../data/db";

const MODULE_META = {
  "Queue Congestion": { module: "Queue Congestion", savings: 0 },
  "Loading Delay": { module: "Loading Delay", savings: 0 },
  "Resource Shortage": { module: "Resource Shortage", savings: 0 },
  "Dock Blocked": { module: "Dock Blocked", savings: 0 },
  "Exit Delay": { module: "Exit Delay", savings: 0 },
  "Yard Capacity": { module: "Yard Capacity", savings: 0 },
};

function alertToInsight(alert) {
  const type = alert.alertType || "";
  const plate = alert.vehicle || "—";
  const dock = alert.dock ? ` · ${alert.dock}` : "";
  const duration = alert.durationMin != null ? `${alert.durationMin} min` : "";
  const severity = (alert.severity || "INFO").toUpperCase();

  const map = {
    VEHICLE_WAITING_TOO_LONG: {
      module: "Queue Congestion",
      title: `Reduce wait for ${plate}`,
      impact: `Vehicle waiting ${duration} in queue`,
      confidence: 85,
      severity: "warning",
    },
    LOADING_DELAY: {
      module: "Loading Delay",
      title: `Loading overrun — ${plate}`,
      impact: `Loading exceeded service time${dock}`,
      confidence: 90,
      severity: "warning",
    },
    LOADING_EXCEPTION: {
      module: "Loading Delay",
      title: `Resolve ${alert.exceptionType || "exception"} — ${plate}`,
      impact: `Open loading exception on dock${dock}`,
      confidence: 88,
      severity: severity === "CRITICAL" ? "critical" : "warning",
    },
    LABOR_UNAVAILABLE: {
      module: "Resource Shortage",
      title: `Assign labor to ${plate}`,
      impact: `Labor not available for dock assignment${dock}`,
      confidence: 92,
      severity: "warning",
    },
    EQUIPMENT_UNAVAILABLE: {
      module: "Resource Shortage",
      title: `Assign equipment to ${plate}`,
      impact: `Equipment not available${dock}`,
      confidence: 90,
      severity: "warning",
    },
    DOCK_BLOCKED: {
      module: "Dock Blocked",
      title: `Clear dock blockage — ${alert.dock || plate}`,
      impact: `Dock blocked ${duration}${dock}`,
      confidence: 95,
      severity: "critical",
    },
    EXIT_HOLDING_DELAY: {
      module: "Exit Delay",
      title: `Expedite exit for ${plate}`,
      impact: `Vehicle in exit holding ${duration}`,
      confidence: 80,
      severity: "warning",
    },
    HAZMAT_SLA_BREACH: {
      module: "Queue Congestion",
      title: `Hazmat SLA breach — ${plate}`,
      impact: `Hazmat vehicle waiting ${duration}`,
      confidence: 98,
      severity: "critical",
    },
  };

  const base = map[type] || {
    module: "Operational Alert",
    title: `${type.replace(/_/g, " ")} — ${plate}`,
    impact: alert.appointment || duration || "Review in Control Tower",
    confidence: 75,
    severity: severity === "CRITICAL" ? "critical" : "warning",
  };

  return {
    id: alert.id,
    ...base,
    savings: 0,
    source: "control-tower",
    alertType: type,
    vehicle: plate,
    dock: alert.dock,
    createdAt: alert.createdAt,
  };
}

async function buildCapacityInsight(vehicles) {
  const inYard = vehicles.filter((v) => v.status && !["EXITED", "CANCELLED"].includes(v.status));
  const capacity = 40;
  const pct = Math.round((inYard.length / capacity) * 100);
  if (pct < 85) return null;
  return {
    id: "yard-capacity-insight",
    module: "Yard Capacity",
    title: "Yard nearing capacity",
    impact: `${inYard.length} vehicles in yard (${pct}% of ${capacity} capacity)`,
    savings: 0,
    confidence: 90,
    severity: pct >= 95 ? "critical" : "warning",
    source: "yard-metrics",
  };
}

export async function fetchOperationalInsights() {
  const [alertsBundle, vehicles] = await Promise.all([
    controlTowerAlertsApi.fetchControlTowerAlerts().catch(() => ({
      activeAlerts: [],
      criticalCount: 0,
      warningCount: 0,
    })),
    ymsApi.listVehicles({ limit: 500 }).catch(() => []),
  ]);

  const vehicleList = Array.isArray(vehicles) ? vehicles : vehicles?.items || [];
  const fromAlerts = (alertsBundle.activeAlerts || []).map(alertToInsight);
  const capacity = await buildCapacityInsight(vehicleList);
  const insights = capacity ? [capacity, ...fromAlerts] : fromAlerts;

  const waitingAlerts = fromAlerts.filter((i) => i.module === "Queue Congestion").length;
  const detentionEstimate = waitingAlerts * 3500;

  return {
    insights: insights.slice(0, 12),
    summary: {
      total: insights.length,
      critical: alertsBundle.criticalCount ?? 0,
      warning: alertsBundle.warningCount ?? 0,
      activeAlerts: (alertsBundle.activeAlerts || []).length,
      potentialSavings: detentionEstimate,
      source: "live",
    },
    assumptions: {
      source: "Derived from Control Tower alerts and in-yard vehicle counts.",
      savings: "Potential savings estimated from waiting-delay exposure (not AI predictions).",
    },
    formatINR,
    MODULE_META,
  };
}

export default {
  fetchOperationalInsights,
};
