import { unwrapEntity } from "@/src/lib/apiUnwrap";
import type { WorkflowActivityDTO } from "@/src/types/api/orders";

export function normalizeActivityList(payload: unknown): WorkflowActivityDTO[] {
  if (Array.isArray(payload)) return payload.filter(Boolean) as WorkflowActivityDTO[];
  const one = unwrapEntity<WorkflowActivityDTO>(payload as Record<string, unknown>, [
    "activity",
    "next_activity",
    "data",
  ]);
  return one ? [one] : [];
}

export function activityCode(activity: WorkflowActivityDTO) {
  return String(activity?.code || activity?.key || "");
}

export function pickFirstActivity(activities: WorkflowActivityDTO[]) {
  return activities[0] ?? null;
}

export function pickAdvanceActivity(activities: WorkflowActivityDTO[], nextCode?: string) {
  const code = String(nextCode || "").trim().toLowerCase();
  return (
    activities.find((row) => activityCode(row).toLowerCase() === code) ||
    activities[0] ||
    null
  );
}

export function pickCompletionActivity(activities: WorkflowActivityDTO[]) {
  return activities.find((row) => Boolean(row.complete)) || activities[0] || null;
}

export function mapNextActivityPreview(activity: WorkflowActivityDTO | null) {
  if (!activity) return null;
  return {
    code: activityCode(activity),
    name: String(activity.status || activity.details || activityCode(activity)),
    raw: activity,
  };
}
