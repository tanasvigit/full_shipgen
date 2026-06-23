import type { MobileUser } from "@/src/services/authService";
import { isDriverUser } from "@/src/lib/driver";

export type MobileModule = "driver" | "yard";

export const YARD_ROLE = {
  ADMIN: "yard_admin",
  MANAGER: "yard_manager",
  GATE_OPERATOR: "gate_operator",
  COORDINATOR: "yard_coordinator",
  DOCK_SUPERVISOR: "dock_supervisor",
} as const;

export type YardTabName =
  | "overview"
  | "ops"
  | "gate"
  | "appointments"
  | "queue"
  | "docks"
  | "vehicles"
  | "yard-map"
  | "search"
  | "alerts"
  | "more"
  | "profile";

/** Bottom tabs each role should see on mobile (keeps the app lightweight). */
export const YARD_ROLE_TABS: Record<string, YardTabName[]> = {
  [YARD_ROLE.ADMIN]: ["overview", "alerts", "search", "more", "profile"],
  [YARD_ROLE.MANAGER]: ["overview", "alerts", "search", "more", "profile"],
  [YARD_ROLE.GATE_OPERATOR]: ["gate", "appointments", "search", "more", "profile"],
  [YARD_ROLE.COORDINATOR]: ["queue", "search", "more", "profile"],
  [YARD_ROLE.DOCK_SUPERVISOR]: ["docks", "search", "more", "profile"],
};

/** Default landing route after YMS login or when reopening the app. */
export const YARD_HOME_ROUTE: Record<string, `/(yard)/${Exclude<YardTabName, "profile">}`> = {
  [YARD_ROLE.ADMIN]: "/(yard)/overview",
  [YARD_ROLE.MANAGER]: "/(yard)/overview",
  [YARD_ROLE.GATE_OPERATOR]: "/(yard)/gate",
  [YARD_ROLE.COORDINATOR]: "/(yard)/queue",
  [YARD_ROLE.DOCK_SUPERVISOR]: "/(yard)/docks",
};

/** Module permissions required when role mapping is unknown (custom roles). */
export const YARD_TAB_MODULES: Partial<Record<YardTabName, string | null>> = {
  gate: "module.gate",
  appointments: "module.appointments",
  queue: "module.queue",
  docks: "module.docks",
  vehicles: "module.vehicles",
  "yard-map": "module.yard_map",
  "loading-ops": "module.loading",
  labor: "module.labor",
  equipment: "module.equipment",
  overview: null,
  ops: null,
  search: null,
  alerts: "module.control_tower",
  more: null,
  profile: null,
};

export type YardAccessUser = {
  role?: string | null;
  permissions?: string[];
};

export function createYardPermissionChecker(user: YardAccessUser | null | undefined) {
  const isYardAdmin = user?.role === YARD_ROLE.ADMIN;
  const permissions = user?.permissions ?? [];
  return (permission: string) => {
    if (isYardAdmin || permissions.includes("*")) return true;
    return permissions.includes(permission);
  };
}

function hasOverviewModuleAccess(can: (permission: string) => boolean, isYardAdmin: boolean) {
  if (isYardAdmin) return true;
  return (
    can("module.control_tower") ||
    can("module.operations_dashboard") ||
    can("module.kpis")
  );
}

function hasAlertsModuleAccess(can: (permission: string) => boolean, isYardAdmin: boolean) {
  if (isYardAdmin) return true;
  return can("module.control_tower");
}

/** Appointments API accepts module.appointments, view-only, or gate bundle (gate operator). */
export function hasAppointmentsModuleAccess(can: (permission: string) => boolean) {
  return (
    can("module.appointments") ||
    can("module.appointments.view") ||
    can("module.gate")
  );
}

export function hasYardMapModuleAccess(can: (permission: string) => boolean) {
  return can("module.yard_map") || can("module.yard_map.view");
}

export function hasVehiclesModuleAccess(can: (permission: string) => boolean) {
  return can("module.vehicles");
}

export function hasDocksModuleAccess(can: (permission: string) => boolean) {
  return can("module.docks");
}

export function hasQueueModuleAccess(can: (permission: string) => boolean) {
  return can("module.queue");
}

/** Dock views need queue-entry weights (TW/GW/NW) even when the role only has docks access. */
export function shouldLoadQueueForDocks(can: (permission: string) => boolean) {
  return hasQueueModuleAccess(can) || hasDocksModuleAccess(can);
}

export function hasLoadingModuleAccess(can: (permission: string) => boolean) {
  return can("module.loading");
}

export function hasLaborModuleAccess(can: (permission: string) => boolean) {
  return can("module.labor");
}

export function hasEquipmentModuleAccess(can: (permission: string) => boolean) {
  return can("module.equipment");
}

/** Which modules appear on the Shipgen landing screen after auth context is known. */
export function visibleMobileModules(
  user: MobileUser | null | undefined,
  options?: { isYardAuthenticated?: boolean },
): MobileModule[] {
  if (!user) return ["driver", "yard"];

  if (user.isAdmin) return ["driver", "yard"];

  if (isDriverUser(user)) return ["driver"];

  return ["driver", "yard"];
}

/** Default post-login destination for Shipgen users hitting `/`. */
export function defaultMobileHome(user: MobileUser | null | undefined): string | null {
  if (!user) return null;
  if (user.isAdmin) return null;
  if (isDriverUser(user)) return "/(tabs)/orders";
  return null;
}

