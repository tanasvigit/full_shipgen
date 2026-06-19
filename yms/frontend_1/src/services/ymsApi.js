import { getAuthHeaders } from "./authStorage";
import { formatResourceGatingMessage } from "../utils/resourceGating";
import { notifyYmsDataChanged } from "./ymsSync";

export const API_BASE = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_YMS_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "/api/yms"
).replace(/\/$/, "");

/** Max rows per paginated list request (matches backend MAX_PAGE_LIMIT). */
export const LIST_PAGE_LIMIT = 500;

/** Dashboard initial fetch — smaller payloads, same widgets/KPI logic on typical yards. */
export const DASHBOARD_LIST_LIMIT = 500;
export const DASHBOARD_EVENTS_LIMIT = 300;

function buildListQuery({ limit, skip } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (skip != null) params.set("skip", String(skip));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Normalize plain array or paginated `{ items }` list responses. */
export function parseListResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}

async function listRequest(path, opts) {
  const data = await request(`${path}${buildListQuery(opts)}`);
  return parseListResponse(data);
}

/** Turn fetch/API errors into a user-visible message with status and URL. */
export function formatApiError(error, url = API_BASE) {
  if (!error) return "Unknown error";
  if (error.isNetworkError || (error.name === "TypeError" && /fetch/i.test(error.message))) {
    return `Cannot reach backend at ${url}. Check that the API is running (e.g. docker compose up) and CORS allows this origin.`;
  }
  if (error.status) {
    const gateMsg = formatResourceGatingMessage(error);
    if (gateMsg) return `${gateMsg} (HTTP ${error.status})`;
    const detail = error.payload?.detail;
    if (typeof detail === "string") return `${detail} (HTTP ${error.status})`;
    if (detail && typeof detail === "object" && detail.message) {
      return `${detail.message} (HTTP ${error.status})`;
    }
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join("; ") + ` (HTTP ${error.status})`;
    }
    if (error.message && !/^Request failed/i.test(error.message)) {
      return `${error.message} (HTTP ${error.status})`;
    }
    return `Request failed with HTTP ${error.status} — ${error.url || url}`;
  }
  return error.message || String(error);
}

export async function request(path, options = {}, _retried = false) {
  const url = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (networkErr) {
    const error = new Error(networkErr.message || "Failed to fetch");
    error.cause = networkErr;
    error.url = url;
    error.isNetworkError = true;
    console.error("[ymsApi] network error", { url, message: networkErr.message });
    throw error;
  }

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !_retried && !path.startsWith("/auth/")) {
      try {
        const { refreshSession } = await import("./authApi");
        await refreshSession();
        return request(path, options, true);
      } catch {
        const { clearTokens } = await import("./authStorage");
        clearTokens();
      }
    }
    const detail = payload?.detail;
    let message =
      typeof detail === "string"
        ? detail
        : detail && typeof detail === "object" && detail.error === "RESOURCE_GATING_FAILED"
        ? detail.message || "Cannot start loading."
        : Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
        : text || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.payload = payload;
    error.url = url;
    console.error("[ymsApi] request failed", { url, status: res.status, payload: text?.slice(0, 500) });
    throw error;
  }
  return payload;
}

async function syncMutation(requestFn, detail = {}) {
  const result = await requestFn();
  notifyYmsDataChanged({ source: "ymsApi", ...detail });
  return result;
}

