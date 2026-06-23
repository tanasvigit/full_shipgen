import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EquipmentFormInput } from "@/src/lib/equipmentActions";
import { createEquipment, deleteEquipment, updateEquipment } from "@/src/services/equipmentService";

export function useEquipmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["yard", "equipment"] });
    await queryClient.invalidateQueries({ queryKey: ["yard", "docks", "resources"] });
  };

  const createEquipmentEntry = useMutation({
    mutationFn: (input: EquipmentFormInput) => createEquipment(input),
    onSuccess: invalidate,
  });

  const updateEquipmentEntry = useMutation({
    mutationFn: ({ equipmentId, input }: { equipmentId: string; input: EquipmentFormInput }) =>
      updateEquipment(equipmentId, input),
    onSuccess: invalidate,
  });

  const deleteEquipmentEntry = useMutation({
    mutationFn: (equipmentId: string) => deleteEquipment(equipmentId),
    onSuccess: invalidate,
  });

  const busy = createEquipmentEntry.isPending || updateEquipmentEntry.isPending || deleteEquipmentEntry.isPending;

  return { createEquipmentEntry, updateEquipmentEntry, deleteEquipmentEntry, busy };
}
