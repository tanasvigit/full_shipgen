import type { YardTabName } from "@/src/lib/moduleAccess";
import {
  YARD_ROLE,
  hasAppointmentsModuleAccess,
  hasEquipmentModuleAccess,
  hasLaborModuleAccess,
  hasLoadingModuleAccess,
  hasQueueModuleAccess,
  hasVehiclesModuleAccess,
  hasYardMapModuleAccess,
} from "@/src/lib/moduleAccess";

export type YardDeepLink =
  | YardTabName
  | "search"
  | "alerts"
  | "detention"
  | "vehicles"
  | "yard-map"
  | "loading-ops"
  | "labor"
  | "equipment";

export type YardModuleLink = {
  key: string;
  title: string;
  description: string;
  icon: string;
  href: `/(yard)/${YardDeepLink}`;
  section: "Operations" | "Control" | "Account";
  modulePermission?: string | null;
  roles?: string[];
};

export const YARD_MODULE_LINKS: YardModuleLink[] = [
  {
    key: "overview",
    title: "Overview",
    description: "Live KPIs, alerts snapshot, and yard activity",
    icon: "pulse-outline",
    href: "/(yard)/overview",
    section: "Control",
    modulePermission: "module.control_tower",
    roles: [YARD_ROLE.ADMIN, YARD_ROLE.MANAGER],
  },
  {
    key: "alerts",
    title: "Alerts inbox",
    description: "Critical and warning operational alerts",
    icon: "notifications-outline",
    href: "/(yard)/alerts",
    section: "Control",
    modulePermission: "module.control_tower",
    roles: [YARD_ROLE.ADMIN, YARD_ROLE.MANAGER],
  },
  {
    key: "search",
    title: "Global search",
    description: "Find vehicles, appointments, docks, and queue entries",
    icon: "search-outline",
    href: "/(yard)/search",
    section: "Control",
    modulePermission: null,
  },
  {
    key: "gate",
    title: "Gate",
    description: "Entry, exit, and check-in activity",
    icon: "shield-checkmark-outline",
    href: "/(yard)/gate",
    section: "Operations",
    modulePermission: "module.gate",
    roles: [YARD_ROLE.GATE_OPERATOR, YARD_ROLE.ADMIN],
  },
  {
    key: "appointments",
    title: "Appointments today",
    description: "Schedule, book, and gate lookup",
    icon: "calendar-outline",
    href: "/(yard)/appointments",
    section: "Operations",
    modulePermission: "module.appointments",
    roles: [YARD_ROLE.GATE_OPERATOR, YARD_ROLE.MANAGER, YARD_ROLE.ADMIN],
  },
  {
    key: "queue",
    title: "Virtual queue",
    description: "Call vehicles in and assign docks",
    icon: "list-outline",
    href: "/(yard)/queue",
    section: "Operations",
    modulePermission: "module.queue",
    roles: [YARD_ROLE.COORDINATOR, YARD_ROLE.DOCK_SUPERVISOR, YARD_ROLE.MANAGER, YARD_ROLE.ADMIN],
  },
  {
    key: "loading-ops",
    title: "Loading ops",
    description: "Active load/unload sessions and exceptions",
    icon: "cube-outline",
    href: "/(yard)/loading-ops",
    section: "Operations",
    modulePermission: "module.loading",
    roles: [YARD_ROLE.DOCK_SUPERVISOR, YARD_ROLE.MANAGER, YARD_ROLE.ADMIN],
  },
  {
    key: "vehicles",
    title: "Vehicle monitor",
    description: "Track vehicles by status, zone, and dock",
    icon: "bus-outline",
    href: "/(yard)/vehicles",
    section: "Operations",
    modulePermission: "module.vehicles",
    roles: [YARD_ROLE.COORDINATOR, YARD_ROLE.MANAGER, YARD_ROLE.DOCK_SUPERVISOR, YARD_ROLE.ADMIN],
  },
  {
    key: "yard-map",
    title: "Yard map",
    description: "Zone occupancy and yard utilization",
    icon: "map-outline",
    href: "/(yard)/yard-map",
    section: "Control",
    modulePermission: "module.yard_map",
    roles: [YARD_ROLE.COORDINATOR, YARD_ROLE.MANAGER, YARD_ROLE.DOCK_SUPERVISOR, YARD_ROLE.ADMIN],
  },
  {
    key: "docks",
    title: "Dock board",
    description: "Loading operations and dock status",
    icon: "git-branch-outline",
    href: "/(yard)/docks",
    section: "Operations",
    modulePermission: "module.docks",
    roles: [YARD_ROLE.DOCK_SUPERVISOR, YARD_ROLE.ADMIN],
  },
  {
    key: "labor",
    title: "Labor",
    description: "Teams, shifts, and dock assignments",
    icon: "people-outline",
    href: "/(yard)/labor",
    section: "Operations",
    modulePermission: "module.labor",
    roles: [YARD_ROLE.COORDINATOR, YARD_ROLE.DOCK_SUPERVISOR, YARD_ROLE.MANAGER, YARD_ROLE.ADMIN],
  },
  {
    key: "equipment",
    title: "Equipment",
    description: "Forklifts, cranes, and dock equipment",
    icon: "construct-outline",
    href: "/(yard)/equipment",
    section: "Operations",
    modulePermission: "module.equipment",
    roles: [YARD_ROLE.COORDINATOR, YARD_ROLE.DOCK_SUPERVISOR, YARD_ROLE.MANAGER, YARD_ROLE.ADMIN],
  },
  {
    key: "detention",
    title: "Detention",
    description: "Review charges and update dispute status",
    icon: "timer-outline",
    href: "/(yard)/detention",
    section: "Control",
    modulePermission: "module.detention",
    roles: [YARD_ROLE.MANAGER, YARD_ROLE.ADMIN],
  },
  {
    key: "profile",
    title: "Profile & sign out",
    description: "Account details and permissions",
    icon: "person-outline",
    href: "/(yard)/profile",
    section: "Account",
    modulePermission: null,
  },
];

export function visibleYardModuleLinks(
  can: (permission: string) => boolean,
  isYardAdmin: boolean,
  role?: string | null,
  options?: { excludeKeys?: string[] },
) {
  const exclude = new Set(options?.excludeKeys ?? []);
  const normalizedRole = role || "";

  return YARD_MODULE_LINKS.filter((link) => {
    if (exclude.has(link.key)) return false;
    if (link.key === "profile") return true;
    if (isYardAdmin || can("*")) {
      if (link.modulePermission) return can(link.modulePermission);
      return true;
    }
    if (link.modulePermission && can(link.modulePermission)) return true;
    if (link.key === "appointments" && hasAppointmentsModuleAccess(can)) return true;
    if (link.key === "yard-map" && hasYardMapModuleAccess(can)) return true;
    if (link.key === "vehicles" && hasVehiclesModuleAccess(can)) return true;
    if (link.key === "queue" && hasQueueModuleAccess(can)) return true;
    if (link.key === "loading-ops" && hasLoadingModuleAccess(can)) return true;
    if (link.key === "labor" && hasLaborModuleAccess(can)) return true;
    if (link.key === "equipment" && hasEquipmentModuleAccess(can)) return true;
    if (link.roles?.includes(normalizedRole)) return true;
    return link.modulePermission === null;
  });
}

export function groupYardModuleLinks(links: YardModuleLink[]) {
  const sections: Record<string, YardModuleLink[]> = {};
  for (const link of links) {
    sections[link.section] = sections[link.section] ?? [];
    sections[link.section].push(link);
  }
  return sections;
}
