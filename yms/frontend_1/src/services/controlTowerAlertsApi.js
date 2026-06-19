import { request } from "./ymsApi";

export const ALERT_SEVERITY_ACCENT = {
  CRITICAL: "danger",
  WARNING: "warning",
  INFO: "info",
};

export function alertSeverityClass(severity) {
  switch ((severity || "").toUpperCase()) {
    case "CRITICAL":
      return "text-red-700 bg-red-50 border-red-200";
    case "WARNING":
      return "text-amber-800 bg-amber-50 border-amber-200";
    default:
      return "text-blue-700 bg-blue-50 border-blue-200";
  }
}

export function formatAlertType(type) {
  return (type || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function fetchControlTowerAlerts() {
  return request("/control-tower/alerts");
}

const controlTowerAlertsApi = {
  fetchControlTowerAlerts,
  alertSeverityClass,
  formatAlertType,
  ALERT_SEVERITY_ACCENT,
};

export default controlTowerAlertsApi;
