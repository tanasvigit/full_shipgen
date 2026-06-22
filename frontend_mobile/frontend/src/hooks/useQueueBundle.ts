import { useQuery } from "@tanstack/react-query";
import { ymsRequest } from "@/src/lib/ymsApi";
import type { QueueEntryRow } from "@/src/services/queueService";

export type QueueBundle = {
  entries: QueueEntryRow[];
  summary: {
    inQueue?: number;
    avgWaitMin?: number;
    readyToCall?: number;
    highPriority?: number;
  };
};

export function useQueueBundle() {
  return useQuery({
    queryKey: ["yard", "queue", "bundle"],
    queryFn: () => ymsRequest<QueueBundle>("/queue/bundle"),
    refetchInterval: 30_000,
  });
}
