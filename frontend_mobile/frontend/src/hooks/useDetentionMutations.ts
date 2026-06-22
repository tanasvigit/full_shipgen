import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDetentionStatus } from "@/src/services/detentionService";

export function useDetentionMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["yard", "detention"] });
  };

  const updateStatus = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks?: string }) =>
      updateDetentionStatus(id, status, remarks),
    onSuccess: invalidate,
  });

  return { updateStatus, busy: updateStatus.isPending };
}
