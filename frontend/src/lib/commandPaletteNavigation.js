import { IAM_HEADER_SHORTCUTS } from "@/lib/iam/headerShortcuts";
import { canAccessSidebarItem } from "@/lib/sidebarAccess";

/** FleetOps + console routes surfaced in the command palette (order preserved). */
export const FLEETOPS_COMMAND_ITEMS = [
  { to: "/", label: "Dashboard", iconKey: "dashboard", sectionKey: "/" },
  { to: "/fleet-ops/operations/orders", label: "Orders", iconKey: "package", sectionKey: "/fleet-ops" },
  {
    to: "/fleet-ops/operations/orchestrator",
    label: "Orchestrator",
    iconKey: "workflow",
    testId: "command-orchestrator",
    sectionKey: "/fleet-ops",
  },
  {
    to: "/fleet-ops/operations/service-rates",
    label: "Service rates",
    iconKey: "dollar",
    testId: "command-service-rates",
    sectionKey: "/fleet-ops",
  },
  { to: "/fleet-ops/management/drivers", label: "Drivers", iconKey: "users", sectionKey: "/fleet-ops" },
  { to: "/fleet-ops/management/vehicles", label: "Vehicles", iconKey: "car", sectionKey: "/fleet-ops" },
  { to: "/fleet-ops/management/places", label: "Places", iconKey: "map", sectionKey: "/fleet-ops" },
  { to: "/fleet-ops/management/fleets", label: "Fleets", iconKey: "building", sectionKey: "/fleet-ops" },
  {
    to: "/fleet-ops/admin/warranties",
    label: "Warranties",
    iconKey: "package",
    testId: "command-warranties",
    sectionKey: "/fleet-ops",
  },
  {
    to: "/fleet-ops/admin/manifests",
    label: "Manifests",
    iconKey: "package",
    testId: "command-manifests",
    sectionKey: "/fleet-ops",
  },
  {
    to: "/fleet-ops/admin/payloads",
    label: "Payloads admin",
    iconKey: "package",
    testId: "command-payloads",
    sectionKey: "/fleet-ops",
  },
  {
    to: "/fleet-ops/admin/tracking-numbers",
    label: "Tracking numbers",
    iconKey: "package",
    testId: "command-tracking-numbers",
    sectionKey: "/fleet-ops",
  },
  {
    to: "/fleet-ops/settings",
    label: "FleetOps settings",
    iconKey: "settings",
    testId: "command-fleetops-settings",
    sectionKey: "/fleet-ops",
  },
  { to: "/notifications", label: "Notifications", iconKey: "bell", sectionKey: "/" },
  { to: "/settings", label: "Settings", iconKey: "settings", sectionKey: "/" },
];

function toPaletteCtx(ctx) {
  return {
    isAdmin: ctx.isConsoleAdmin ?? ctx.isAdmin,
    hasPermission: ctx.hasPermission,
    canFleetops: ctx.canFleetops,
    canYardModule: ctx.canYardModule,
    canParkingModule: ctx.canParkingModule,
    parkingRole: ctx.parkingRole,
    sessionScope: ctx.sessionScope,
    userPermissions: ctx.userPermissions,
  };
}

function canShowPaletteItem(item, ctx) {
  return canAccessSidebarItem({ to: item.to }, item.sectionKey, toPaletteCtx(ctx));
}

/** Navigation links visible in the command palette for the current user. */
export function getCommandPaletteNavigation(ctx) {
  const fleetopsAndConsole = FLEETOPS_COMMAND_ITEMS.filter((item) => canShowPaletteItem(item, ctx));

  const iam = IAM_HEADER_SHORTCUTS.filter((item) => canShowPaletteItem({ to: item.to, sectionKey: "/iam" }, ctx)).map(
    (item) => ({
      to: item.to,
      label: item.label,
      icon: item.icon,
      testId: item.testId?.replace("iam-shortcut", "command-iam"),
      sectionKey: "/iam",
    }),
  );

  const settingsIndex = fleetopsAndConsole.findIndex((item) => item.to === "/fleet-ops/settings");
  if (settingsIndex === -1) {
    return [...fleetopsAndConsole, ...iam];
  }

  return [
    ...fleetopsAndConsole.slice(0, settingsIndex + 1),
    ...iam,
    ...fleetopsAndConsole.slice(settingsIndex + 1),
  ];
}

/** Whether live search groups (orders, drivers, vehicles) should load for this user. */
export function getCommandPaletteSearchAccess(ctx) {
  const paletteCtx = toPaletteCtx(ctx);
  if (paletteCtx.isAdmin) {
    return { orders: true, drivers: true, vehicles: true };
  }
  return {
    orders: paletteCtx.canFleetops("list", "order"),
    drivers: paletteCtx.canFleetops("list", "driver"),
    vehicles: paletteCtx.canFleetops("list", "vehicle"),
  };
}
