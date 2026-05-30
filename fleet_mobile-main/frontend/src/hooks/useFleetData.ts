import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const query = useQuery({
    queryKey: queryKeys.fleet(companyUuid),
    enabled: authReady && isAuthenticated,
    queryFn: async (): Promise<FleetDataState> => {
      const canList = (resource: string) => canFleetops("list", resource);
      const results = await Promise.allSettled([
        fleetService.listOrders(),
        canList("driver") ? fleetService.listDrivers() : Promise.resolve([]),
        canList("vehicle") ? fleetService.listVehicles() : Promise.resolve([]),
        canList("route") ? fleetService.listRoutes() : Promise.resolve([]),
        canList("place") ? fleetService.listPlaces() : Promise.resolve([]),
        canList("issue") ? fleetService.listIssues() : Promise.resolve([]),
        canList("fuel-report") ? fleetService.listFuelLogs() : Promise.resolve([]),
        fleetService.listNotifications(),
      ]);
      const value = <T,>(index: number, fallback: T): T =>
        results[index].status === "fulfilled" ? (results[index] as PromiseFulfilledResult<T>).value : fallback;
      return {
        orders: value(0, []),
        drivers: value(1, []),
        vehicles: value(2, []),
        routes: value(3, []),
        places: value(4, []),
        issues: value(5, []),
        fuelLogs: value(6, []),
        notifications: value(7, []),
      };
    },
  });

  const data = query.data || EMPTY_DATA;
  const loading = query.isLoading || query.isFetching;
  const error = query.error instanceof Error ? query.error.message : null;

  const helpers = useMemo(
    () => ({
      findOrder: (id: string) => data.orders.find((item) => item.id === id),
      findDriver: (id: string) => data.drivers.find((item) => item.id === id),
      findVehicle: (id: string) => data.vehicles.find((item) => item.id === id),
      findRoute: (id: string) => data.routes.find((item) => item.id === id),
    }),
    [data]
  );

  return { ...data, ...helpers, loading, error, refresh: query.refetch };
}
