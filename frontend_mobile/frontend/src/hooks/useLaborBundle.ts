import { useQuery } from "@tanstack/react-query";
import { fetchLaborBundle } from "@/src/services/laborService";

export function useLaborBundle() {
  return useQuery({
    queryKey: ["yard", "labor"],
    queryFn: fetchLaborBundle,
    refetchInterval: 30_000,
  });
}
