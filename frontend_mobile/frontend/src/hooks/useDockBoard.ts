import { useQuery } from "@tanstack/react-query";
import { fetchDockBoard } from "@/src/services/dockService";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { shouldLoadQueueForDocks } from "@/src/lib/moduleAccess";

export function useDockBoard() {
  const { can } = useYardAuth();
  const includeQueue = shouldLoadQueueForDocks(can);

  return useQuery({
    queryKey: ["yard", "docks", "board", includeQueue],
    queryFn: () => fetchDockBoard({ includeQueue }),
    refetchInterval: 30_000,
  });
}
