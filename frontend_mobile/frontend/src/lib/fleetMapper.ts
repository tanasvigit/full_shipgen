import type { Driver, FuelLog, Issue, Place, Route } from "@/src/data/types";
import type { DriverDTO, FuelLogDTO, IssueDTO, PlaceDTO, RouteDTO } from "@/src/types/api/fleet";
import { idsMatch, resolveEntityId } from "@/src/lib/vehicleMapper";

export { idsMatch, resolveEntityId };

function formatDate(value?: string | null) {
  if (!value) return "—";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function formatLocationLabel(value: unknown) {
  if (!value) return "—";
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "object" && value !== null) {
    const row = value as Record<string, unknown>;
    const city = row.city ? String(row.city) : "";
    const label = row.label ? String(row.label) : "";
    if (label) return label;
    const lat = row.latitude ?? row.lat;
    const lng = row.longitude ?? row.lng;
    if (lat != null && lng != null) return `${lat}, ${lng}`;
    if (city) return city;
  }
  return "—";
}

function formatDistance(value: unknown) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isFinite(n)) {
    if (n > 1000) return `${(n / 1000).toFixed(1)} km`;
    return `${n} km`;
  }
  return String(value);
}

function formatDuration(value: unknown) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (n >= 3600) return `${Math.round(n / 3600)}h`;
  if (n >= 60) return `${Math.round(n / 60)}m`;
  return `${n}s`;
}

export function normalizeDriverStatus(dto: DriverDTO): Driver["status"] {
  if (dto.online) return "online";
  const status = String(dto.status || "").toLowerCase();
  if (["online", "active", "available"].includes(status)) return "online";
  if (["idle", "busy", "on_break", "on-break"].includes(status)) return "idle";
  return "offline";
}

export function mapDriverFromApi(dto: DriverDTO): Driver {
  const vehicle = dto.vehicle && typeof dto.vehicle === "object" ? dto.vehicle : null;
  const meta = dto.meta && typeof dto.meta === "object" ? (dto.meta as Record<string, unknown>) : {};
  return {
    id: resolveEntityId(dto),
    name: dto.name || "Driver",
    phone: dto.phone || "",
    email: dto.email || "",
    rating: Number(dto.rating ?? meta.rating ?? 0),
    status: normalizeDriverStatus(dto),
    avatar: dto.avatar_url || dto.photo_url || dto.avatar || "",
    vehicleId: resolveEntityId(vehicle as DriverDTO | null) || String(dto.vehicle_uuid || dto.vehicle_id || dto.vehicleId || ""),
    licenseNo: dto.drivers_license_number || dto.license_no || dto.licenseNo || "—",
    trips: Number(dto.trips ?? dto.orders_completed ?? meta.trips ?? 0),
    earnings: Number(dto.earnings ?? meta.earnings ?? 0),
    joinedAt: formatDate(dto.joined_at || dto.joinedAt || dto.created_at),
    currentLocation: formatLocationLabel(dto.current_location || dto.currentLocation || dto.city || dto.location),
  };
}

export function normalizePlaceType(raw?: string | null): Place["type"] {
  const t = String(raw || "place").toLowerCase();
  if (t.includes("warehouse") || t.includes("depot")) return "Warehouse";
  if (t.includes("hub") || t.includes("terminal")) return "Hub";
  if (t.includes("customer") || t.includes("client")) return "Customer";
  return "Customer";
}

export function mapPlaceFromApi(dto: PlaceDTO): Place {
  const meta = dto.meta && typeof dto.meta === "object" ? (dto.meta as Record<string, unknown>) : {};
  const address =
    dto.address ||
    [dto.street1, dto.street2, dto.city, dto.province, dto.postal_code].filter(Boolean).join(", ") ||
    "—";
  return {
    id: resolveEntityId(dto),
    name: dto.name || "Place",
    address,
    type: normalizePlaceType(dto.type),
    city: dto.city || dto.province || dto.country || "—",
    ordersCount: Number(dto.orders_count ?? dto.ordersCount ?? meta.orders_count ?? 0),
  };
}

function normalizeRouteStatus(raw?: string | null): Route["status"] {
  const s = String(raw || "scheduled").toLowerCase();
  if (["active", "in_progress", "started", "dispatched", "en_route"].includes(s)) return "active";
  if (["completed", "done", "finished"].includes(s)) return "completed";
  return "scheduled";
}

