import { API_BASE, request } from "./ymsApi";

export const OPERATIONS_SLA = {
  waitingMinutes: 60,
  loadingMinutes: 120,
  turnaroundMinutes: 240,
};

/** @returns {'success' | 'warning' | 'danger'} */
export function timeMetricAccent(valueMinutes, slaMinutes) {
  const value = Number(valueMinutes) || 0;
  if (value <= slaMinutes * 0.85) return "success";
  if (value <= slaMinutes) return "warning";
  return "danger";
}

/** @returns {'success' | 'warning' | 'danger'} */
export function slaComplianceAccent(pct) {
  const value = Number(pct) || 0;
  if (value >= 90) return "success";
  if (value >= 70) return "warning";
  return "danger";
}

export async function fetchOperationsDashboard() {
  return request("/reports/operations-dashboard");
}

const operationsDashboardApi = {
  fetchOperationsDashboard,
  OPERATIONS_SLA,
  timeMetricAccent,
  slaComplianceAccent,
};

export default operationsDashboardApi;
