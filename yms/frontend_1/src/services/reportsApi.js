import { getAuthHeaders } from "./authStorage";
import { API_BASE, request } from "./ymsApi";

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function fetchVehicleJourneyReport({ vehicleId, vehicleNumber, appointmentRef, dateFrom, dateTo } = {}) {
  if (vehicleId) {
    return request(
      `/reports/vehicle-journey/${vehicleId}${buildQuery({ date_from: dateFrom, date_to: dateTo })}`
    );
  }
  return request(
    `/reports/vehicle-journey${buildQuery({
      vehicle_number: vehicleNumber,
      appointment_ref: appointmentRef,
      date_from: dateFrom,
      date_to: dateTo,
    })}`
  );
}

export async function fetchDockUtilizationReport({ dateFrom, dateTo, zone, dockId } = {}) {
  return request(
    `/reports/dock-utilization${buildQuery({
      date_from: dateFrom,
      date_to: dateTo,
      zone,
      dock_id: dockId,
    })}`
  );
}

export async function fetchLaborProductivityReport({ dateFrom, dateTo } = {}) {
  return request(`/reports/labor-productivity${buildQuery({ date_from: dateFrom, date_to: dateTo })}`);
}

export async function fetchEquipmentUtilizationReport({ dateFrom, dateTo } = {}) {
  return request(`/reports/equipment-utilization${buildQuery({ date_from: dateFrom, date_to: dateTo })}`);
}

export async function fetchDelayAnalysisReport({ dateFrom, dateTo } = {}) {
  return request(`/reports/delay-analysis${buildQuery({ date_from: dateFrom, date_to: dateTo })}`);
}

export async function fetchSlaComplianceReport({ dateFrom, dateTo } = {}) {
  return request(`/reports/sla-compliance${buildQuery({ date_from: dateFrom, date_to: dateTo })}`);
}

export async function downloadReportExport(path, { fmt = "csv", ...params } = {}) {
  const url = `${API_BASE}${path}${buildQuery({ fmt, ...params })}`;
  const res = await fetch(url, { headers: { ...getAuthHeaders() } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const ext = fmt === "xlsx" || fmt === "excel" ? "xlsx" : "csv";
  const filename = `${path.split("/").pop() || "report"}.${ext}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function formatTimeLabel(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateLabel(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

export default {
  fetchVehicleJourneyReport,
  fetchDockUtilizationReport,
  fetchLaborProductivityReport,
  fetchEquipmentUtilizationReport,
  fetchDelayAnalysisReport,
  fetchSlaComplianceReport,
  downloadReportExport,
};
