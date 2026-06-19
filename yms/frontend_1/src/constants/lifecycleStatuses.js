/**
 * Canonical lifecycle status definitions — single source for KPIs, filters, and display.
 * Backend status CALLED is displayed as "Staging" in the UI.
 */

/** Vehicles physically on site (operational lifecycle, excluding SCHEDULED/DRAFT). */
export const IN_YARD_VEHICLE_STATUSES = new Set([
  "ARRIVED",
  "CHECKED_IN",
  "WAITING",
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
  "COMPLETED",
  "EXIT_HOLDING",
  "EXIT_VERIFIED",
]);

/** Appointment list "active" filter — full operational lifecycle in yard. */
export const ACTIVE_APPOINTMENT_STATUSES = [
  "ARRIVED",
  "CHECKED_IN",
  "WAITING",
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
  "COMPLETED",
  "EXIT_HOLDING",
  "EXIT_VERIFIED",
];

/** Backend CALLED → UI label Staging */
export const STAGING_DISPLAY_STATUSES = new Set(["CALLED", "REPORTING_TO_DOCK", "STAGING"]);

const DISPLAY_LABELS = {
  ARRIVED: "Arrived",
  CHECKED_IN: "Checked In",
  WAITING: "Waiting",
  CALLED: "Staging",
  REPORTING_TO_DOCK: "Staging",
  STAGING: "Staging",
  DOCK_ASSIGNED: "Dock Assigned",
  RESOURCE_PENDING: "Resource Pending",
  READY_FOR_LOADING: "Ready for Loading",
  LOADING: "Loading",
  COMPLETED: "Completed",
  EXIT_HOLDING: "Exit Holding",
  EXIT_VERIFIED: "Exit Verified",
  EXITED: "Exited",
};

export function isVehicleInYard(vehicle) {
  const status = vehicle?.status;
  if (!status || status === "EXITED" || status === "CANCELLED") return false;
  return IN_YARD_VEHICLE_STATUSES.has(status);
}

export function lifecycleDisplayLabel(status) {
  if (!status) return "—";
  return DISPLAY_LABELS[status] || String(status).replace(/_/g, " ");
}

/** Status key for StatusPill — CALLED stays CALLED; label comes from lifecycleDisplayLabel. */
export function lifecycleStatusForPill(status) {
  return status;
}
