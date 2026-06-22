import { useQuery } from "@tanstack/react-query";
import { fetchYardMapBundle } from "@/src/services/yardMapService";

export function useYardMap() {
  return useQuery({
    queryKey: ["yard", "yard-map"],
    queryFn: fetchYardMapBundle,
    refetchInterval: 30_000,
  });
}
