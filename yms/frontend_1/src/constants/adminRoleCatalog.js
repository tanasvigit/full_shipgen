import { MOD, PERMS } from "./permissions";

export const BUSINESS_ROLES = [
  { code: "yard_admin", label: "Yard Admin" },
  { code: "yard_manager", label: "Yard Manager" },
  { code: "gate_operator", label: "Gate Operator" },
  { code: "yard_coordinator", label: "Yard Coordinator" },
  { code: "dock_supervisor", label: "Dock Supervisor" },
];

export const MODULE_CATALOG = [
  { key: "controlTower", label: "Control Tower", fullPermission: MOD.CONTROL_TOWER },
  { key: "appointments", label: "Appointments", fullPermission: MOD.APPOINTMENTS, viewPermission: MOD.APPOINTMENTS_VIEW },
  { key: "gate", label: "Gate", fullPermission: MOD.GATE },
  { key: "queue", label: "Queue", fullPermission: MOD.QUEUE },
  { key: "yardMap", label: "Yard Map", fullPermission: MOD.YARD_MAP, viewPermission: MOD.YARD_MAP_VIEW },
  { key: "vehicles", label: "Vehicles", fullPermission: MOD.VEHICLES },
  { key: "docks", label: "Docks", fullPermission: MOD.DOCKS },
  { key: "labor", label: "Labor", fullPermission: MOD.LABOR },
  { key: "equipment", label: "Equipment", fullPermission: MOD.EQUIPMENT },
  { key: "loading", label: "Loading", fullPermission: MOD.LOADING },
  { key: "detention", label: "Detention", fullPermission: MOD.DETENTION },
  { key: "reports", label: "Reports", fullPermission: MOD.REPORTS },
];

export const ACTION_CATALOG = [
  { key: "assignDock", label: "Assign Dock", permissions: [PERMS.FLOW_ASSIGN_DOCK] },
  { key: "releaseDock", label: "Release Dock", permissions: [PERMS.DOCK_WRITE] },
  { key: "assignLabor", label: "Assign Labor", permissions: [PERMS.LABOR_WRITE] },
  { key: "assignEquipment", label: "Assign Equipment", permissions: [PERMS.EQUIPMENT_WRITE] },
  { key: "startLoading", label: "Start Loading", permissions: [PERMS.LOADING_START] },
  { key: "completeLoading", label: "Complete Loading", permissions: [PERMS.LOADING_COMPLETE] },
  { key: "manageLoadingExceptions", label: "Manage Loading Exceptions", permissions: [PERMS.LOADING_MANAGE_EXCEPTIONS] },
  { key: "approveGateEntry", label: "Approve Gate Entry", permissions: [PERMS.GATE_APPROVE_ENTRY] },
  { key: "verifyExit", label: "Verify Exit", permissions: [PERMS.GATE_VERIFY_EXIT] },
  { key: "gateOut", label: "Gate Out", permissions: [PERMS.GATE_GATE_OUT] },
  { key: "manageQueue", label: "Manage Queue", permissions: [PERMS.QUEUE_WRITE, PERMS.FLOW_CALL] },
  { key: "bookAppointment", label: "Book Appointment", permissions: [PERMS.APPOINTMENT_WRITE] },
  { key: "exportReports", label: "Export Reports", permissions: [PERMS.REPORTS_EXPORT] },
];

export const ROLE_BLUEPRINTS = {
  yard_admin: {
    label: "Yard Admin",
    description: "Owns full YARD.OS administration, operations visibility, and control settings.",
    modules: MODULE_CATALOG.reduce((acc, module) => ({ ...acc, [module.key]: "full" }), {}),
    actions: ACTION_CATALOG.reduce((acc, action) => ({ ...acc, [action.key]: true }), {}),
  },
  yard_manager: {
    label: "Yard Manager",
    description: "Oversees daily yard operations, orchestration, and business reporting.",
    modules: {
      controlTower: "full",
      appointments: "full",
      gate: "none",
      queue: "full",
      yardMap: "full",
      vehicles: "full",
      docks: "full",
      labor: "full",
      equipment: "full",
      loading: "full",
      detention: "full",
      reports: "full",
    },
    actions: {
      assignDock: true,
      releaseDock: true,
      assignLabor: true,
      assignEquipment: true,
      startLoading: true,
      completeLoading: true,
      manageLoadingExceptions: true,
      approveGateEntry: false,
      verifyExit: false,
      gateOut: false,
      manageQueue: true,
      bookAppointment: true,
      exportReports: true,
    },
  },
  gate_operator: {
    label: "Gate Operator",
    description: "Handles inbound and outbound gate processing, verification, and gate control.",
    modules: {
      controlTower: "none",
      appointments: "view",
      gate: "full",
      queue: "none",
      yardMap: "view",
      vehicles: "full",
      docks: "none",
      labor: "none",
      equipment: "none",
      loading: "none",
      detention: "none",
      reports: "none",
    },
    actions: {
      assignDock: false,
      releaseDock: false,
      assignLabor: false,
      assignEquipment: false,
      startLoading: false,
      completeLoading: false,
      manageLoadingExceptions: false,
      approveGateEntry: true,
      verifyExit: true,
      gateOut: true,
      manageQueue: false,
      bookAppointment: false,
      exportReports: false,
    },
  },
  yard_coordinator: {
    label: "Yard Coordinator",
    description: "Coordinates queue movement, staging, and yard traffic planning.",
    modules: {
      controlTower: "none",
      appointments: "view",
      gate: "none",
      queue: "full",
      yardMap: "full",
      vehicles: "full",
      docks: "none",
      labor: "none",
      equipment: "none",
      loading: "none",
      detention: "none",
      reports: "none",
    },
    actions: {
      assignDock: false,
      releaseDock: false,
      assignLabor: false,
      assignEquipment: false,
      startLoading: false,
      completeLoading: false,
      manageLoadingExceptions: false,
      approveGateEntry: false,
      verifyExit: false,
      gateOut: false,
      manageQueue: true,
      bookAppointment: false,
      exportReports: false,
    },
  },
  dock_supervisor: {
    label: "Dock Supervisor",
    description: "Manages dock operations, labor assignments, equipment allocation, and loading activities.",
    modules: {
      controlTower: "none",
      appointments: "none",
      gate: "none",
      queue: "none",
      yardMap: "full",
      vehicles: "full",
      docks: "full",
      labor: "full",
      equipment: "full",
      loading: "full",
      detention: "none",
      reports: "none",
    },
    actions: {
      assignDock: true,
      releaseDock: true,
      assignLabor: true,
      assignEquipment: true,
      startLoading: true,
      completeLoading: true,
      manageLoadingExceptions: true,
      approveGateEntry: false,
      verifyExit: false,
      gateOut: false,
      manageQueue: false,
      bookAppointment: false,
      exportReports: false,
    },
  },
};

export function getRoleMatrixValue(roleConfig, moduleKey) {
  const value = roleConfig?.modules?.[moduleKey] || "none";
  if (value === "full") return "Full Access";
  if (value === "view") return "View Only";
  return "No Access";
}

export function mapRoleToHiddenPermissions(roleConfig) {
  const permissions = new Set();
  MODULE_CATALOG.forEach((module) => {
    const level = roleConfig.modules[module.key];
    if (level === "full") permissions.add(module.fullPermission);
    if (level === "view" && module.viewPermission) permissions.add(module.viewPermission);
  });
  ACTION_CATALOG.forEach((action) => {
    if (!roleConfig.actions[action.key]) return;
    action.permissions.forEach((permission) => permissions.add(permission));
  });
  return [...permissions];
}
