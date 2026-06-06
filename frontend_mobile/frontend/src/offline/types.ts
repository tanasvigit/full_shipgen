export type QueueItemState = "pending" | "syncing" | "failed" | "completed" | "dead-letter";

export type QueueItemType =
  | "workflow.start"
  | "workflow.advance"
  | "workflow.complete"
  | "tracking.upload"
  | "pod.signature"
  | "pod.photo"
  | "pod.qr";

export type QueueItem = {
  id: string;
  companyUuid: string;
  userId: string;
  type: QueueItemType;
  payload: Record<string, unknown>;
  retries: number;
  createdAt: number;
  lastAttemptAt?: number;
  state: QueueItemState;
  dedupeKey?: string;
};

export type EnqueueInput = {
  companyUuid: string;
  userId: string;
  type: QueueItemType;
  payload: Record<string, unknown>;
  dedupeKey?: string;
};
