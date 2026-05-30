import { detectScheduleConflicts } from "./scheduleRules";
import { evaluateAssignment } from "../policies/assignmentPolicy";
import { evaluateOrderDeliveryRisks } from "../intelligence/evaluateDeliveryRisks";

const LEVEL_ORDER = { info: 0, warning: 1, danger: 2, blocking: 3 };

/**
 * Unified operational warning evaluation — replaces scattered hook logic.
 */
export function evaluateOperationalWarnings(context = {}) {
  const warnings = [];
  const { driver, vehicle, fleet, order, scheduleItems, shiftCandidate, fileMeta, compliance = [] } = context;

  if (order) {
    evaluateOrderDeliveryRisks(order, { driver }).forEach((r) => {
      warnings.push({
        id: `delivery-${r.code}`,
        level: r.level === "danger" ? "danger" : r.level,
        message: r.message,
      });
    });
  }

  const assignment = evaluateAssignment({
    driver,
    vehicle,
    orderStatus: context.orderStatus,
  });
  assignment.issues.forEach((issue) => {
    warnings.push({
      id: issue.code,
      level: issue.blocking ? "blocking" : issue.severity,
      message: issue.message,
      remediation: issue.remediation,
    });
  });

  if (fleet) {
    const fStatus = String(fleet.status || fleet.meta?.status || "").toLowerCase();
    if (fStatus && fStatus !== "active") {
      warnings.push({
        id: "fleet-inactive",
        level: "info",
        message: `Fleet operational status is ${fStatus}.`,
      });
    }
  }

  if (shiftCandidate && scheduleItems?.length) {
    detectScheduleConflicts(scheduleItems, shiftCandidate).forEach((c) => {
      warnings.push({ id: `shift-${c.id}`, level: "danger", message: c.message });
    });
  }

  compliance.forEach((c) => warnings.push(c));

  return warnings.sort((a, b) => (LEVEL_ORDER[b.level] ?? 0) - (LEVEL_ORDER[a.level] ?? 0));
}

export function hasBlockingWarnings(warnings) {
  return warnings.some((w) => w.level === "blocking" || w.level === "danger");
}
