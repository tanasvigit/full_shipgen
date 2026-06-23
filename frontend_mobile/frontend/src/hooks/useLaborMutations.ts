import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LaborFormInput } from "@/src/lib/laborActions";
import { createLaborTeam, deleteLaborTeam, updateLaborTeam } from "@/src/services/laborService";

export function useLaborMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["yard", "labor"] });
    await queryClient.invalidateQueries({ queryKey: ["yard", "docks", "resources"] });
  };

  const createLabor = useMutation({
    mutationFn: (input: LaborFormInput) => createLaborTeam(input),
    onSuccess: invalidate,
  });

  const updateLabor = useMutation({
    mutationFn: ({ laborId, input }: { laborId: string; input: LaborFormInput }) =>
      updateLaborTeam(laborId, input),
    onSuccess: invalidate,
  });

  const deleteLabor = useMutation({
    mutationFn: (laborId: string) => deleteLaborTeam(laborId),
    onSuccess: invalidate,
  });

  const busy = createLabor.isPending || updateLabor.isPending || deleteLabor.isPending;

  return { createLabor, updateLabor, deleteLabor, busy };
}
