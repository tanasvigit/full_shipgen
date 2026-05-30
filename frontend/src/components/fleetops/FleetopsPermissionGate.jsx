import { useAuth } from "@/contexts/AuthContext";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";

const PERMISSIVE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_FLEETOPS_PERMISSIVE === "true";

/**
 * Fail-closed guard for /fleet-ops/* — blocks UI when authenticated user has no FleetOps permissions.
 */
export default function FleetopsPermissionGate({ children }) {
  const { authReady, user } = useAuth();
  const { permissionsUnknown } = useFleetopsAbility();

  if (!authReady) {
    return (
      <div className="p-8 text-sm text-[#4B5563]" data-testid="fleetops-permissions-loading">
        Loading workspace permissions…
      </div>
    );
  }

  if (!user) {
    return children;
  }

  if (permissionsUnknown && !PERMISSIVE) {
    return (
      <div className="p-8 text-sm text-[#4B5563]" data-testid="fleetops-forbidden">
        You do not have permission to access FleetOps. Contact your administrator to assign fleet-ops
        permissions.
      </div>
    );
  }

  return children;
}
