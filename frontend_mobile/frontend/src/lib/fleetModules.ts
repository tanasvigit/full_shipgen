import type { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import {
  canListFleetDrivers,
  canListFleetFuel,
  canListFleetIssues,
  canListFleetPlaces,
  canListFleetRoutes,
} from "@/src/lib/fleetAccess";

export type FleetModuleId = "vehicles" | "drivers" | "routes" | "places" | "issues" | "fuel";

export type FleetWorkspaceTab = "overview" | FleetModuleId;

type CanFleetops = (action: string, resource: string) => boolean;

export type FleetTabDef = {
  id: FleetWorkspaceTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  visible: (canFleetops: CanFleetops) => boolean;
};

const MODULE_VISIBILITY: Record<FleetModuleId, (canFleetops: CanFleetops) => boolean> = {
  vehicles: () => true,
  drivers: canListFleetDrivers,
  routes: canListFleetRoutes,
  places: canListFleetPlaces,
  issues: canListFleetIssues,
  fuel: canListFleetFuel,
};

export const FLEET_WORKSPACE_TABS: FleetTabDef[] = [
  { id: "overview", label: "Overview", icon: "grid-outline", visible: () => true },
  { id: "vehicles", label: "Vehicles", icon: "car-sport-outline", visible: MODULE_VISIBILITY.vehicles },
  { id: "drivers", label: "Drivers", icon: "people-outline", visible: MODULE_VISIBILITY.drivers },
  { id: "routes", label: "Routes", icon: "map-outline", visible: MODULE_VISIBILITY.routes },
  { id: "places", label: "Places", icon: "location-outline", visible: MODULE_VISIBILITY.places },
  { id: "issues", label: "Issues", icon: "alert-circle-outline", visible: MODULE_VISIBILITY.issues },
  { id: "fuel", label: "Fuel", icon: "flame-outline", visible: MODULE_VISIBILITY.fuel },
];

/** @deprecated Use FLEET_WORKSPACE_TABS — kept for stats hook typing */
export type FleetModuleDef = {
  id: FleetModuleId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  visible: (canFleetops: CanFleetops) => boolean;
};

export const FLEET_MODULES: FleetModuleDef[] = FLEET_WORKSPACE_TABS.filter(
  (tab): tab is FleetTabDef & { id: FleetModuleId } => tab.id !== "overview",
).map((tab) => ({
  id: tab.id,
  label: tab.label,
  icon: tab.icon,
  route: fleetTabHref(tab.id),
  visible: tab.visible,
}));

export function visibleFleetWorkspaceTabs(canFleetops: CanFleetops) {
  return FLEET_WORKSPACE_TABS.filter((tab) => tab.visible(canFleetops));
}

export function visibleFleetModules(canFleetops: CanFleetops) {
  return FLEET_MODULES.filter((module) => module.visible(canFleetops));
}

const TAB_IDS = new Set<string>(FLEET_WORKSPACE_TABS.map((tab) => tab.id));

export function parseFleetWorkspaceTab(value: unknown): FleetWorkspaceTab {
  const raw = String(value || "").trim().toLowerCase();
  if (TAB_IDS.has(raw)) return raw as FleetWorkspaceTab;
  return "overview";
}

export function fleetTabHref(tab: FleetWorkspaceTab = "overview"): Href {
  if (tab === "overview") return "/(tabs)/fleet";
  return { pathname: "/(tabs)/fleet", params: { tab } };
}
