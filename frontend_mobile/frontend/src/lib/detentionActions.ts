export const DETENTION_STATUS_OPTIONS = ["Pending", "Approved", "Disputed", "Paid", "Rejected"] as const;

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
