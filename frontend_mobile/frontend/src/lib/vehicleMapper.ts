import type { Vehicle } from "@/src/data/types";
import type { DriverDTO, VehicleDTO } from "@/src/types/api/fleet";

export function resolveEntityId(dto?: { uuid?: string; id?: string | number; public_id?: string } | null) {
  if (!dto) return "";
  return String(dto.uuid || dto.public_id || dto.id || "");
}

export function idsMatch(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

export function normalizeVehicleType(raw?: string | null): string {
  const t = String(raw || "")
    .toLowerCase()
    .replace(/-/g, "_");
  if (!t) return "Car";
  if (t.includes("truck") || t.includes("semi") || t.includes("tractor") || t.includes("lorry")) {
    return "Truck";
  }
  if (t.includes("van") || t.includes("cargo") || t.includes("sprinter")) return "Van";
  if (t.includes("bike") || t.includes("motor") || t.includes("moped") || t.includes("scooter")) {
    return "Bike";
  }
  if (t.includes("car") || t.includes("sedan") || t.includes("suv") || t.includes("hatch")) return "Car";
  return raw ? String(raw) : "Car";
}

export function normalizeVehicleStatus(raw?: string | null): Vehicle["status"] {
  const s = String(raw || "active").toLowerCase();
  if (["operational", "active", "online", "available"].includes(s)) return "active";
  if (["maintenance", "in_shop", "repair", "servicing"].includes(s)) return "maintenance";
  if (["idle", "standby", "parked"].includes(s)) return "idle";
  return "offline";
}

function vehicleDisplayName(dto: VehicleDTO) {
  const makeModel = [dto.make, dto.model].filter(Boolean).join(" ").trim();
  if (makeModel) return makeModel;
  return dto.display_name || dto.name || "Vehicle";
}

function vehiclePlate(dto: VehicleDTO) {
  return dto.plate_number || dto.plate || dto.call_sign || dto.public_id || "—";
}

function vehicleFuelLevel(dto: VehicleDTO) {
  const meta = dto.meta && typeof dto.meta === "object" ? (dto.meta as Record<string, unknown>) : {};
  const telematics =
    dto.telematics && typeof dto.telematics === "object"
      ? (dto.telematics as Record<string, unknown>)
      : {};
  const raw =
    dto.fuel ??
    meta.fuel_level ??
    meta.fuelLevel ??
    telematics.fuel_level ??
    telematics.fuelLevel;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function vehicleDriverId(dto: VehicleDTO) {
  const driver = dto.driver && typeof dto.driver === "object" ? dto.driver : null;
  if (driver) return resolveEntityId(driver as DriverDTO);
  return String(dto.driver_uuid || dto.driver_id || dto.driverId || "");
}

function vehicleDriverName(dto: VehicleDTO) {
  const driver = dto.driver && typeof dto.driver === "object" ? dto.driver : null;
  if (driver?.name) return String(driver.name);
  return dto.driver_name ? String(dto.driver_name) : "";
}

export function mapVehicleFromApi(dto: VehicleDTO): Vehicle {
  const id = resolveEntityId(dto);
  return {
    id,
    publicId: String(dto.public_id || id),
    plate: vehiclePlate(dto),
    model: vehicleDisplayName(dto),
    make: dto.make || "",
    year: dto.year != null ? String(dto.year) : "",
    type: normalizeVehicleType(dto.vehicle_type || dto.type || dto.body_type),
    status: normalizeVehicleStatus(dto.status),
    fuel: vehicleFuelLevel(dto),
    mileage: Number(dto.odometer ?? dto.mileage ?? 0),
    driverId: vehicleDriverId(dto),
    driverName: vehicleDriverName(dto),
    lastService: dto.last_service || dto.last_serviced_at || dto.updated_at || "—",
    nextService: dto.next_service || dto.next_service_at || "—",
    image: dto.photo_url || dto.avatar_url || dto.image || "",
    vin: dto.vin || "",
    online: Boolean(dto.online),
  };
}
