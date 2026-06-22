import type { OperationsDashboard } from "@/src/services/overviewService";

export type DockUtilSummary = {
  total: number;
  occupied: number;
  available: number;
  delayed: number;
  utilizationPct: number;
};

export type OverviewKpi = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

export type LiveEventRow = {
  id: string;
  time: string;
  message: string;
  level: "success" | "warning" | "danger" | "info";
  plate?: string;
};

const ALERT_LABELS: Record<string, string> = {
  VEHICLE_WAITING_TOO_LONG: "Long wait",
  HAZMAT_SLA_BREACH: "Hazmat SLA breach",
  LOADING_DELAY: "Loading delay",
  EXIT_HOLDING_DELAY: "Exit holding delay",
  LABOR_UNAVAILABLE: "Labor unavailable",
  EQUIPMENT_UNAVAILABLE: "Equipment unavailable",
  DOCK_BLOCKED: "Dock stalled",
  QUEUE_CONGESTION: "Queue congestion",
  LOADING_EXCEPTION: "Loading exception",
};

const EVENT_LABELS: Record<string, string> = {
  VEHICLE_CREATED: "Vehicle registered",
  APPOINTMENT_CREATED: "Appointment booked",
  QUEUE_ENTRY_CREATED: "Entered virtual queue",
  VEHICLE_CHECKED_IN: "Gate check-in completed",
  VEHICLE_CALLED: "Vehicle called to dock",
  DOCK_ASSIGNED: "Dock assigned",
  VEHICLE_STATUS_CHANGED: "Status updated",
  TRIP_CANCELLED: "Trip cancelled",
};

export function summarizeDockUtilization(docks: Array<{ status?: unknown }>): DockUtilSummary {
  const total = docks.length;
  const occupied = docks.filter((dock) => String(dock.status || "").toUpperCase() === "OCCUPIED").length;
  const delayed = docks.filter((dock) => String(dock.status || "").toUpperCase() === "DELAYED").length;
  const available = docks.filter((dock) => String(dock.status || "").toUpperCase() === "AVAILABLE").length;
  const utilizationPct = total ? Math.round((occupied / total) * 100) : 0;
  return { total, occupied, available, delayed, utilizationPct };
}

export function formatAlertHeadline(alert: {
  alertType: string;
  vehicle?: string | null;
  dock?: string | null;
  durationMin?: number;
  exceptionType?: string | null;
}): string {
  const label = ALERT_LABELS[alert.alertType] || alert.alertType.replace(/_/g, " ").toLowerCase();
  const subject = alert.vehicle || alert.dock;
  const duration = alert.durationMin ? ` · ${alert.durationMin} min` : "";
  const exception = alert.exceptionType ? ` (${alert.exceptionType.replace(/_/g, " ").toLowerCase()})` : "";
  if (subject) return `${label}: ${subject}${duration}${exception}`;
  return `${label}${duration}${exception}`;
}

export function alertSeverityTone(severity: string): "danger" | "warning" | "info" {
  if (severity === "CRITICAL") return "danger";
  if (severity === "WARNING") return "warning";
  return "info";
}

function formatMinutes(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}`;
}

function formatPercent(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
}

export function buildOverviewKpis(input: {
  ops: OperationsDashboard | null;
  dockSummary: DockUtilSummary;
  alertSummary: { critical: number; warning: number; total: number };
  yardUtilizationPct?: number;
}) {
  const { ops, dockSummary, alertSummary, yardUtilizationPct } = input;
  const needsAttention = alertSummary.critical + alertSummary.warning;

  const primary: OverviewKpi[] = [
    {
      key: "in_yard",
      label: "Trucks in yard",
      value: ops ? String(ops.vehiclesInYard) : "—",
      hint: ops ? `${ops.vehiclesWaiting} waiting` : undefined,
    },
    {
      key: "avg_wait",
      label: "Avg wait",
      value: ops ? `${formatMinutes(ops.avgWaitingMinutes)}m` : "—",
      tone: ops && ops.avgWaitingMinutes >= 45 ? "warning" : "default",
    },
    {
      key: "docks_busy",
      label: "Docks busy",
      value: dockSummary.total ? formatPercent(dockSummary.utilizationPct) : "—",
      hint: dockSummary.total ? `${dockSummary.occupied}/${dockSummary.total} occupied` : undefined,
      tone: dockSummary.utilizationPct >= 85 ? "warning" : "default",
    },
    {
      key: "attention",
      label: "Needs attention",
      value: String(needsAttention),
      hint:
        alertSummary.total > 0
          ? `${alertSummary.critical} critical · ${alertSummary.warning} warning`
          : "All clear",
      tone: alertSummary.critical > 0 ? "danger" : alertSummary.warning > 0 ? "warning" : "success",
    },
  ];

  const secondary: OverviewKpi[] = [
    {
      key: "exited_today",
      label: "Exited today",
      value: ops ? String(ops.vehiclesExitedToday) : "—",
    },
    {
      key: "loading",
      label: "Loading now",
      value: ops ? String(ops.vehiclesLoading) : "—",
    },
    {
      key: "sla",
      label: "SLA compliance",
      value: ops ? formatPercent(ops.slaCompliancePct) : "—",
      tone: ops && ops.slaCompliancePct < 90 ? "warning" : "default",
    },
    {
      key: "yard_util",
      label: "Yard utilization",
      value: yardUtilizationPct != null ? formatPercent(yardUtilizationPct) : "—",
      tone: yardUtilizationPct != null && yardUtilizationPct >= 85 ? "warning" : "default",
    },
  ];

  return { primary, secondary };
}

function eventLevel(eventType: string) {
  const type = eventType.toUpperCase();
  if (type.includes("CANCEL") || type.includes("DETENTION")) return "danger" as const;
  if (type.includes("DELAY") || type.includes("WARNING")) return "warning" as const;
  if (type.includes("EXIT") || type.includes("COMPLETE") || type.includes("SUCCESS")) return "success" as const;
  return "info" as const;
}

function formatEventMessage(event: Record<string, unknown>) {
  const type = String(event.event_type || "EVENT");
  const note = event.event_note ? ` — ${String(event.event_note)}` : "";
  return `${EVENT_LABELS[type] || type.replace(/_/g, " ")}${note}`;
}

export function mapLiveEvents(events: Record<string, unknown>[]): LiveEventRow[] {
  return [...events]
    .sort((a, b) => new Date(String(b.event_time)).getTime() - new Date(String(a.event_time)).getTime())
    .slice(0, 10)
    .map((event) => ({
      id: String(event.id),
      time: new Date(String(event.event_time)).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message: formatEventMessage(event),
      level: eventLevel(String(event.event_type || "")),
      plate: event.vehicle_number ? String(event.vehicle_number) : undefined,
    }));
}
