import { useQuery } from "@tanstack/react-query";
import { fetchLoadingOpsBundle } from "@/src/services/loadingOpsService";
import { useYardAuth } from "@/src/contexts/YardAuthContext";

export function useLoadingOpsBundle() {
  const { can } = useYardAuth();

  return useQuery({
    queryKey: ["yard", "loading-ops", can("module.queue")],
    queryFn: () => fetchLoadingOpsBundle(can),
    refetchInterval: 30_000,
  });
}
