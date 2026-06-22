export type QueueOverrideForm = {
  targetRank: number;
  reason: string;
  supervisor: string;
};

export function validateQueueOverride(form: QueueOverrideForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!Number.isFinite(form.targetRank) || form.targetRank < 1 || form.targetRank > 500) {
    errors.targetRank = "Rank must be between 1 and 500";
  }
  if (form.reason.trim().length < 3) errors.reason = "Reason must be at least 3 characters";
  if (form.supervisor.trim().length < 2) errors.supervisor = "Supervisor name is required";
  return errors;
}

export function canOverrideQueueEntry(status?: string | null) {
  const normalized = String(status || "").toUpperCase();
  return ["WAITING", "CHECKED_IN", "CALLED", "READY_TO_CALL"].includes(normalized);
}
