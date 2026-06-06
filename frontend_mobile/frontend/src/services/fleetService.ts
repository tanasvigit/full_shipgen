import { ApiError, apiRequest, unwrapList } from "@/src/lib/api";
import { mapBackendOrder } from "@/src/lib/orderMapper";
import type { Driver, FuelLog, Issue, NotificationItem, Place, Route, Vehicle } from "@/src/data/types";
import type { DriverDTO, FuelLogDTO, IssueDTO, NotificationDTO, PlaceDTO, RouteDTO, VehicleDTO } from "@/src/types/api/fleet";
import type { OrderDTO } from "@/src/types/api/orders";

function toId(value: unknown): string {
  return String(value || "");
}

const mapDriver = (dto: DriverDTO): Driver => ({
  id: String(dto.uuid || dto.id || dto.public_id || ""),
  name: dto.name || "Driver",
  phone: dto.phone || "",
  email: dto.email || "",
  rating: Number(dto.rating || 0),
  status: (dto.status as Driver["status"]) || "offline",
  avatar: dto.avatar || dto.photo_url || "",
  vehicleId: toId(dto.vehicleId || dto.vehicle_id),
  licenseNo: dto.licenseNo || dto.license_no || "—",
  trips: Number(dto.trips || 0),
  earnings: Number(dto.earnings || 0),
  joinedAt: dto.joinedAt || dto.joined_at || "—",
  currentLocation: dto.currentLocation || dto.current_location || "—",
});

const mapVehicle = (dto: VehicleDTO): Vehicle => ({
  id: String(dto.uuid || dto.id || dto.public_id || ""),
  plate: dto.plate || dto.plate_number || dto.public_id || "—",
  model: dto.model || "Vehicle",
  type: (dto.type as Vehicle["type"]) || "Car",
  status: (dto.status as Vehicle["status"]) || "offline",
  fuel: Number(dto.fuel || 0),
  mileage: Number(dto.mileage || 0),
  driverId: toId(dto.driverId || dto.driver_id),
  lastService: dto.lastService || dto.last_service || "—",
  nextService: dto.nextService || dto.next_service || "—",
  image: dto.image || dto.photo_url || "",
});

const mapRoute = (dto: RouteDTO): Route => ({
  id: String(dto.uuid || dto.id || dto.public_id || ""),
  name: dto.name || "Route",
  stops: Number(dto.stops || 0),
  distance: dto.distance || "—",
  duration: dto.duration || "—",
  status: (dto.status as Route["status"]) || "scheduled",
  driverId: toId(dto.driverId),
  vehicleId: toId(dto.vehicleId),
  waypoints: (dto.waypoints || []).map((waypoint) => ({
    name: waypoint.name || "Waypoint",
    address: waypoint.address || "—",
    eta: waypoint.eta || "—",
    done: Boolean(waypoint.done),
  })),
});

const mapPlace = (dto: PlaceDTO): Place => ({
  id: String(dto.uuid || dto.id || dto.public_id || ""),
  name: dto.name || "Place",
  address: dto.address || "—",
  type: (dto.type as Place["type"]) || "Customer",
  city: dto.city || "—",
  ordersCount: Number(dto.ordersCount || 0),
});

const mapIssue = (dto: IssueDTO): Issue => ({
  id: String(dto.uuid || dto.id || dto.public_id || ""),
  title: dto.title || (dto.report ? String(dto.report).slice(0, 80) : "Issue report"),
  vehicleId: toId(dto.vehicleId || dto.vehicle_id || dto.vehicle_uuid),
  reportedBy: dto.reportedBy || dto.reporter_name || "Unknown",
  priority: (dto.priority as Issue["priority"]) || "low",
  status: (dto.status as Issue["status"]) || "open",
  reportedAt: dto.reportedAt || dto.created_at || "—",
  description: dto.description || dto.report || "",
});

function formatFuelStation(dto: FuelLogDTO) {
  if (dto.station) return dto.station;
  if (typeof dto.location === "string" && dto.location.trim()) return dto.location;
  if (dto.odometer != null) return `Odometer ${dto.odometer}`;
  return "—";
}

const mapFuelLog = (dto: FuelLogDTO): FuelLog => ({
  id: String(dto.uuid || dto.id || dto.public_id || ""),
  vehicleId: toId(dto.vehicleId || dto.vehicle_id || dto.vehicle_uuid),
  driverId: toId(dto.driverId || dto.driver_id || dto.driver_uuid),
  amount: Number(dto.volume ?? 0),
  cost: Number(dto.amount ?? dto.cost ?? 0),
  date: dto.date || dto.created_at || "—",
  station: formatFuelStation(dto),
});

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
    if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 400)) {
      return [];
    }
    throw error;
  }
}

export const fleetService = {
  listOrders: async () => (await fetchCollection<OrderDTO>("/orders?limit=500")).map(mapBackendOrder),
  listDrivers: async () => (await fetchCollection<DriverDTO>("/drivers")).map(mapDriver),
  listVehicles: async () => (await fetchCollection<VehicleDTO>("/vehicles")).map(mapVehicle),
  listRoutes: async () => (await fetchCollectionOptional<RouteDTO>("/routes")).map(mapRoute),
  listPlaces: async () => (await fetchCollectionOptional<PlaceDTO>("/places")).map(mapPlace),
  listIssues: async () => (await fetchCollectionOptional<IssueDTO>("/issues", ["issues"])).map(mapIssue),
  listFuelLogs: async () =>
    (await fetchCollectionOptional<FuelLogDTO>("/fuel-reports", ["fuel_reports", "fuelReports"])).map(mapFuelLog),
  listNotifications: async () =>
    (await fetchCollection<NotificationDTO>("/notifications")).map(mapNotification),
};