export function canAccessYardTab(
  tabName: string,
  can: (permission: string) => boolean,
  isYardAdmin: boolean,
  role?: string | null,
) {
  if (tabName === "profile") return true;
  if (tabName === "search" || tabName === "more") {
    const roleTabs = YARD_ROLE_TABS[role || ""];
    return roleTabs ? roleTabs.includes(tabName as YardTabName) : true;
  }

  const normalizedRole = role || "";
  const roleTabs = YARD_ROLE_TABS[normalizedRole];
  if (roleTabs && !roleTabs.includes(tabName as YardTabName)) {
    return false;
  }

  if (tabName === "ops") {
    return normalizedRole === YARD_ROLE.ADMIN || (isYardAdmin && !normalizedRole);
  }

  if (tabName === "overview") {
    if (roleTabs?.includes("overview")) return hasOverviewModuleAccess(can, isYardAdmin);
    return hasOverviewModuleAccess(can, isYardAdmin);
  }

  if (tabName === "alerts") {
    if (roleTabs?.includes("alerts")) return hasAlertsModuleAccess(can, isYardAdmin);
    return hasAlertsModuleAccess(can, isYardAdmin);
  }

  if (tabName === "appointments") {
    return hasAppointmentsModuleAccess(can);
  }

  if (tabName === "yard-map") {
    return hasYardMapModuleAccess(can);
  }

  if (tabName === "vehicles") {
    return hasVehiclesModuleAccess(can);
  }

  if (isYardAdmin || can("*")) {
    if (roleTabs) return roleTabs.includes(tabName as YardTabName);
    const mod = YARD_TAB_MODULES[tabName as YardTabName];
    return mod ? can(mod) : tabName === "ops";
  }

  const mod = YARD_TAB_MODULES[tabName as YardTabName];
  if (!mod) return false;
  return can(mod);
}

/** Screen routes (including Ops/More hub deep links) — looser than bottom-tab visibility. */
export function canAccessYardScreen(
  screenName: string,
  can: (permission: string) => boolean,
  isYardAdmin: boolean,
  role?: string | null,
) {
  if (screenName === "profile" || screenName === "search" || screenName === "more") return true;

  if (screenName === "ops") {
    return canAccessYardTab("ops", can, isYardAdmin, role) || canAccessYardTab("more", can, isYardAdmin, role);
  }

  if (screenName === "overview") {
    return canAccessYardTab("overview", can, isYardAdmin, role);
  }

  if (screenName === "alerts") {
    return canAccessYardTab("alerts", can, isYardAdmin, role);
  }

  if (screenName === "appointments") {
    return hasAppointmentsModuleAccess(can) || canAccessYardTab("appointments", can, isYardAdmin, role);
  }

  if (screenName === "yard-map") {
    return hasYardMapModuleAccess(can) || canAccessYardTab("yard-map", can, isYardAdmin, role);
  }

  if (screenName === "vehicles") {
    return hasVehiclesModuleAccess(can) || canAccessYardTab("vehicles", can, isYardAdmin, role);
  }

  if (screenName === "queue") {
    return hasQueueModuleAccess(can) || canAccessYardTab("queue", can, isYardAdmin, role);
  }

  if (screenName === "loading-ops") {
    return hasLoadingModuleAccess(can);
  }

  if (screenName === "labor") {
    return hasLaborModuleAccess(can);
  }

  if (screenName === "equipment") {
    return hasEquipmentModuleAccess(can);
  }

  if (role === YARD_ROLE.ADMIN || isYardAdmin) {
    const mod = YARD_TAB_MODULES[screenName as YardTabName];
    return mod ? can(mod) || can("*") : screenName === "ops" || screenName === "detention";
  }

  const mod = YARD_TAB_MODULES[screenName as YardTabName];
  if (mod && (can(mod) || can("*"))) return true;
  if (screenName === "detention" && (can("detention.write") || can("module.detention"))) return true;

  return canAccessYardTab(screenName, can, isYardAdmin, role);
}

export function visibleYardTabs(
  can: (permission: string) => boolean,
  isYardAdmin: boolean,
  role?: string | null,
): YardTabName[] {
  const candidates: YardTabName[] = [
    "overview",
    "alerts",
    "ops",
    "gate",
    "appointments",
    "queue",
    "docks",
    "vehicles",
    "yard-map",
    "search",
    "more",
    "profile",
  ];
  return candidates.filter((tab) => canAccessYardTab(tab, can, isYardAdmin, role));
}

export function defaultYardHome(user: YardAccessUser | null | undefined): `/(yard)/${string}` {
  if (!user) return "/(yard)/profile";

  const role = user.role || "";
  if (YARD_HOME_ROUTE[role]) return YARD_HOME_ROUTE[role];

  const isYardAdmin = role === YARD_ROLE.ADMIN;
  const can = createYardPermissionChecker(user);

  const priority: YardTabName[] = ["overview", "gate", "queue", "docks", "search", "more", "ops"];
  for (const tab of priority) {
    if (canAccessYardTab(tab, can, isYardAdmin, role)) {
      return `/(yard)/${tab}` as `/(yard)/${string}`;
    }
  }

  return "/(yard)/profile";
}
