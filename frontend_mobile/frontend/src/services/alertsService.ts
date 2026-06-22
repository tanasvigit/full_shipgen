import { ymsRequest } from "@/src/lib/ymsApi";

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

export type ControlTowerAlertsBundle = {
  activeAlerts: ControlTowerAlert[];
  criticalCount: number;
  warningCount: number;
};

export async function fetchControlTowerAlerts(): Promise<ControlTowerAlertsBundle> {
  return ymsRequest<ControlTowerAlertsBundle>("/control-tower/alerts");
}

export function alertBadgeCount(bundle: ControlTowerAlertsBundle | null | undefined) {
  if (!bundle) return 0;
  return (bundle.criticalCount ?? 0) + (bundle.warningCount ?? 0);
}
