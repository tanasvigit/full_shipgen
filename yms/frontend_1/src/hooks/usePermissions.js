import { useAuth } from "../contexts/AuthContext";
import { PERMS, hasPermission } from "../constants/permissions";

/** UI guards mirroring backend RBAC — backend remains source of truth. */
export function usePermissions() {
  const { can, role, ready, permissions } = useAuth();
  const p = permissions;
  const check = (perm) => can(perm);
  const viewOnlyAppointments =
    hasPermission(p, "module.appointments.view") && !hasPermission(p, "module.appointments");
  const viewOnlyYardMap =
    hasPermission(p, "module.yard_map.view") && !hasPermission(p, "module.yard_map");

  return {
    ready,
    role,
    can: check,
    permissions: p,
    viewOnlyAppointments,
    viewOnlyYardMap,
    canWriteVehicle: check(PERMS.VEHICLE_WRITE),
    canWriteAppointment: check(PERMS.APPOINTMENT_WRITE),
    canWriteQueue: check(PERMS.QUEUE_WRITE),
    canWriteDock: check(PERMS.DOCK_WRITE),
    canCheckIn: check(PERMS.FLOW_CHECK_IN) || check(PERMS.GATE_APPROVE_ENTRY),
    canCallVehicle: check(PERMS.FLOW_CALL),
    canAssignDock: check(PERMS.FLOW_ASSIGN_DOCK),
    canTransitionVehicle: check(PERMS.FLOW_VEHICLE_TRANSITION),
    canWriteDetention: check(PERMS.DETENTION_WRITE),
    canWriteEquipment: check(PERMS.EQUIPMENT_WRITE),
    canWriteLabor: check(PERMS.LABOR_WRITE),
    canWriteYardEvent: check(PERMS.YARD_EVENT_WRITE),
    canApproveEntry: check(PERMS.GATE_APPROVE_ENTRY) || check(PERMS.FLOW_CHECK_IN),
    canRejectEntry: check(PERMS.GATE_REJECT_ENTRY) || check(PERMS.FLOW_VEHICLE_TRANSITION),
    canVerifyExit: check(PERMS.GATE_VERIFY_EXIT) || check(PERMS.FLOW_VEHICLE_TRANSITION),
    canGateOut: check(PERMS.GATE_GATE_OUT) || check(PERMS.FLOW_VEHICLE_TRANSITION),
    canManageLoadingExceptions: check(PERMS.LOADING_MANAGE_EXCEPTIONS) || check(PERMS.YARD_EVENT_WRITE),
    canStartLoading: check(PERMS.LOADING_START) || check(PERMS.YARD_EVENT_WRITE),
    canCompleteLoading: check(PERMS.LOADING_COMPLETE) || check(PERMS.YARD_EVENT_WRITE),
    canExportReports: check(PERMS.REPORTS_EXPORT),
    canViewReports: check(PERMS.REPORTS_VIEW),
  };
}

export default usePermissions;
