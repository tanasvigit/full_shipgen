import { useQuery } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { workflowService } from "@/src/services/workflowService";
import { queryKeys } from "@/src/query/keys";

export function useNextActivityQuery(orderId: string | undefined) {
  const { companyUuid, enabled } = useCompanyScope();
  const ref = String(orderId || "");

  return useQuery({
    queryKey: queryKeys.nextActivity(companyUuid, ref),
    queryFn: () => workflowService.getNextActivity(ref),
    enabled: enabled && Boolean(ref),
    staleTime: 10_000,
  });
}
