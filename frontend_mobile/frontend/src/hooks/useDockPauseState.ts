import { useQuery } from "@tanstack/react-query";
import { fetchLoadingPauseState } from "@/src/services/dockService";

export function useDockPauseState(
  vehicleId?: string | null,
  queueEntryId?: string | null,
  enabled = false,
) {
  return useQuery({
    queryKey: ["yard", "docks", "pause-state", vehicleId || "none", queueEntryId || "none"],
    queryFn: () =>
      fetchLoadingPauseState({
        vehicleId,
        queueEntryId,
      }),
    enabled: enabled && Boolean(vehicleId || queueEntryId),
    staleTime: 5_000,
  });
}
