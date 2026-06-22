import { useQuery } from "@tanstack/react-query";
import { fetchDetentionBundle } from "@/src/services/detentionService";

export function useDetentionBundle() {
  return useQuery({
    queryKey: ["yard", "detention"],
    queryFn: fetchDetentionBundle,
    refetchInterval: 60_000,
  });
}