export const ymsApi = {
  listQueueEntries: (opts) => listRequest("/queue-entries", opts),
  getQueueEntry: (id) => request(`/queue-entries/${id}`),
  updateQueueEntry: (id, patch) =>
    syncMutation(
      () => request(`/queue-entries/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
      { action: "queue-updated", queueEntryId: id }
    ),

  listVehicles: (opts) => listRequest("/vehicles", opts),
  getVehicle: (id) => request(`/vehicles/${id}`),
  getVehicleJourney: (id) => request(`/vehicles/${id}/journey`),
  createVehicle: (body) => request("/vehicles", { method: "POST", body: JSON.stringify(body) }),
  transitionVehicle: (id, body) =>
    syncMutation(
      () => request(`/flow/vehicles/${id}/transition`, { method: "POST", body: JSON.stringify(body) }),
      { action: `vehicle-${body?.status || "transition"}`, vehicleId: id }
    ),

  listAppointments: (opts) => listRequest("/appointments", opts),
  getAppointment: (id) => request(`/appointments/${id}`),
  createAppointment: (body) => request("/appointments", { method: "POST", body: JSON.stringify(body) }),
  updateAppointment: (id, patch) =>
    syncMutation(
      () => request(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
      { action: "appointment-updated", appointmentId: id }
    ),

  listDocks: (opts) => listRequest("/docks", opts),
  getDock: (id) => request(`/docks/${id}`),
  createDock: (body) => request("/docks", { method: "POST", body: JSON.stringify(body) }),
  updateDock: (id, patch) => request(`/docks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteDock: (id) => request(`/docks/${id}`, { method: "DELETE" }),
  assignDockLabor: (dockId, body) =>
    syncMutation(
      () => request(`/docks/${dockId}/assign-labor`, { method: "POST", body: JSON.stringify(body) }),
      { action: "TEAM_ASSIGNED", dockId, ...body }
    ),
  assignDockEquipment: (dockId, body) =>
    syncMutation(
      () => request(`/docks/${dockId}/assign-equipment`, { method: "POST", body: JSON.stringify(body) }),
      { action: "EQUIPMENT_ASSIGNED", dockId, ...body }
    ),
  releaseDockResources: (dockId) =>
    syncMutation(
      () => request(`/docks/${dockId}/release-resources`, { method: "POST", body: "{}" }),
      { action: "DOCK_RESOURCES_RELEASED", dockId }
    ),
  checkDockReadiness: (vehicleId) => request(`/docks/readiness/vehicle/${vehicleId}`),
  checkResourceReadiness: (vehicleId) => request(`/flow/readiness/vehicle/${vehicleId}`),

  listYardEvents: (opts) => listRequest("/yard-events", opts),
  createYardEvent: (body) => request("/yard-events", { method: "POST", body: JSON.stringify(body) }),

  listEquipment: () => request("/equipment"),
  getEquipment: (id) => request(`/equipment/${id}`),
  createEquipment: (body) => request("/equipment", { method: "POST", body: JSON.stringify(body) }),
  updateEquipment: (id, patch) => request(`/equipment/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  updateEquipmentStatus: (id, body) => request(`/equipment/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
  assignEquipment: (id, body) =>
    syncMutation(
      () => request(`/equipment/${id}/assign`, { method: "POST", body: JSON.stringify(body) }),
      { action: "EQUIPMENT_ASSIGNED", equipmentId: id, ...body }
    ),
  releaseEquipment: (id) =>
    syncMutation(
      () => request(`/equipment/${id}/release`, { method: "POST", body: "{}" }),
      { action: "EQUIPMENT_RELEASED", equipmentId: id }
    ),
  markEquipmentInUse: (id) =>
    syncMutation(() => request(`/equipment/${id}/in-use`, { method: "POST", body: "{}" }), {
      action: "EQUIPMENT_IN_USE",
      equipmentId: id,
    }),
  markEquipmentIdle: (id) =>
    syncMutation(() => request(`/equipment/${id}/idle`, { method: "POST", body: "{}" }), {
      action: "EQUIPMENT_IDLE",
      equipmentId: id,
    }),
  markEquipmentMaintenance: (id) =>
    syncMutation(() => request(`/equipment/${id}/maintenance`, { method: "POST", body: "{}" }), {
      action: "EQUIPMENT_MAINTENANCE",
      equipmentId: id,
    }),
  markEquipmentCharging: (id) =>
    syncMutation(() => request(`/equipment/${id}/charging`, { method: "POST", body: "{}" }), {
      action: "EQUIPMENT_CHARGING",
      equipmentId: id,
    }),
  completeEquipmentMaintenance: (id) =>
    syncMutation(
      () => request(`/equipment/${id}/maintenance-complete`, { method: "POST", body: "{}" }),
      { action: "EQUIPMENT_MAINTENANCE_COMPLETE", equipmentId: id }
    ),
  deleteEquipment: (id) => request(`/equipment/${id}`, { method: "DELETE" }),
  checkEquipmentReadiness: (vehicleId) => request(`/equipment/readiness/vehicle/${vehicleId}`),

  listLabor: () => request("/labor"),
  getLabor: (id) => request(`/labor/${id}`),
  createLabor: (body) => request("/labor", { method: "POST", body: JSON.stringify(body) }),
  updateLabor: (id, patch) => request(`/labor/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  updateLaborStatus: (id, body) => request(`/labor/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
  assignLabor: (id, body) =>
    syncMutation(
      () => request(`/labor/${id}/assign`, { method: "POST", body: JSON.stringify(body) }),
      { action: "TEAM_ASSIGNED", laborId: id, ...body }
    ),
  releaseLabor: (id) =>
    syncMutation(
      () => request(`/labor/${id}/release`, { method: "POST", body: "{}" }),
      { action: "TEAM_RELEASED", laborId: id }
    ),
  checkLaborReadiness: (vehicleId) => request(`/labor/readiness/vehicle/${vehicleId}`),
  markLaborOnDuty: (id) =>
    syncMutation(() => request(`/labor/${id}/on-duty`, { method: "POST", body: "{}" }), {
      action: "LABOR_ON_DUTY",
      laborId: id,
    }),
  markLaborOffDuty: (id) =>
    syncMutation(() => request(`/labor/${id}/off-duty`, { method: "POST", body: "{}" }), {
      action: "LABOR_OFF_DUTY",
      laborId: id,
    }),
  markLaborBreak: (id) =>
    syncMutation(() => request(`/labor/${id}/break`, { method: "POST", body: "{}" }), {
      action: "LABOR_BREAK",
      laborId: id,
    }),
  endLaborBreak: (id) =>
    syncMutation(() => request(`/labor/${id}/break-end`, { method: "POST", body: "{}" }), {
      action: "LABOR_BREAK_END",
      laborId: id,
    }),
  markLaborUnavailable: (id) =>
    syncMutation(() => request(`/labor/${id}/unavailable`, { method: "POST", body: "{}" }), {
      action: "LABOR_UNAVAILABLE",
      laborId: id,
    }),
  deleteLabor: (id) => request(`/labor/${id}`, { method: "DELETE" }),

  getDetentionDashboard: () => request("/detention"),
  getDetention: (id) => request(`/detention/${id}`),
  getDetentionConfig: () => request("/detention/config"),
  updateDetentionStatus: (id, body) =>
    syncMutation(
      () => request(`/detention/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
      { action: "detention-updated", detentionId: id }
    ),

  checkIn: (body) =>
    syncMutation(
      () => request("/flow/check-in", { method: "POST", body: JSON.stringify(body) }),
      { action: "vehicle-check-in" }
    ),
  callQueueEntry: (id) =>
    syncMutation(
      () => request(`/flow/queue-entries/${id}/call`, { method: "POST", body: "{}" }),
      { action: "queue-called", queueEntryId: id }
    ),
  assignDock: (id, body) =>
    syncMutation(
      () => request(`/flow/queue-entries/${id}/assign-dock`, { method: "POST", body: JSON.stringify(body) }),
      { action: "DOCK_ASSIGNED", queueEntryId: id, dockId: body?.dock_id }
    ),

  getGateDashboard: (gateId = "G1") => request(`/gate/dashboard?gate_id=${encodeURIComponent(gateId)}`),
  gateLookup: (body) => request("/gate/lookup", { method: "POST", body: JSON.stringify(body) }),
  gateScan: (body) =>
    syncMutation(
      () => request("/gate/scan", { method: "POST", body: JSON.stringify(body) }),
      { action: "GATE_SCAN", ...body }
    ),
  gateMarkArrived: (vehicleId, body) =>
    syncMutation(
      () => request(`/gate/vehicles/${vehicleId}/arrived`, { method: "POST", body: JSON.stringify(body) }),
      { action: "ARRIVED", vehicleId }
    ),
  gateApproveEntry: (vehicleId, body) =>
    syncMutation(
      () => request(`/gate/vehicles/${vehicleId}/approve-entry`, { method: "POST", body: JSON.stringify(body) }),
      { action: "ENTRY_APPROVED", vehicleId }
    ),
  gateRejectEntry: (vehicleId, body) =>
    syncMutation(
      () => request(`/gate/vehicles/${vehicleId}/reject-entry`, { method: "POST", body: JSON.stringify(body) }),
      { action: "ENTRY_REJECTED", vehicleId }
    ),
  gateExitHoldingDashboard: (gateId = "G1") =>
    request(`/gate/exit-holding/dashboard?gate_id=${encodeURIComponent(gateId)}`),
  gateExitHolding: (gateId = "G1") => request(`/gate/exit-holding?gate_id=${encodeURIComponent(gateId)}`),
  gateExitVerificationDetail: (vehicleId, gateId = "G1") =>
    request(`/gate/vehicles/${vehicleId}/exit-verification?gate_id=${encodeURIComponent(gateId)}`),
  gateUpdateExitChecklist: (vehicleId, body) =>
    syncMutation(
      () => request(`/gate/vehicles/${vehicleId}/exit-checklist`, { method: "PATCH", body: JSON.stringify(body) }),
      { action: "exit-checklist", vehicleId }
    ),
  gateVerifyExit: (vehicleId, body) =>
    syncMutation(
      () => request(`/gate/vehicles/${vehicleId}/verify-exit`, { method: "POST", body: JSON.stringify(body) }),
      { action: "EXIT_VERIFIED", vehicleId }
    ),
  gateGateOut: (vehicleId, body) =>
    syncMutation(
      () => request(`/gate/vehicles/${vehicleId}/gate-out`, { method: "POST", body: JSON.stringify(body) }),
      { action: "GATE_OUT_APPROVED", vehicleId }
    ),
  gateRejectExit: (vehicleId, body) =>
    syncMutation(
      () => request(`/gate/vehicles/${vehicleId}/reject-exit`, { method: "POST", body: JSON.stringify(body) }),
      { action: "EXIT_REJECTED", vehicleId }
    ),
};

export default ymsApi;
