import { EVENT_CATEGORIES, EVENT_SEVERITY } from "./types";

/** Extensible event metadata registry — add codes without changing renderers. */
export const EVENT_REGISTRY = {
  created: { icon: "created", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.info },
  dispatched: { icon: "dispatch", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.success },
  started: { icon: "route", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.info },
  en_route: { icon: "route", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.info },
  arrived: { icon: "arrived", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.info },
  completed: { icon: "completed", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.success },
  delivered: { icon: "completed", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.success },
  canceled: { icon: "canceled", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.danger },
  cancelled: { icon: "canceled", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.danger },
  failed: { icon: "failed", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.danger },
  delayed: { icon: "delayed", category: EVENT_CATEGORIES.workflow, severity: EVENT_SEVERITY.warning },
  upload: { icon: "upload", category: EVENT_CATEGORIES.document, severity: EVENT_SEVERITY.info },
  edit: { icon: "edit", category: EVENT_CATEGORIES.system, severity: EVENT_SEVERITY.info },
  assign: { icon: "assign", category: EVENT_CATEGORIES.assignment, severity: EVENT_SEVERITY.info },
  reassign: { icon: "assign", category: EVENT_CATEGORIES.assignment, severity: EVENT_SEVERITY.warning },
  schedule: { icon: "schedule", category: EVENT_CATEGORIES.schedule, severity: EVENT_SEVERITY.info },
  compliance: { icon: "compliance", category: EVENT_CATEGORIES.compliance, severity: EVENT_SEVERITY.warning },
};

export function resolveEventMeta(code) {
  const key = String(code || "event").toLowerCase();
  return (
    EVENT_REGISTRY[key] || {
      icon: "event",
      category: EVENT_CATEGORIES.system,
      severity: EVENT_SEVERITY.info,
    }
  );
}
