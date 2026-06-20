import { MOD } from "@yard/constants/permissions";

/** Map Yard console sidebar routes to YMS module permissions. */
export const YARD_SIDEBAR_PERMISSIONS = {
  "/yard": MOD.CONTROL_TOWER,
  "/yard/queue": MOD.QUEUE,
  "/yard/yard": MOD.YARD_MAP,
  "/yard/ai": MOD.AI,
  "/yard/appointments": MOD.APPOINTMENTS,
  "/yard/gate": MOD.GATE,
  "/yard/docks": MOD.DOCKS,
  "/yard/loading": MOD.LOADING,
  "/yard/vehicles": MOD.VEHICLES,
  "/yard/equipment": MOD.EQUIPMENT,
  "/yard/labor": MOD.LABOR,
  "/yard/operations-dashboard": MOD.OPS_DASHBOARD,
  "/yard/reports/delay-analysis": MOD.DELAY_ANALYSIS,
  "/yard/detention": MOD.DETENTION,
  "/yard/kpis": MOD.KPIS,
  "/yard/admin/users": MOD.USER_MGMT,
  "/yard/admin/roles": MOD.ROLE_MGMT,
  "/yard/settings": MOD.SETTINGS,
};

/** IAM sidebar routes → IAM permission slug. */
export const IAM_SIDEBAR_PERMISSIONS = {
  "/iam/users": "users.view",
  "/iam/users/drivers": "users.view",
  "/iam/users/customers": "users.view",
  "/iam/roles": "roles.view",
  "/iam/policies": "policies.view",
  "/iam/groups": "groups.view",
};

/** FleetOps sidebar routes → fleet-ops ability check. */
export const FLEETOPS_SIDEBAR_PERMISSIONS = {
  "/fleet-ops/operations/orders": ["list", "order"],
  "/fleet-ops/operations/routes": ["list", "route"],
  "/fleet-ops/operations/schedule": ["list", "order"],
  "/fleet-ops/operations/order-config": ["list", "order"],
  "/fleet-ops/management/drivers": ["list", "driver"],
  "/fleet-ops/management/vehicles": ["list", "vehicle"],
  "/fleet-ops/management/places": ["list", "place"],
  "/fleet-ops/management/fleets": ["list", "fleet"],
  "/fleet-ops/management/vendors": ["list", "vendor"],
  "/fleet-ops/management/contacts": ["list", "contact"],
  "/fleet-ops/management/issues": ["list", "issue"],
  "/fleet-ops/management/fuel-reports": ["list", "fuel-report"],
  "/fleet-ops/connectivity/telematics": ["list", "telematic"],
  "/fleet-ops/connectivity/sensors": ["list", "sensor"],
  "/fleet-ops/connectivity/tracking": ["list", "vehicle"],
  "/fleet-ops/maintenance/schedules": ["list", "maintenance"],
  "/fleet-ops/maintenance/work-orders": ["list", "work-order"],
  "/fleet-ops/maintenance/equipment": ["list", "equipment"],
  "/fleet-ops/maintenance/parts": ["list", "part"],
  "/fleet-ops/service-areas": ["list", "service-area"],
  "/fleet-ops/settings": ["list", "setting"],
  "/fleet-ops/custom-fields": ["list", "custom-field"],
  "/fleet-ops/tracking/lookup": ["list", "order"],
};

/**
 * @param {{ to: string }} item
 * @param {string} sectionKey
 * @param {{ isAdmin?: boolean, hasPermission: (p: string) => boolean, canFleetops: (a: string, r: string) => boolean, canYardModule: (m: string) => boolean }} ctx
 */
export function canAccessSidebarItem(item, sectionKey, ctx) {
  if (ctx.isAdmin) return true;

  if (sectionKey === "/yard") {
    const mod = YARD_SIDEBAR_PERMISSIONS[item.to];
    return mod ? ctx.canYardModule(mod) : true;
  }

  if (sectionKey === "/iam") {
    const perm = IAM_SIDEBAR_PERMISSIONS[item.to];
    return perm ? ctx.hasPermission(perm) : true;
  }

  if (sectionKey === "/fleet-ops") {
    const check = FLEETOPS_SIDEBAR_PERMISSIONS[item.to];
    if (!check) return true;
    const [action, resource] = check;
    return ctx.canFleetops(action, resource);
  }

  return true;
}

export function filterSidebarGroups(groups, sectionKey, ctx) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessSidebarItem(item, sectionKey, ctx)),
    }))
    .filter((group) => group.items.length > 0);
}
