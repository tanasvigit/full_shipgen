/**
 * Engine visibility in the Shipgen header.
 * Company administrators see every engine; other roles see engines they can access.
 */

import { canAccessParkingEngine, canAccessYardEngine } from "@/lib/consoleAccess";
import { SESSION_SCOPE } from "@/lib/sessionScope";

export const CONSOLE_ENGINES = [
  { id: "console", label: "Dashboard", to: "/", iconKey: "console", always: true },
  {
    id: "fleet-ops",
    label: "FleetOps",
    to: "/fleet-ops/operations/orders",
    iconKey: "fleet-ops",
    prefix: "/fleet-ops",
    fleetopsAny: [
      ["list", "order"],
      ["list", "driver"],
      ["list", "vehicle"],
      ["list", "route"],
    ],
  },
  {
    id: "storefront",
    label: "Storefront",
    to: "/storefront",
    iconKey: "storefront",
    prefix: "/storefront",
    permissionPrefixes: ["storefront", "storefront-*"],
    hiddenFromHeader: true,
  },
  {
    id: "ledger",
    label: "Ledger",
    to: "/ledger",
    iconKey: "ledger",
    prefix: "/ledger",
    permissionPrefixes: ["ledger", "ledger-*"],
    hiddenFromHeader: true,
  },
  {
    id: "pallet",
    label: "Pallet",
    to: "/pallet",
    iconKey: "pallet",
    prefix: "/pallet",
    permissionPrefixes: ["pallet", "pallet-*"],
    hiddenFromHeader: true,
  },
  {
    id: "yard",
    label: "Yard",
    to: "/yard",
    iconKey: "yard",
    prefix: "/yard",
    yardEngine: true,
  },
  {
    id: "parking",
    label: "Parking",
    to: "/parking",
    iconKey: "parking",
    prefix: "/parking",
    parkingEngine: true,
  },
  {
    id: "developers",
    label: "Developers",
    to: "/developers",
    iconKey: "developers",
    prefix: "/developers",
    permissionPrefixes: ["developers", "api-key", "webhook"],
    hiddenFromHeader: true,
    settingsModule: true,
    description: "API keys, webhooks, and integration tooling",
  },
  {
    id: "registry",
    label: "Registry",
    to: "/registry",
    iconKey: "registry",
    prefix: "/registry",
    permissionPrefixes: ["registry", "extension"],
    hiddenFromHeader: true,
    settingsModule: true,
    description: "Browse and manage platform extensions",
  },
  {
    id: "iam",
    label: "IAM",
    to: "/iam",
    iconKey: "iam",
    prefix: "/iam",
    iamAny: ["users.view", "roles.view", "groups.view", "policies.view"],
    hiddenFromHeader: true,
    settingsModule: true,
    description: "Users, roles, policies, and access control",
  },
];

function permissionMatchesPrefix(permissionName, prefixes = []) {
  if (!permissionName) return false;
  const normalized = String(permissionName).toLowerCase();
  return prefixes.some((prefix) => {
    const p = prefix.toLowerCase();
    return normalized === p || normalized.startsWith(`${p} `) || normalized.startsWith(`${p}.`) || normalized.startsWith(`${p}-`);
  });
}

function hasAnyPermissionPrefix(hasPermission, userPermissions, prefixes) {
  if (!prefixes?.length) return false;
  if (prefixes.some((perm) => hasPermission(perm))) return true;
  return (userPermissions || []).some((perm) => {
    const name = typeof perm === "string" ? perm : perm?.name;
    return permissionMatchesPrefix(name, prefixes);
  });
}

/**
 * @param {typeof CONSOLE_ENGINES[number]} engine
 * @param {{ isConsoleAdmin?: boolean, isAdmin?: boolean, sessionScope?: string, hasPermission: (p: string) => boolean, canFleetops: (a: string, r: string) => boolean, canYardModule: (m: string) => boolean, userPermissions?: string[] }} ctx
 */
export function canAccessEngine(engine, ctx) {
  const scope = ctx.sessionScope || "platform";
  const isConsoleAdmin = Boolean(ctx.isConsoleAdmin ?? ctx.isAdmin);

  if (scope === "yard-only") {
    return engine.id === "console";
  }

  if (scope === "parking-only") {
    return engine.id === "console";
  }

  if (engine.always) return true;
  if (isConsoleAdmin) return true;

  if (engine.fleetopsAny?.length) {
    return engine.fleetopsAny.some(([action, resource]) => ctx.canFleetops(action, resource));
  }

  if (engine.iamAny?.length) {
    return engine.iamAny.some((perm) => ctx.hasPermission(perm));
  }

  if (engine.yardEngine) {
    return canAccessYardEngine({ ...ctx, isConsoleAdmin });
  }

  if (engine.parkingEngine) {
    return canAccessParkingEngine({ ...ctx, isConsoleAdmin });
  }

  if (engine.permissionPrefixes?.length) {
    return hasAnyPermissionPrefix(ctx.hasPermission, ctx.userPermissions, engine.permissionPrefixes);
  }

  return false;
}

