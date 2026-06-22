import { useQuery } from "@tanstack/react-query";
import { fetchControlTowerAlerts } from "@/src/services/alertsService";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardTab } from "@/src/lib/moduleAccess";

export function useYardAlerts(options?: { enabled?: boolean }) {
  const { can, isYardAdmin, user } = useYardAuth();
  const allowed =
    options?.enabled ?? canAccessYardTab("alerts", can, isYardAdmin, user?.role);

  return useQuery({
    queryKey: ["yard", "alerts"],
    queryFn: fetchControlTowerAlerts,
    refetchInterval: 30_000,
    enabled: allowed,
  });
}
