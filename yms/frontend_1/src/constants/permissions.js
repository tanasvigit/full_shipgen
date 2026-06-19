/** Permission codes — mirror backend auth_rbac.py */

export const MOD = {
  CONTROL_TOWER: "module.control_tower",
  APPOINTMENTS: "module.appointments",
  APPOINTMENTS_VIEW: "module.appointments.view",
  GATE: "module.gate",
  QUEUE: "module.queue",
  YARD_MAP: "module.yard_map",
  YARD_MAP_VIEW: "module.yard_map.view",
  VEHICLES: "module.vehicles",
  DOCKS: "module.docks",
  LABOR: "module.labor",
  EQUIPMENT: "module.equipment",
  LOADING: "module.loading",
  DETENTION: "module.detention",
  OPS_DASHBOARD: "module.operations_dashboard",
  DELAY_ANALYSIS: "module.delay_analysis",
  KPIS: "module.kpis",
  REPORTS: "module.reports",
  USER_MGMT: "module.user_management",
  ROLE_MGMT: "module.role_management",
  SETTINGS: "module.settings",
  AI: "module.ai",
};

export const PERMS = {
  VEHICLE_WRITE: "vehicle.write",
  APPOINTMENT_WRITE: "appointment.write",
  QUEUE_WRITE: "queue.write",
  DOCK_WRITE: "dock.write",
  FLOW_CHECK_IN: "flow.check_in",
  FLOW_CALL: "flow.call",
  FLOW_ASSIGN_DOCK: "flow.assign_dock",
  FLOW_VEHICLE_TRANSITION: "flow.vehicle_transition",
  DETENTION_WRITE: "detention.write",
  EQUIPMENT_WRITE: "equipment.write",
  LABOR_WRITE: "labor.write",
  YARD_EVENT_WRITE: "yard_event.write",
  YARD_ZONE_WRITE: "yard_zone.write",
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",
  GATE_APPROVE_ENTRY: "gate.approve_entry",
  GATE_REJECT_ENTRY: "gate.reject_entry",
  GATE_VERIFY_EXIT: "gate.verify_exit",
  GATE_GATE_OUT: "gate.gate_out",
  DOCK_VIEW_AVAILABILITY: "dock.view_availability",
  LOADING_START: "loading.start",
  LOADING_COMPLETE: "loading.complete",
  LOADING_MANAGE_EXCEPTIONS: "loading.manage_exceptions",
};

/** View-only module access satisfies full module check. */
export function hasPermission(permissions, permission) {
  if (!permissions?.length) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  if (permission === MOD.APPOINTMENTS && permissions.includes(MOD.APPOINTMENTS_VIEW)) return true;
  if (permission === MOD.YARD_MAP && permissions.includes(MOD.YARD_MAP_VIEW)) return true;
  const aliases = {
    [PERMS.GATE_APPROVE_ENTRY]: [PERMS.FLOW_CHECK_IN],
    [PERMS.GATE_REJECT_ENTRY]: [PERMS.FLOW_VEHICLE_TRANSITION],
    [PERMS.GATE_VERIFY_EXIT]: [PERMS.FLOW_VEHICLE_TRANSITION],
    [PERMS.GATE_GATE_OUT]: [PERMS.FLOW_VEHICLE_TRANSITION],
    [PERMS.LOADING_MANAGE_EXCEPTIONS]: [PERMS.YARD_EVENT_WRITE],
    [PERMS.LOADING_START]: [PERMS.YARD_EVENT_WRITE],
    [PERMS.LOADING_COMPLETE]: [PERMS.YARD_EVENT_WRITE],
  };
  for (const alt of aliases[permission] || []) {
    if (permissions.includes(alt)) return true;
  }
  return false;
}