export function getVisibleEngines(ctx) {
  return CONSOLE_ENGINES.filter((engine) => canAccessEngine(engine, ctx));
}

/** Resolve the dashboard home for the active engine / session scope. */
export function getEngineDashboardRoute(ctx) {
  const scope = ctx.sessionScope || SESSION_SCOPE.PLATFORM;

  if (scope === SESSION_SCOPE.YARD_ONLY) {
    return "/yard";
  }

  if (scope === SESSION_SCOPE.PARKING_ONLY) {
    if (ctx.parkingRole) {
      return `/parking/${ctx.parkingRole}/dashboard`;
    }
    return "/parking";
  }

  const visible = getVisibleEngines(ctx).filter((engine) => engine.id !== "console");

  if (visible.length === 1) {
    const [engine] = visible;
    if (engine.id === "yard") return "/yard";
    if (engine.id === "parking") return "/parking";
    if (engine.id === "fleet-ops") return "/";
  }

  const ids = new Set(visible.map((engine) => engine.id));
  if (ids.has("fleet-ops")) return "/";
  if (ids.has("yard")) return "/yard";
  if (ids.has("parking")) return "/parking";

  return "/";
}

function resolveHeaderEngineLabel(engine, ctx) {
  const scope = ctx.sessionScope || SESSION_SCOPE.PLATFORM;

  if (engine.id === "console") {
    if (scope === SESSION_SCOPE.YARD_ONLY) return "Yard Management System";
    if (scope === SESSION_SCOPE.PARKING_ONLY) return "Parking Management System";
    return engine.label;
  }

  if (engine.id === "yard") return "YMS";
  if (engine.id === "parking") return "PMS";

  return engine.label;
}

/** Engines shown in the top navigation bar (excludes header-hidden modules). */
export function getHeaderEngines(ctx) {
  const dashboardRoute = getEngineDashboardRoute(ctx);
  return getVisibleEngines(ctx)
    .filter((engine) => !engine.hiddenFromHeader)
    .filter((engine) => {
      if (engine.id === "console") return true;
      if (engine.id === "yard" && dashboardRoute.startsWith("/yard")) return false;
      if (engine.id === "parking" && dashboardRoute.startsWith("/parking")) return false;
      return true;
    })
    .map((engine) => {
      const scoped = engine.id === "console" ? { ...engine, to: dashboardRoute } : engine;
      return { ...scoped, label: resolveHeaderEngineLabel(scoped, ctx) };
    });
}

/** Platform modules surfaced under Settings (IAM, Developers, Registry). */
export function getSettingsModuleEngines(ctx) {
  return CONSOLE_ENGINES.filter((engine) => engine.settingsModule && canAccessEngine(engine, ctx));
}

export const SETTINGS_MODULE_ROUTE_TO_ENGINE = {
  "/iam": "iam",
  "/developers": "developers",
  "/registry": "registry",
};

/** Default landing route after login or when blocking an unauthorized engine URL. */
export function getDefaultEngineHome(ctx) {
  const dashboardRoute = getEngineDashboardRoute(ctx);
  if (dashboardRoute !== "/") {
    return dashboardRoute;
  }

  const visible = getVisibleEngines(ctx);
  const ids = new Set(visible.map((engine) => engine.id));

  if (ids.has("iam")) return "/iam";
  if (ids.has("storefront")) return "/storefront";
  if (ids.has("ledger")) return "/ledger";
  if (ids.has("pallet")) return "/pallet";
  if (ids.has("developers")) return "/developers";
  if (ids.has("registry")) return "/registry";

  return dashboardRoute;
}

const ENGINE_ROUTE_GUARDS = [
  { prefix: "/fleet-ops", id: "fleet-ops" },
  { prefix: "/yard", id: "yard" },
  { prefix: "/parking", id: "parking" },
  { prefix: "/iam", id: "iam" },
  { prefix: "/storefront", id: "storefront" },
  { prefix: "/ledger", id: "ledger" },
  { prefix: "/pallet", id: "pallet" },
  { prefix: "/developers", id: "developers" },
  { prefix: "/registry", id: "registry" },
];

export function getEngineGuardForPath(pathname) {
  return ENGINE_ROUTE_GUARDS.find((route) => pathname.startsWith(route.prefix)) || null;
}

export function canAccessPath(pathname, ctx) {
  if (ctx.sessionScope === "yard-only") {
    return pathname.startsWith("/yard");
  }

  if (ctx.sessionScope === "parking-only") {
    return pathname.startsWith("/parking");
  }

  const guard = getEngineGuardForPath(pathname);
  if (!guard) return true;

  const engine = CONSOLE_ENGINES.find((item) => item.id === guard.id);
  return engine ? canAccessEngine(engine, ctx) : true;
}
