export const DETENTION_STATUS_OPTIONS = ["Pending", "Approved", "Disputed", "Paid", "Rejected"] as const;

export type DetentionKpiFilter = "all" | "disputed" | "today";

export function filterDetentionByKpi<T extends { status: string; billingDate?: string | null }>(
  records: T[],
  kpi: DetentionKpiFilter,
): T[] {
  if (kpi === "disputed") {
    return records.filter((row) => row.status === "Disputed");
  }
  if (kpi === "today") {
    const today = new Date().toISOString().slice(0, 10);
    return records.filter((row) => row.billingDate === today);
  }
  return records;
}

export function canUpdateDetentionStatus(currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus) return true;
  const transitions: Record<string, string[]> = {
    Pending: ["Approved", "Disputed", "Rejected"],
    Approved: ["Paid", "Disputed"],
    Disputed: ["Approved", "Rejected"],
    Rejected: [],
    Paid: [],
  };
  return (transitions[currentStatus] ?? []).includes(nextStatus);
}
