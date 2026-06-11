import { useMutation } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { refreshOrderScope } from "@/src/query/invalidation";
import { orderActionsService } from "@/src/services/orderActionsService";
import { useQueryClient } from "@tanstack/react-query";

export function useOrderActionsMutations(orderRef: string) {
  const queryClient = useQueryClient();
  const { companyUuid } = useCompanyScope();

  const settle = async () => {
    await refreshOrderScope(queryClient, companyUuid, orderRef);
  };

  const assignMutation = useMutation({
    mutationFn: (input: { driverId: string; vehicleId?: string }) =>
      orderActionsService.assignDriverAndVehicle(orderRef, input),
    onSuccess: () => settle(),
  });

  const unassignMutation = useMutation({
    mutationFn: () => orderActionsService.unassignDriver(orderRef),
    onSuccess: () => settle(),
  });

  const dispatchMutation = useMutation({
    mutationFn: () => orderActionsService.dispatch(orderRef),
    onSuccess: () => settle(),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderActionsService.cancel(orderRef),
    onSuccess: () => settle(),
  });

  const busy =
    assignMutation.isPending ||
    unassignMutation.isPending ||
    dispatchMutation.isPending ||
    cancelMutation.isPending;

  return {
    assignMutation,
    unassignMutation,
    dispatchMutation,
    cancelMutation,
    busy,
  };
}
