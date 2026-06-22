import { useQuery } from "@tanstack/react-query";
import { fetchOverviewDashboard } from "@/src/services/overviewService";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen, hasDocksModuleAccess } from "@/src/lib/moduleAccess";

export function useOverviewDashboard() {
  const { can, isYardAdmin, user } = useYardAuth();
  const enabled = canAccessYardScreen("overview", can, isYardAdmin, user?.role);

  return useQuery({
    queryKey: ["yard", "overview", hasDocksModuleAccess(can)],
    queryFn: () => fetchOverviewDashboard({ includeDocks: hasDocksModuleAccess(can) }),
    refetchInterval: 30_000,
    enabled,
  });
}
