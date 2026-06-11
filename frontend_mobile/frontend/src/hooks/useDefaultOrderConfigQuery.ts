import { useQuery } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { orderActionsService } from "@/src/services/orderActionsService";

export function useDefaultOrderConfigQuery(enabled = true) {
  const { companyUuid } = useCompanyScope();

  return useQuery({
    queryKey: ["orderConfig", companyUuid],
    queryFn: () => orderActionsService.getDefaultOrderConfig(),
    enabled: enabled && Boolean(companyUuid),
    staleTime: 5 * 60 * 1000,
  });
}
