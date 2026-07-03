import { useMemo } from "react";
import type { Driver, FuelLog, Issue, Place, Route, Vehicle } from "@/src/data/types";
import type { FleetModuleId } from "@/src/lib/fleetModules";

export type FleetModuleStat = {
  count: number;
  hint: string;
  badge?: number;
  badgeTone?: "error" | "warning" | "info";
};

export function useFleetModuleStats({
  vehicles,
  drivers,
  routes,
  places,
  issues,
  fuelLogs,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: Route[];
  places: Place[];
  issues: Issue[];
  fuelLogs: FuelLog[];
}) {
  return useMemo(() => {
    const lowFuel = vehicles.filter((v) => v.fuel < 20).length;
    const onlineDrivers = drivers.filter((d) => d.status === "online").length;
    const activeRoutes = routes.filter((r) => r.status === "active").length;
    const openIssues = issues.filter((i) => i.status === "open" || i.status === "in_progress").length;
    const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);

    const stats: Record<FleetModuleId, FleetModuleStat> = {
      vehicles: {
        count: vehicles.length,
        hint: lowFuel > 0 ? `${lowFuel} low fuel` : "in fleet",
        badge: lowFuel > 0 ? lowFuel : undefined,
        badgeTone: "warning",
      },
      drivers: {
        count: drivers.length,
        hint: onlineDrivers > 0 ? `${onlineDrivers} online` : "total",
      },
      routes: {
        count: routes.length,
        hint: activeRoutes > 0 ? `${activeRoutes} active` : "planned",
      },
      places: {
        count: places.length,
        hint: "locations",
      },
      issues: {
        count: issues.length,
        hint: openIssues > 0 ? `${openIssues} open` : "all clear",
        badge: openIssues > 0 ? openIssues : undefined,
        badgeTone: "error",
      },
      fuel: {
        count: fuelLogs.length,
        hint: fuelCost > 0 ? `₹${fuelCost.toFixed(0)} logged` : "reports",
      },
    };

    const summaryParts = [
      `${vehicles.length} vehicles`,
      drivers.length > 0 ? `${drivers.length} drivers` : null,
      openIssues > 0 ? `${openIssues} open issues` : null,
    ].filter(Boolean);

    return {
      byModule: stats,
      summary: summaryParts.join(" · "),
      kpis: {
        vehicles: vehicles.length,
        driversOnline: onlineDrivers,
        openIssues,
        activeRoutes,
      },
    };
  }, [vehicles, drivers, routes, places, issues, fuelLogs]);
}
