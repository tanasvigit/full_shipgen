import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type {
  Driver,
  FuelLog,
  Issue,
  NotificationItem,
  Order,
  Place,
  Route,
  Vehicle,
} from "@/src/data/types";
import { fleetService } from "@/src/services/fleetService";
import { queryKeys } from "@/src/query/keys";
import { useAuth } from "@/src/contexts/AuthContext";
import { idsMatch } from "@/src/lib/vehicleMapper";

type FleetDataState = {
  orders: Order[];
  drivers: Driver[];
  vehicles: Vehicle[];
  routes: Route[];
  places: Place[];
  issues: Issue[];
  fuelLogs: FuelLog[];
  notifications: NotificationItem[];
};

const EMPTY_DATA: FleetDataState = {
  orders: [],
  drivers: [],
  vehicles: [],
  routes: [],
  places: [],
  issues: [],
  fuelLogs: [],
  notifications: [],
};

export function useFleetData() {
  const { authReady, isAuthenticated, activeOrganization, canFleetops } = useAuth();
  const companyUuid = activeOrganization?.uuid || null;
  const enabled = authReady && isAuthenticated;
  const canList = (resource: string) => canFleetops("list", resource);

  const results = useQueries({
    queries: [
      {
        queryKey: [...queryKeys.fleet(companyUuid), "orders"] as const,
        enabled,
        queryFn: () => fleetService.listOrders(),
      },
      {
        queryKey: [...queryKeys.fleet(companyUuid), "drivers"] as const,
        enabled: enabled && canList("driver"),
        queryFn: () => fleetService.listDrivers(),
      },
      {
        queryKey: [...queryKeys.fleet(companyUuid), "vehicles"] as const,
        enabled: enabled && canList("vehicle"),
        queryFn: () => fleetService.listVehicles(),
      },
      {
        queryKey: [...queryKeys.fleet(companyUuid), "routes"] as const,
        enabled: enabled && canList("route"),
        queryFn: () => fleetService.listRoutes(),
      },
      {
        queryKey: [...queryKeys.fleet(companyUuid), "places"] as const,
        enabled: enabled && canList("place"),
        queryFn: () => fleetService.listPlaces(),
      },
      {
        queryKey: [...queryKeys.fleet(companyUuid), "issues"] as const,
        enabled: enabled && canList("issue"),
        queryFn: () => fleetService.listIssues(),
      },
      {
        queryKey: [...queryKeys.fleet(companyUuid), "fuel"] as const,
        enabled: enabled && (canList("fuel-report") || canList("fuel_report")),
        queryFn: () => fleetService.listFuelLogs(),
      },
      {
        queryKey: [...queryKeys.fleet(companyUuid), "notifications"] as const,
        enabled,
        queryFn: () => fleetService.listNotifications(),
      },
    ],
  });

  const [ordersQ, driversQ, vehiclesQ, routesQ, placesQ, issuesQ, fuelQ, notificationsQ] = results;

  const data: FleetDataState = {
    orders: ordersQ.data ?? [],
    drivers: driversQ.data ?? [],
    vehicles: vehiclesQ.data ?? [],
    routes: routesQ.data ?? [],
    places: placesQ.data ?? [],
    issues: issuesQ.data ?? [],
    fuelLogs: fuelQ.data ?? [],
    notifications: notificationsQ.data ?? [],
  };

  const loading = results.some((query) => query.isLoading);
  const error =
    results.find((query) => query.error instanceof Error)?.error instanceof Error
      ? (results.find((query) => query.error instanceof Error)?.error as Error).message
      : null;

  const refresh = async () => {
    await Promise.all(results.map((query) => query.refetch()));
  };

  const helpers = useMemo(
    () => ({
      findOrder: (id: string) => data.orders.find((item) => idsMatch(item.id, id)),
      findDriver: (id: string) => {
        if (!id) return undefined;
        return data.drivers.find((item) => idsMatch(item.id, id));
      },
      findVehicle: (id: string) => {
        if (!id) return undefined;
        return data.vehicles.find(
          (item) => idsMatch(item.id, id) || idsMatch(item.publicId, id) || item.plate === id
        );
      },
      findRoute: (id: string) => {
        if (!id) return undefined;
        return data.routes.find((item) => idsMatch(item.id, id));
      },
    }),
    [data]
  );

  return {
    ...data,
    ...helpers,
    loading,
    error,
    refresh,
    sectionLoading: {
      drivers: driversQ.isLoading || driversQ.isFetching,
      routes: routesQ.isLoading || routesQ.isFetching,
      places: placesQ.isLoading || placesQ.isFetching,
      issues: issuesQ.isLoading || issuesQ.isFetching,
      fuel: fuelQ.isLoading || fuelQ.isFetching,
    },
    sectionError: {
      drivers: driversQ.error instanceof Error ? driversQ.error.message : null,
      routes: routesQ.error instanceof Error ? routesQ.error.message : null,
      places: placesQ.error instanceof Error ? placesQ.error.message : null,
      issues: issuesQ.error instanceof Error ? issuesQ.error.message : null,
      fuel: fuelQ.error instanceof Error ? fuelQ.error.message : null,
    },
  };
}
