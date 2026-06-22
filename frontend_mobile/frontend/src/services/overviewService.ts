import { ymsRequest } from "@/src/lib/ymsApi";
import { parseYmsList } from "@/src/services/queueService";
import {
  buildOverviewKpis,
  mapLiveEvents,
  summarizeDockUtilization,
  type LiveEventRow,
  type OverviewKpi,
} from "@/src/lib/overviewMetrics";

export type OperationsDashboard = {
  appointmentsToday: number;
  vehiclesEnteredToday: number;
  vehiclesExitedToday: number;
  vehiclesInYard: number;
  vehiclesWaiting: number;
  vehiclesLoading: number;
  vehiclesInExitHolding: number;
  avgTurnaroundMinutes: number;
  avgWaitingMinutes: number;
  avgLoadingMinutes: number;
  slaCompliancePct: number;
};

export type YardDashboard = {
  totalZones: number;
  activeZones: number;
  blockedZones: number;
  fullZones: number;
  maintenanceZones: number;
  totalCapacity: number;
  currentOccupancy: number;
  availableSlots: number;
  yardUtilizationPct: number;
};

export type ControlTowerAlert = {
  id: string;
  alertType: string;
  severity: string;
  vehicleId?: string | null;
  vehicle?: string | null;
  appointmentId?: string | null;
  appointment?: string | null;
  dockId?: string | null;
  dock?: string | null;
  labor?: string | null;
  equipment?: string | null;
  exceptionType?: string | null;
  exceptionStatus?: string | null;
  durationMin: number;
  delayMin?: number | null;
  createdAt?: string | null;
  status: string;
};

export type ControlTowerAlerts = {
  activeAlerts: ControlTowerAlert[];
  criticalCount: number;
  warningCount: number;
};

export type OverviewBundle = {
  kpis: OverviewKpi[];
  secondaryKpis: OverviewKpi[];
  alerts: ControlTowerAlert[];
  alertSummary: { critical: number; warning: number; total: number };
  liveEvents: LiveEventRow[];
  yardUtilizationPct?: number;
  fetchErrors: string[];
};

async function fetchSource<T>(label: string, loader: () => Promise<T>): Promise<{ data: T | null; error?: string }> {
  try {
    return { data: await loader() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return { data: null, error: `${label}: ${message}` };
  }
}

export async function fetchOverviewDashboard(
  options?: { includeDocks?: boolean },
): Promise<OverviewBundle> {
  const includeDocks = options?.includeDocks ?? true;
  const [opsResult, alertsResult, yardResult, docksResult, eventsResult] = await Promise.all([
    fetchSource("operations", () => ymsRequest<OperationsDashboard>("/reports/operations-dashboard")),
    fetchSource("alerts", () => ymsRequest<ControlTowerAlerts>("/control-tower/alerts")),
    fetchSource("yard", () => ymsRequest<YardDashboard>("/yard/dashboard")),
    includeDocks
      ? fetchSource("docks", () => ymsRequest<unknown>("/docks?limit=100"))
      : Promise.resolve({ data: null as unknown }),
    fetchSource("events", () => ymsRequest<unknown>("/yard-events?limit=20")),
  ]);

  const fetchErrors = [opsResult, alertsResult, yardResult, docksResult, eventsResult]
    .map((result) => result.error)
    .filter(Boolean) as string[];

  if (fetchErrors.length >= (includeDocks ? 5 : 4)) {
    throw new Error(fetchErrors.join("; "));
  }

  const dockSummary = summarizeDockUtilization(parseYmsList(docksResult.data));
  const alerts = alertsResult.data?.activeAlerts ?? [];
  const alertSummary = {
    critical: alertsResult.data?.criticalCount ?? alerts.filter((a) => a.severity === "CRITICAL").length,
    warning: alertsResult.data?.warningCount ?? alerts.filter((a) => a.severity === "WARNING").length,
    total: alerts.length,
  };

  const { primary, secondary } = buildOverviewKpis({
    ops: opsResult.data,
    dockSummary,
    alertSummary,
    yardUtilizationPct: yardResult.data?.yardUtilizationPct,
  });

  return {
    kpis: primary,
    secondaryKpis: secondary,
    alerts: alerts.slice(0, 8),
    alertSummary,
    liveEvents: mapLiveEvents(parseYmsList(eventsResult.data)),
    yardUtilizationPct: yardResult.data?.yardUtilizationPct,
    fetchErrors,
  };
}
