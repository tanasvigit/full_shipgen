import { useQuery } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { mapLiveDriverPins } from "@/src/lib/liveMapper";
import { liveService } from "@/src/services/liveService";
import { queryKeys } from "@/src/query/keys";

const LIVE_POLL_MS = 30_000;

export function useLiveDriversQuery(enabled: boolean) {
  const { companyUuid, enabled: scopeEnabled } = useCompanyScope();

  return useQuery({
    queryKey: queryKeys.liveDrivers(companyUuid),
    queryFn: async () => mapLiveDriverPins(await liveService.listDrivers()),
    enabled: enabled && scopeEnabled,
    staleTime: 15_000,
    refetchInterval: enabled ? LIVE_POLL_MS : false,
  });
}