export function mapRouteFromApi(dto: RouteDTO): Route {
  const id = resolveEntityId(dto);
  const details = dto.details && typeof dto.details === "object" ? (dto.details as Record<string, unknown>) : {};
  const assignments = Array.isArray(details.assignments) ? details.assignments : [];
  const driver = dto.driver && typeof dto.driver === "object" ? dto.driver : null;
  const vehicle = dto.vehicle && typeof dto.vehicle === "object" ? dto.vehicle : null;
  const waypoints = (dto.waypoints || []).map((waypoint) => ({
    name: waypoint.name || "Waypoint",
    address: waypoint.address || "—",
    eta: waypoint.eta || "—",
    done: Boolean(waypoint.done),
  }));

  return {
    id,
    name:
      dto.name ||
      dto.order_public_id ||
      dto.public_id ||
      dto.tracking_number ||
      `Route ${id.slice(0, 8)}`,
    stops: Number(dto.stops ?? dto.stop_count ?? assignments.length ?? waypoints.length ?? 0),
    distance: formatDistance(dto.total_distance ?? dto.distance),
    duration: formatDuration(dto.total_time ?? dto.duration),
    status: normalizeRouteStatus(dto.order_status || dto.status),
    driverId:
      resolveEntityId(driver as DriverDTO | null) ||
      String(dto.driver_uuid || dto.driver_id || dto.driverId || ""),
    driverName: driver?.name || dto.driver_name || "",
    vehicleId:
      resolveEntityId(vehicle as { uuid?: string; id?: string; public_id?: string } | null) ||
      String(dto.vehicle_uuid || dto.vehicle_id || dto.vehicleId || ""),
    waypoints,
  };
}

function normalizeIssueStatus(raw?: string | null): Issue["status"] {
  const s = String(raw || "open").toLowerCase();
  if (["in_progress", "in-progress", "assigned", "investigating"].includes(s)) return "in_progress";
  if (["resolved", "closed", "completed"].includes(s)) return "resolved";
  return "open";
}

function normalizeIssuePriority(raw?: string | null): Issue["priority"] {
  const p = String(raw || "low").toLowerCase();
  if (p.includes("high") || p.includes("urgent") || p.includes("critical")) return "high";
  if (p.includes("medium") || p.includes("normal")) return "medium";
  return "low";
}

export function mapIssueFromApi(dto: IssueDTO): Issue {
  const vehicle = dto.vehicle && typeof dto.vehicle === "object" ? dto.vehicle : null;
  const report = dto.report || dto.description || "";
  return {
    id: resolveEntityId(dto),
    title: dto.title || dto.type || dto.category || (report ? String(report).slice(0, 80) : "Issue report"),
    vehicleId:
      resolveEntityId(vehicle as { uuid?: string; id?: string; public_id?: string } | null) ||
      String(dto.vehicle_uuid || dto.vehicle_id || dto.vehicleId || ""),
    vehicleName: dto.vehicle_name || vehicle?.name || "",
    reportedBy: dto.reporter_name || dto.reportedBy || "Unknown",
    priority: normalizeIssuePriority(dto.priority),
    status: normalizeIssueStatus(dto.status),
    reportedAt: formatDate(dto.created_at || dto.reportedAt),
    description: report,
  };
}

export function mapFuelLogFromApi(dto: FuelLogDTO): FuelLog {
  const vehicle = dto.vehicle && typeof dto.vehicle === "object" ? dto.vehicle : null;
  const driver = dto.driver && typeof dto.driver === "object" ? dto.driver : null;
  let station = dto.station || "";
  if (!station) {
    if (typeof dto.location === "string" && dto.location.trim()) station = dto.location.trim();
    else if (dto.odometer != null) station = `Odometer ${dto.odometer}`;
    else station = "—";
  }

  return {
    id: resolveEntityId(dto),
    vehicleId:
      resolveEntityId(vehicle as { uuid?: string; id?: string; public_id?: string } | null) ||
      String(dto.vehicle_uuid || dto.vehicle_id || dto.vehicleId || ""),
    vehicleName: dto.vehicle_name || vehicle?.name || "",
    driverId:
      resolveEntityId(driver as DriverDTO | null) ||
      String(dto.driver_uuid || dto.driver_id || dto.driverId || ""),
    driverName: dto.driver_name || driver?.name || "",
    amount: Number(dto.volume ?? 0),
    cost: Number(dto.amount ?? dto.cost ?? 0),
    date: formatDate(dto.created_at || dto.date),
    station,
  };
}
