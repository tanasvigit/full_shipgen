import { useMemo } from "react";
import usePermissions from "./usePermissions";
import { MOD, hasPermission } from "../constants/permissions";

/**
 * Shared cross-module bundle flags — same values parent pages and drawers must use.
 */
export function useBundlePermissionFlags() {
  const { permissions } = usePermissions();

  return useMemo(() => {
    const check = (perm) => hasPermission(permissions, perm);
    const includeAppointments = check(MOD.APPOINTMENTS);
    const includeAppointmentsView =
      includeAppointments || check(MOD.APPOINTMENTS_VIEW);
    const includeQueue = check(MOD.QUEUE);
    const includeDocks = check(MOD.DOCKS);
    const includeYardZones = check(MOD.YARD_MAP) || check(MOD.YARD_MAP_VIEW);

    return {
      includeAppointments,
      includeAppointmentsView,
      includeQueue,
      includeDocks,
      includeYardZones,
      dockBundleOptions: { includeAppointments, includeQueue },
      laborBundleOptions: { includeAppointments, includeQueue },
      equipmentBundleOptions: { includeAppointments, includeQueue },
      loadingOpsBundleOptions: { includeAppointments, includeQueue },
      appointmentBundleOptions: { includeQueue, includeDocks },
      vehiclesBundleOptions: {
        includeAppointments: includeAppointmentsView,
        includeQueue,
        includeDocks,
        includeYardZones,
      },
    };
  }, [permissions]);
}

export default useBundlePermissionFlags;
