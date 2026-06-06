import { useMemo } from "react";
import { useAuth } from "@/src/contexts/AuthContext";

export function usePermissions() {
  const { canFleetops, permissionReason } = useAuth();

  return useMemo(
    () => ({
      canFleetops,
      permissionReason,
      canDispatchOrder: canFleetops("dispatch", "order"),
      canUpdateOrder: canFleetops("update", "order"),
      canViewOrder: canFleetops("view", "order"),
      canCreateOrder: canFleetops("create", "order"),
    }),
    [canFleetops, permissionReason]
  );
}

