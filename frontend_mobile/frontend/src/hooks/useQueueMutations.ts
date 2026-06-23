import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignDockToQueueEntry, callQueueEntry, overrideQueueEntry } from "@/src/services/queueService";
import { recordGrossWeight, recordTareWeight } from "@/src/services/weighingService";

export function useQueueMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["yard", "queue"] });
    await queryClient.invalidateQueries({ queryKey: ["yard", "docks"] });
  };

  const callEntry = useMutation({
    mutationFn: (queueEntryId: string) => callQueueEntry(queueEntryId),
    onSuccess: invalidate,
  });

  const assignDock = useMutation({
    mutationFn: ({ queueEntryId, dockId }: { queueEntryId: string; dockId: string }) =>
      assignDockToQueueEntry(queueEntryId, dockId),
    onSuccess: invalidate,
  });

  const overrideRank = useMutation({
    mutationFn: ({
      queueEntryId,
      targetRank,
      reason,
      supervisor,
    }: {
      queueEntryId: string;
      targetRank: number;
      reason: string;
      supervisor: string;
    }) => overrideQueueEntry(queueEntryId, { targetRank, reason, supervisor }),
    onSuccess: invalidate,
  });

  const recordTare = useMutation({
    mutationFn: ({ queueEntryId, weightKg }: { queueEntryId: string; weightKg: number }) =>
      recordTareWeight(queueEntryId, weightKg),
    onSuccess: invalidate,
  });

  const recordGross = useMutation({
    mutationFn: ({ queueEntryId, weightKg }: { queueEntryId: string; weightKg: number }) =>
      recordGrossWeight(queueEntryId, weightKg),
    onSuccess: invalidate,
  });

  const busy =
    callEntry.isPending ||
    assignDock.isPending ||
    overrideRank.isPending ||
    recordTare.isPending ||
    recordGross.isPending;

  return { callEntry, assignDock, overrideRank, recordTare, recordGross, busy };
}
