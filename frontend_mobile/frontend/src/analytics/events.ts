export const AnalyticsEvents = {
  WORKFLOW_START: "workflow.start",
  WORKFLOW_COMPLETE: "workflow.complete",
  OFFLINE_QUEUE_ENQUEUE: "offline.queue.enqueue",
  OFFLINE_QUEUE_DEAD_LETTER: "offline.queue.dead_letter",
  TRACKING_UPLOAD_SUCCESS: "tracking.upload.success",
  SOCKET_RECONNECT: "socket.reconnect",
  SYNC_CONFLICT: "sync.conflict",
  POD_UPLOAD_SUCCESS: "pod.upload.success",
} as const;
