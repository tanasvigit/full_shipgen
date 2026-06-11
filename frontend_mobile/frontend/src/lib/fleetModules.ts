import type { Ionicons } from "@expo/vector-icons";
import {
  canListFleetDrivers,
  canListFleetFuel,
  canListFleetIssues,
  canListFleetPlaces,
  canListFleetRoutes,
} from "@/src/lib/fleetAccess";

export type FleetModuleId = "vehicles" | "drivers" | "routes" | "places" | "issues" | "fuel";

type CanFleetops = (action: string, resource: string) => boolean;

export type FleetModuleDef = {
  id: FleetModuleId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  visible: (canFleetops: CanFleetops) => boolean;
};

export const FLEET_MODULES: FleetModuleDef[] = [
  {
    id: "vehicles",
    label: "Vehicles",
    icon: "car-sport-outline",
    route: "/(tabs)/fleet",
    visible: () => true,
  },
  {
    id: "drivers",
    label: "Drivers",
    icon: "people-outline",
    route: "/drivers",
    visible: canListFleetDrivers,
  },
  {
    id: "routes",
    label: "Routes",
    icon: "map-outline",
    route: "/routes",
    visible: canListFleetRoutes,
  },
  {
    id: "places",
    label: "Places",
    icon: "location-outline",
    route: "/places",
    visible: canListFleetPlaces,
  },
  {
    id: "issues",
    label: "Issues",
    icon: "alert-circle-outline",
    route: "/issues",
    visible: canListFleetIssues,
  },
  {
    id: "fuel",
    label: "Fuel",
    icon: "flame-outline",
    route: "/fuel",
    visible: canListFleetFuel,
  },
];

export function visibleFleetModules(canFleetops: CanFleetops) {
  return FLEET_MODULES.filter((module) => module.visible(canFleetops));
}
