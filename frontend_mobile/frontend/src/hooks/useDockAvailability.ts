import { useQuery } from "@tanstack/react-query";
import { fetchDocks } from "@/src/services/queueService";
import { summarizeDockAvailability } from "@/src/lib/queueActions";

export function useDockAvailability(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["yard", "docks", "availability"],
    queryFn: async () => {
      const docks = await fetchDocks();
      return {
        docks,
        summary: summarizeDockAvailability(docks),
      };
    },
    refetchInterval: 60_000,
    enabled: options?.enabled ?? true,
  });
}
