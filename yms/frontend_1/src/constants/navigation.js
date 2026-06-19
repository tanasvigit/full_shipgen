import {
  LayoutDashboard,
  CalendarClock,
  ShieldCheck,
  ListOrdered,
  Map,
  Warehouse,
  Truck,
  PackageCheck,
  Receipt,
  Wrench,
  HardHat,
  Sparkles,
  BarChart3,
  Activity,
  AlertTriangle,
  Users,
  Shield,
  Settings,
} from "lucide-react";
import { MOD } from "./permissions";
import { yardPath, yardRelativePath } from "./basePath";

/** Navigation menu — items hidden when user lacks module permission. */
export const NAV_MENU = [
  {
    section: "Control",
    icon: Activity,
    blurb: "Live operations & priorities",
    items: [
      { to: yardPath("/"), label: "Control Tower", icon: LayoutDashboard, desc: "Real-time dashboard", testId: "nav-dashboard", module: MOD.CONTROL_TOWER, end: true },
      { to: yardPath("/queue"), label: "Virtual Queue", icon: ListOrdered, desc: "Priority engine", testId: "nav-queue", module: MOD.QUEUE },
      { to: yardPath("/yard"), label: "Yard Map", icon: Map, desc: "Top-down view", testId: "nav-yard", module: MOD.YARD_MAP },
      { to: yardPath("/ai"), label: "Recommendations", icon: Sparkles, desc: "Live operational insights", testId: "nav-ai", module: MOD.AI },
    ],
  },
  {
    section: "Operations",
    icon: PackageCheck,
    blurb: "Day-to-day execution",
    items: [
      { to: yardPath("/appointments"), label: "Appointments", icon: CalendarClock, desc: "Slot orchestration", testId: "nav-appointments", module: MOD.APPOINTMENTS },
      { to: yardPath("/gate"), label: "Gate Management", icon: ShieldCheck, desc: "Check-in & validation", testId: "nav-gate", module: MOD.GATE },
      { to: yardPath("/docks"), label: "Docks", icon: Warehouse, desc: "Bays & utilization", testId: "nav-docks", module: MOD.DOCKS },
      { to: yardPath("/loading"), label: "Loading Ops", icon: PackageCheck, desc: "Live load/unload", testId: "nav-loading", module: MOD.LOADING },
    ],
  },
  {
    section: "Resources",
    icon: Truck,
    blurb: "Fleet · Equipment · People",
    items: [
      { to: yardPath("/vehicles"), label: "Vehicles", icon: Truck, desc: "Operations monitor", testId: "nav-vehicles", module: MOD.VEHICLES },
      { to: yardPath("/equipment"), label: "Equipment", icon: Wrench, desc: "Forklifts · cranes", testId: "nav-equipment", module: MOD.EQUIPMENT },
      { to: yardPath("/labor"), label: "Labor", icon: HardHat, desc: "Teams & shifts", testId: "nav-labor", module: MOD.LABOR },
    ],
  },
  {
    section: "Reports",
    icon: BarChart3,
    blurb: "Finance & analytics",
    items: [
      { to: yardPath("/operations-dashboard"), label: "Operations Dashboard", icon: LayoutDashboard, desc: "Shift-level ops KPIs", testId: "nav-operations-dashboard", module: MOD.OPS_DASHBOARD },
      { to: yardPath("/reports/delay-analysis"), label: "Delay Analysis", icon: AlertTriangle, desc: "Delay categories", testId: "nav-delay-analysis", module: MOD.DELAY_ANALYSIS },
      { to: yardPath("/detention"), label: "Detention Management", icon: Receipt, desc: "Cost & disputes", testId: "nav-detention", module: MOD.DETENTION },
      { to: yardPath("/kpis"), label: "Executive KPIs", icon: BarChart3, desc: "Scorecard & trends", testId: "nav-kpis", module: MOD.KPIS },
    ],
  },
  {
    section: "Administration",
    icon: Settings,
    blurb: "System configuration",
    items: [
      { to: yardPath("/admin/users"), label: "User Management", icon: Users, desc: "Manage accounts", testId: "nav-users", module: MOD.USER_MGMT },
      { to: yardPath("/admin/roles"), label: "Role Management", icon: Shield, desc: "Roles & permissions", testId: "nav-roles", module: MOD.ROLE_MGMT },
      { to: yardPath("/settings"), label: "System Settings", icon: Settings, desc: "Configuration", testId: "nav-settings", module: MOD.SETTINGS },
    ],
  },
];

/** Route path → required module permission for ProtectedRoute. */
export const ROUTE_MODULES = {
  "/": MOD.CONTROL_TOWER,
  "/appointments": MOD.APPOINTMENTS,
  "/gate": MOD.GATE,
  "/queue": MOD.QUEUE,
  "/yard": MOD.YARD_MAP,
  "/docks": MOD.DOCKS,
  "/vehicles": MOD.VEHICLES,
  "/loading": MOD.LOADING,
  "/detention": MOD.DETENTION,
  "/equipment": MOD.EQUIPMENT,
  "/labor": MOD.LABOR,
  "/ai": MOD.AI,
  "/kpis": MOD.KPIS,
  "/operations-dashboard": MOD.OPS_DASHBOARD,
  "/reports/delay-analysis": MOD.DELAY_ANALYSIS,
  "/admin/users": MOD.USER_MGMT,
  "/admin/roles": MOD.ROLE_MGMT,
  "/settings": MOD.SETTINGS,
};

export function resolveRouteModule(pathname) {
  const relative = yardRelativePath(pathname);
  if (ROUTE_MODULES[relative]) return ROUTE_MODULES[relative];
  const match = Object.keys(ROUTE_MODULES)
    .filter((p) => p !== "/")
    .sort((a, b) => b.length - a.length)
    .find((p) => relative.startsWith(p));
  return match ? ROUTE_MODULES[match] : null;
}

export function firstAccessiblePath(can) {
  for (const section of NAV_MENU) {
    for (const item of section.items) {
      if (can(item.module)) return item.to;
    }
  }
  return "/unauthorized";
}

export function filterNavMenu(menu, can) {
  return menu
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => can(item.module)),
    }))
    .filter((section) => section.items.length > 0);
}
