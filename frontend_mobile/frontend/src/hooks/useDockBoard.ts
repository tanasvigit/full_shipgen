import { useQuery } from "@tanstack/react-query";
import { fetchDockBoard } from "@/src/services/dockService";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { shouldLoadQueueForDocks } from "@/src/lib/moduleAccess";
import { yardPollingOptions } from "@/src/hooks/polling";

export function useDockBoard() {
  const { can } = useYardAuth();
  const includeQueue = shouldLoadQueueForDocks(can);

  return useQuery({
    queryKey: ["yard", "docks", "board", includeQueue],
    queryFn: () => fetchDockBoard({ includeQueue }),
    ...yardPollingOptions,
  });
}
