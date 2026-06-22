export type ResourceReadiness = {
  ready?: boolean;
  missing?: string[];
  dockAssigned?: boolean;
  laborAssigned?: boolean;
  equipmentAssigned?: boolean;
  equipmentOptional?: boolean;
  equipmentRecommended?: boolean;
};

export function canStartLoadingForVehicleStatus(vehicleStatus?: string | null) {
  return String(vehicleStatus || "").toUpperCase() === "READY_FOR_LOADING";
}

export function canStartLoadingFromReadiness(readiness?: ResourceReadiness | null) {
  return readiness?.ready === true;
}

export function computeMandatoryReadiness(input: {
  dockAssigned?: boolean;
  laborAssigned?: boolean;
  equipmentAssigned?: boolean;
}): ResourceReadiness {
  const missing: string[] = [];
  if (!input.dockAssigned) missing.push("dock");
  if (!input.laborAssigned) missing.push("labor");
  return {
    ready: missing.length === 0,
    missing,
    dockAssigned: Boolean(input.dockAssigned),
    laborAssigned: Boolean(input.laborAssigned),
    equipmentAssigned: Boolean(input.equipmentAssigned),
    equipmentOptional: true,
    equipmentRecommended: !input.equipmentAssigned,
  };
}

export function formatResourceGatingMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const detail = (payload as { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") return null;
  const gate = detail as { error?: string; message?: string; missing?: string[] };
  if (gate.error !== "RESOURCE_GATING_FAILED") return null;
  const labels: Record<string, string> = { dock: "Dock", labor: "Labor", equipment: "Equipment" };
  const missing = (gate.missing || []).map((item) => labels[item] || item).join(", ");
  return `${gate.message || "Cannot start loading."}${missing ? ` Missing: ${missing}.` : ""}`;
}
