import { ApiError, apiRequest, unwrapEntity, unwrapList } from "@/src/lib/api";
import {
  mapDriverFromApi,
  mapFuelLogFromApi,
  mapIssueFromApi,
  mapPlaceFromApi,
  mapRouteFromApi,
} from "@/src/lib/fleetMapper";
import { mapBackendOrder } from "@/src/lib/orderMapper";
import { mapVehicleFromApi } from "@/src/lib/vehicleMapper";
import type { Driver, FuelLog, Issue, NotificationItem, Place, Route, Vehicle } from "@/src/data/types";
import type { DriverDTO, FuelLogDTO, IssueDTO, NotificationDTO, PlaceDTO, RouteDTO, VehicleDTO } from "@/src/types/api/fleet";
import type { OrderDTO } from "@/src/types/api/orders";
import { ORDERS_LIST_INCLUDES } from "@/src/services/ordersService";
import { placeCoordinate } from "@/src/lib/placeCoordinates";
import type { OrderCoordinate } from "@/src/data/types";

const FLEET_LIST_LIMIT = 500;
const ROUTES_LIST_INCLUDES = "order,payload.pickup,payload.dropoff,payload.waypoints";
const VEHICLES_LIST_INCLUDES = "driver";
const DRIVERS_LIST_INCLUDES = "vehicle";
const ISSUES_LIST_INCLUDES = "vehicle,driver";
const FUEL_LIST_INCLUDES = "vehicle,driver";

const mapNotification = (dto: NotificationDTO): NotificationItem => ({
  id: String(dto.uuid || dto.id || dto.public_id || ""),
  title: dto.title || "Notification",
  body: dto.body || "",
  time: dto.time || "now",
  type: (dto.type as NotificationItem["type"]) || "system",
  read: Boolean(dto.read),
});

async function fetchCollection<T>(endpoint: string, candidates: string[] = []) {
  const payload = await apiRequest(endpoint);
  return unwrapList<T>(payload, candidates);
}

async function fetchCollectionOptional<T>(endpoint: string, candidates: string[] = []) {
  try {
    return await fetchCollection<T>(endpoint, candidates);
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
}

export const fleetService = {
  listOrders: async () =>
    (
      await fetchCollection<OrderDTO>(
        `/orders?limit=${FLEET_LIST_LIMIT}&with=${encodeURIComponent(ORDERS_LIST_INCLUDES)}`,
        ["orders"]
      )
    ).map(mapBackendOrder),
  listDrivers: async () =>
    (
      await fetchCollection<DriverDTO>(
        `/drivers?limit=${FLEET_LIST_LIMIT}&with=${encodeURIComponent(DRIVERS_LIST_INCLUDES)}`,
        ["drivers"]
      )
    ).map(mapDriverFromApi),
  listVehicles: async () =>
    (
      await fetchCollection<VehicleDTO>(
        `/vehicles?limit=${FLEET_LIST_LIMIT}&with=${encodeURIComponent(VEHICLES_LIST_INCLUDES)}`,
        ["vehicles"]
      )
    ).map(mapVehicleFromApi),
  getVehicle: async (id: string) => {
    const payload = await apiRequest(
      `/vehicles/${encodeURIComponent(id)}?with=${encodeURIComponent(VEHICLES_LIST_INCLUDES)}`
    );
    const dto = unwrapEntity<VehicleDTO>(payload, ["vehicle"]);
    return mapVehicleFromApi(dto);
  },
  createVehicle: async (input: {
    plate: string;
    make?: string;
    model?: string;
    year?: string;
    type?: string;
    vin?: string;
    status?: string;
  }) => {
    const yearNum = Number(input.year);
    const payload = await apiRequest("/vehicles", {
      method: "POST",
      body: {
        vehicle: {
          plate_number: input.plate.trim(),
          make: input.make?.trim() || undefined,
          model: input.model?.trim() || undefined,
          year: Number.isFinite(yearNum) ? yearNum : undefined,
          vehicle_type: input.type?.trim() || undefined,
          status: input.status || "operational",
          vin: input.vin?.trim() || undefined,
        },
      },
    });
    const dto = unwrapEntity<VehicleDTO>(payload, ["vehicle"]);
    return mapVehicleFromApi(dto);
  },
  listRoutes: async () =>
    (
      await fetchCollectionOptional<RouteDTO>(
        `/routes?limit=${FLEET_LIST_LIMIT}&with=${encodeURIComponent(ROUTES_LIST_INCLUDES)}`,
        ["routes"]
      )
    ).map(mapRouteFromApi),
  getRoute: async (id: string) => {
    const payload = await apiRequest(
      `/routes/${encodeURIComponent(id)}?with=${encodeURIComponent(ROUTES_LIST_INCLUDES)}`
    );
    const dto = unwrapEntity<RouteDTO>(payload, ["route"]);
    return mapRouteFromApi(dto);
  },
  listPlaces: async () =>
    (
      await fetchCollectionOptional<PlaceDTO>(`/places?limit=${FLEET_LIST_LIMIT}`, ["places"])
    ).map(mapPlaceFromApi),
  getPlace: async (id: string) => {
    const payload = await apiRequest(`/places/${encodeURIComponent(id)}`);
    const dto = unwrapEntity<PlaceDTO>(payload, ["place"]);
    return mapPlaceFromApi(dto);
  },
  searchPlaces: async (query: string, limit = 30) => {
    const params = new URLSearchParams({
      query: query.trim(),
      limit: String(limit),
    });
    const payload = await apiRequest(`/places/search?${params.toString()}`);
    return unwrapList<PlaceDTO>(payload, ["places"]).map(mapPlaceFromApi);
  },
  lookupPlaceCoordinate: async (query: string): Promise<OrderCoordinate | null> => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    const params = new URLSearchParams({ query: trimmed });
    const payload = await apiRequest(`/places/lookup?${params.toString()}`);
    const rows = Array.isArray(payload) ? payload : unwrapList<PlaceDTO>(payload, ["places", "results"]);
    const first = rows[0];
    return placeCoordinate(first);
  },
  listIssues: async () =>
    (
      await fetchCollectionOptional<IssueDTO>(
        `/issues?limit=${FLEET_LIST_LIMIT}&with=${encodeURIComponent(ISSUES_LIST_INCLUDES)}`,
        ["issues"]
      )
    ).map(mapIssueFromApi),
  listFuelLogs: async () =>
    (
      await fetchCollectionOptional<FuelLogDTO>(
        `/fuel-reports?limit=${FLEET_LIST_LIMIT}&with=${encodeURIComponent(FUEL_LIST_INCLUDES)}`,
        ["fuel_reports", "fuelReports"]
      )
    ).map(mapFuelLogFromApi),
  listNotifications: async () =>
    (await fetchCollection<NotificationDTO>("/notifications", ["notifications"])).map(mapNotification),
};
