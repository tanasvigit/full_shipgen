/** Parse RESOURCE_GATING_FAILED errors from ymsApi. */
export function parseResourceGatingError(error) {
  const detail = error?.payload?.detail;
  if (detail && typeof detail === "object" && detail.error === "RESOURCE_GATING_FAILED") {
    return detail;
  }
  return null;
}

export function formatResourceGatingMessage(error) {
  const gate = parseResourceGatingError(error);
  if (!gate) return null;
  const labels = { dock: "Dock", labor: "Labor", equipment: "Equipment" };
  const missing = (gate.missing || []).map((m) => labels[m] || m).join(", ");
  return `${gate.message || "Cannot start loading."} Missing: ${missing}.`;
}

export function canStartLoadingFromReadiness(readiness) {
  return readiness?.ready === true;
}

/** Build readiness from assignment flags (dock + labor mandatory; equipment optional). */
export function computeMandatoryReadiness({ dockAssigned, laborAssigned, equipmentAssigned }) {
  const missing = [];
  if (!dockAssigned) missing.push("dock");
  if (!laborAssigned) missing.push("labor");
  return {
    ready: missing.length === 0,
    missing,
    dockAssigned: !!dockAssigned,
    laborAssigned: !!laborAssigned,
    equipmentAssigned: !!equipmentAssigned,
    equipmentOptional: true,
    equipmentRecommended: !equipmentAssigned,
  };
}

export function canStartLoadingForVehicleStatus(vehicleStatus) {
  return vehicleStatus === "READY_FOR_LOADING";
}
