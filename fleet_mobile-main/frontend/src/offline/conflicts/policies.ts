export type ConflictKind =
  | "order_canceled"
  | "activity_invalid"
  | "driver_unassigned"
  | "duplicate_pod"
  | "stale_workflow";

export type ConflictRecord = {
  id: string;
  companyUuid: string;
  orderId?: string;
  kind: ConflictKind;
  message: string;
  createdAt: number;
  queueItemId?: string;
};

export function classifyConflict(error: unknown) {
  const status = (error as { status?: number })?.status;
  const message = String((error as Error)?.message || "").toLowerCase();

  if (status === 404 && message.includes("order")) {
    return "order_canceled" as const;
  }
  if (status === 404 && message.includes("activity")) {
    return "activity_invalid" as const;
  }
  if (status === 403 || message.includes("unassigned")) {
    return "driver_unassigned" as const;
  }
  if (status === 409 || message.includes("duplicate")) {
    return "duplicate_pod" as const;
  }
  if (status === 400 || message.includes("nothing to see")) {
    return "stale_workflow" as const;
  }
  return null;
}

export function conflictMessage(kind: ConflictKind) {
  switch (kind) {
    case "order_canceled":
      return "This order was canceled or removed while you were offline.";
    case "activity_invalid":
      return "The workflow step is no longer valid. Refresh to get the latest activity.";
    case "driver_unassigned":
      return "You are no longer assigned to this order.";
    case "duplicate_pod":
      return "This proof of delivery was already uploaded.";
    case "stale_workflow":
      return "Workflow state changed on the server. Retry after refresh.";
    default:
      return "Sync conflict detected.";
  }
}
