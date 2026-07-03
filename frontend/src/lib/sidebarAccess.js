import { MOD } from "@yard/constants/permissions";
import { PARKING_SIDEBAR_PERMISSIONS } from "@/lib/parkingSidebar";

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
  "/fleet-ops/operations/service-rates": ["list", "service-rate"],
  "/fleet-ops/operations/orchestrator": ["dispatch", "order"],
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
  "/fleet-ops/connectivity/devices": ["list", "device"],
  "/fleet-ops/connectivity/device-events": ["list", "device-event"],
  "/fleet-ops/connectivity/sensors": ["list", "sensor"],
  "/fleet-ops/connectivity/tracking": ["list", "vehicle"],
  "/fleet-ops/connectivity/vehicle-devices": ["list", "device"],
  "/fleet-ops/maintenance/calendar": ["list", "maintenance"],
  "/fleet-ops/maintenance/schedules": ["list", "maintenance"],
  "/fleet-ops/maintenance/records": ["list", "maintenance"],
  "/fleet-ops/maintenance/work-orders": ["list", "work-order"],
  "/fleet-ops/maintenance/equipment": ["list", "equipment"],
  "/fleet-ops/maintenance/parts": ["list", "part"],
  "/fleet-ops/service-areas": ["list", "service-area"],
  "/fleet-ops/settings": ["list", "setting"],
  "/fleet-ops/custom-fields": ["list", "custom-field"],
  "/fleet-ops/tracking/lookup": ["list", "order"],
  "/fleet-ops/admin/warranties": ["list", "warranty"],
  "/fleet-ops/admin/manifests": ["list", "order"],
  "/fleet-ops/admin/payloads": ["list", "payload"],
  "/fleet-ops/admin/entities": ["list", "entity"],
  "/fleet-ops/admin/proofs": ["list", "proof"],
  "/fleet-ops/admin/purchase-rates": ["list", "purchase-rate"],
  "/fleet-ops/admin/tracking-numbers": ["list", "tracking-number"],
  "/fleet-ops/admin/tracking-statuses": ["list", "tracking-status"],
};

/**
 * @param {{ to: string }} item
 * @param {string} sectionKey
 * @param {{ isAdmin?: boolean, hasPermission: (p: string) => boolean, canFleetops: (a: string, r: string) => boolean, canYardModule: (m: string) => boolean }} ctx
 */
export function canAccessSidebarItem(item, sectionKey, ctx) {
  if (ctx.isAdmin && sectionKey !== "/parking") return true;

  if (sectionKey === "/yard") {
    const mod = YARD_SIDEBAR_PERMISSIONS[item.to];
    return mod ? ctx.canYardModule(mod) : true;
  }

  if (sectionKey === "/parking") {
    const perm = PARKING_SIDEBAR_PERMISSIONS[item.to];
    if (!perm) return true;
    const role = ctx.parkingRole;
    if (role === "admin" && !item.to.startsWith("/parking/admin")) return false;
    if (role === "supervisor" && !item.to.startsWith("/parking/supervisor")) return false;
    if (role === "operator" && !item.to.startsWith("/parking/operator")) return false;
    return ctx.canParkingModule?.(perm) ?? false;
  }

  if (sectionKey === "/iam") {
    const perm = IAM_SIDEBAR_PERMISSIONS[item.to];
    return perm ? ctx.hasPermission(perm) : true;
  }

  if (sectionKey === "/fleet-ops") {
    if (item.to === "/fleet-ops/operations/orchestrator") {
      return (
        ctx.canFleetops("dispatch", "order") ||
        ctx.canFleetops("update", "order")
      );
    }
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
