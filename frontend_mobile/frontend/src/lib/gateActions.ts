import type { GateVehicleContext } from "@/src/services/gateService";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";

export const GATE_ACTIVITY_TABS = [
  "APPROACHING",
  "ARRIVED",
  "CHECKED_IN",
  "WAITING",
  "LOADING_PIPELINE",
  "EXIT_HOLDING",
  "EXIT_VERIFIED",
  "EXITED",
  "REJECTED",
] as const;

export type GatePipelineTab = "ALL" | (typeof GATE_ACTIVITY_TABS)[number];

export const GATE_TAB_LABELS: Record<string, string> = {
  APPROACHING: "Approaching",
  ARRIVED: "Arrived",
  CHECKED_IN: "Checked In",
  WAITING: "Waiting",
  LOADING_PIPELINE: "Loading",
  EXIT_HOLDING: "Exit Hold",
  EXIT_VERIFIED: "Exit OK",
  EXITED: "Exited",
  REJECTED: "Rejected",
};

export const GATE_REJECT_REASONS = [
  "Documentation incomplete",
  "Wrong appointment slot",
  "Vehicle mismatch",
  "Security hold",
  "Appointment not found",
  "Other",
];

export type GateScreenMode = "entry" | "exit";

export type GateActionId =
  | "mark_arrived"
  | "approve_entry"
  | "reject_entry"
  | "verify_exit"
  | "gate_out"
  | "reject_exit";

export type GateActionDef = {
  id: GateActionId;
  label: string;
  variant: "primary" | "danger" | "secondary";
  enabled: boolean;
  reason?: string;
};

function hasPermission(can: (permission: string) => boolean, permission: string) {
  return can("*") || can(permission);
}

function normalizeTab(ctx: GateVehicleContext | null) {
  return String(ctx?.activityTab || ctx?.display.status || "").toUpperCase();
}

export function allChecksPassed(checks: { passed: boolean }[] = []) {
  return checks.length > 0 && checks.every((check) => check.passed);
}

export function resolveGateActions(
  ctx: GateVehicleContext | null,
  can: (permission: string) => boolean,
  mode: GateScreenMode,
): GateActionDef[] {
  if (!ctx) return [];

  const tab = normalizeTab(ctx);
  const status = String(ctx.display.status || "").toUpperCase();
  const actions: GateActionDef[] = [];

  if (mode === "entry") {
    const canMarkArrived =
      hasPermission(can, YMS_PERMISSIONS.FLOW_VEHICLE_TRANSITION) &&
      (tab === "APPROACHING" || ["SCHEDULED", "DRAFT"].includes(status));

    actions.push({
      id: "mark_arrived",
      label: "Mark arrived",
      variant: "secondary",
      enabled: canMarkArrived,
      reason: canMarkArrived ? undefined : "Available when vehicle is scheduled or approaching",
    });

    const entryReady =
      hasPermission(can, YMS_PERMISSIONS.FLOW_CHECK_IN) &&
      (tab === "ARRIVED" || status === "ARRIVED") &&
      allChecksPassed(ctx.entryChecks) &&
      !ctx.queueEntryId;

    actions.push({
      id: "approve_entry",
      label: "Approve entry",
      variant: "primary",
      enabled: entryReady,
      reason: entryReady
        ? undefined
        : ctx.queueEntryId
          ? "Vehicle is already checked in"
          : "Complete entry checks before approving",
    });

    const canRejectEntry =
      hasPermission(can, YMS_PERMISSIONS.FLOW_VEHICLE_TRANSITION) &&
      !["EXITED", "CANCELLED", "REJECTED"].includes(status) &&
      !["EXITED", "REJECTED"].includes(tab);

    actions.push({
      id: "reject_entry",
      label: "Reject entry",
      variant: "danger",
      enabled: canRejectEntry,
    });

    return actions;
  }

  const canToggleExit = hasPermission(can, YMS_PERMISSIONS.FLOW_VEHICLE_TRANSITION);
  const exitReady = allChecksPassed(ctx.exitChecks);

  actions.push({
    id: "verify_exit",
    label: "Verify exit",
    variant: "primary",
    enabled:
      canToggleExit &&
      (status === "EXIT_HOLDING" || tab === "EXIT_HOLDING") &&
      exitReady,
    reason: exitReady ? undefined : "Confirm all exit checklist items first",
  });

  actions.push({
    id: "gate_out",
    label: "Gate out",
    variant: "primary",
    enabled:
      hasPermission(can, YMS_PERMISSIONS.FLOW_VEHICLE_TRANSITION) &&
      (status === "EXIT_VERIFIED" || tab === "EXIT_VERIFIED"),
  });

  actions.push({
    id: "reject_exit",
    label: "Reject exit",
    variant: "danger",
    enabled:
      hasPermission(can, YMS_PERMISSIONS.YARD_EVENT_WRITE) &&
      (status === "EXIT_HOLDING" || tab === "EXIT_HOLDING"),
  });

  return actions;
}

function rowActivityTab(row: { activityTab?: string; status?: string }) {
  return String(row.activityTab || row.status || "").toUpperCase();
}

export function formatRejectReason(reason: string, note?: string, photoAttached?: boolean) {
  let text = reason.trim();
  const trimmedNote = note?.trim();
  if (trimmedNote) text = `${text} — ${trimmedNote}`;
  if (photoAttached) text = `${text} [photo attached]`;
  return text.slice(0, 1000);
}

export function filterGateActivity(
  rows: { activityTab?: string; status?: string; plate?: string; appointment?: string; transporter?: string }[],
  mode: GateScreenMode,
  search: string,
  pipelineTab: GatePipelineTab = "ALL",
) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    const tab = rowActivityTab(row);
    const status = String(row.status || "").toUpperCase();

    if (mode === "exit") {
      const isExit =
        tab === "EXIT_HOLDING" ||
        tab === "EXIT_VERIFIED" ||
        status === "EXIT_HOLDING" ||
        status === "EXIT_VERIFIED";
      if (!isExit) return false;
    } else {
      const isExit =
        tab === "EXIT_HOLDING" ||
        tab === "EXIT_VERIFIED" ||
        status === "EXIT_HOLDING" ||
        status === "EXIT_VERIFIED";
      if (isExit) return false;
      if (pipelineTab !== "ALL" && tab !== pipelineTab) return false;
    }

    if (!query) return true;
    const haystack = [row.plate, row.appointment, row.transporter, row.status, row.activityTab]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function countGateActivityByTab(
  rows: { activityTab?: string; status?: string }[],
  mode: GateScreenMode,
) {
  const counts: Record<string, number> = { ALL: 0 };
  for (const row of rows) {
    const tab = rowActivityTab(row);
    const status = String(row.status || "").toUpperCase();
    const isExit =
      tab === "EXIT_HOLDING" ||
      tab === "EXIT_VERIFIED" ||
      status === "EXIT_HOLDING" ||
      status === "EXIT_VERIFIED";

    if (mode === "exit") {
      if (!isExit) continue;
    } else if (isExit) {
      continue;
    }

    counts.ALL += 1;
    counts[tab] = (counts[tab] ?? 0) + 1;
  }
  return counts;
}
