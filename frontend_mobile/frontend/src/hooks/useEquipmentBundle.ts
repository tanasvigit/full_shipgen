import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentBundle } from "@/src/services/equipmentService";

export function useEquipmentBundle() {
  return useQuery({
    queryKey: ["yard", "equipment"],
    queryFn: fetchEquipmentBundle,
    refetchInterval: 30_000,
  });
}
