import { useQuery } from "@tanstack/react-query";
import { fetchCallableQueueOptions } from "@/src/services/dockService";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { hasQueueModuleAccess } from "@/src/lib/moduleAccess";

export function useDockCallableQueue(enabled: boolean) {
  const { can } = useYardAuth();
  const includeQueue = hasQueueModuleAccess(can);

  return useQuery({
    queryKey: ["yard", "docks", "callable-queue", includeQueue],
    queryFn: () => fetchCallableQueueOptions({ includeQueue }),
    enabled: enabled && includeQueue,
    staleTime: 10_000,
  });
}
