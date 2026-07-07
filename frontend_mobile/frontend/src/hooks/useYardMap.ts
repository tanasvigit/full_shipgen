import { useQuery } from "@tanstack/react-query";
import { fetchYardMapBundle } from "@/src/services/yardMapService";
import { yardPollingOptions } from "@/src/hooks/polling";

export function useYardMap() {
  return useQuery({
    queryKey: ["yard", "yard-map"],
    queryFn: fetchYardMapBundle,
    ...yardPollingOptions,
  });
}
