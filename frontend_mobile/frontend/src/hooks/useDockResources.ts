import { useQuery } from "@tanstack/react-query";
import { fetchAssignableEquipment, fetchAssignableLabor } from "@/src/services/dockService";

export function useDockResources(enabled: boolean, dockId?: string | null) {
  return useQuery({
    queryKey: ["yard", "docks", "resources", dockId || "none"],
    queryFn: async () => {
      const [labor, equipment] = await Promise.all([
        fetchAssignableLabor(dockId),
        fetchAssignableEquipment(dockId),
      ]);
      return { labor, equipment };
    },
    enabled,
    staleTime: 15_000,
  });
}
