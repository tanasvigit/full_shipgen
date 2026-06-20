import { useQuery } from "@tanstack/react-query";
import { ymsRequest } from "@/src/lib/ymsApi";

export type QueueBundle = {
  entries: Array<{
    queueEntryId: string;
    plate?: string;
    transporter?: string;
    displayStatus?: string;
    queueRank?: number;
    waitingMin?: number;
    priorityScore?: number;
    status?: string;
    dockCode?: string;
    material?: string;
  }>;
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
