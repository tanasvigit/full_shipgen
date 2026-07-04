import { useQuery } from "@tanstack/react-query";
import { fetchLoadingCompleteState } from "@/src/services/dockService";

export function useDockCompleteState(
  vehicleId?: string | null,
  queueEntryId?: string | null,
  enabled = false,
) {
  return useQuery({
    queryKey: ["yard", "docks", "complete-state", vehicleId || "none", queueEntryId || "none"],
    queryFn: () =>
      fetchLoadingCompleteState({
        vehicleId,
        queueEntryId,
      }),
    enabled: enabled && Boolean(vehicleId || queueEntryId),
    staleTime: 5_000,
  });
}
