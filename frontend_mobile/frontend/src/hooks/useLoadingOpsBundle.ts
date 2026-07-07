import { useQuery } from "@tanstack/react-query";
import { fetchLoadingOpsBundle } from "@/src/services/loadingOpsService";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { yardPollingOptions } from "@/src/hooks/polling";

export function useLoadingOpsBundle() {
  const { can } = useYardAuth();

  return useQuery({
    queryKey: ["yard", "loading-ops", can("module.queue")],
    queryFn: () => fetchLoadingOpsBundle(can),
    ...yardPollingOptions,
  });
}
