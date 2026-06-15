/** Operational enums aligned with packages/fleetops/server config & form requests. */

export { ORDER_STATUSES, TERMINAL_ORDER_STATUSES } from "@/domain/fleetops/status";
export const ORDER_PRIORITIES = ["low", "medium", "high", "urgent"];
export const POD_METHODS = ["scan", "signature", "photo"];

export const DRIVER_STATUSES = ["active", "inactive"];
export const DRIVER_SKILLS = [
  { value: "hazmat", label: "Hazmat" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "liftgate", label: "Liftgate" },
  { value: "local", label: "Local delivery" },
  { value: "long_haul", label: "Long haul" },
];

export const VEHICLE_STATUSES = ["operational", "maintenance", "decommissioned"];
export const VEHICLE_TYPES = [
  { value: "cargo_van", label: "Cargo van" },
  { value: "box_truck", label: "Box truck" },
  { value: "tractor", label: "Tractor" },
  { value: "trailer", label: "Trailer" },
  { value: "sedan", label: "Sedan" },
  { value: "motorcycle", label: "Motorcycle" },
];

export const FUEL_TYPES = [
  { value: "diesel", label: "Diesel" },
  { value: "gasoline", label: "Gasoline" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "cng", label: "CNG" },
];

export const PLACE_TYPES = [
  { value: "pickup", label: "Pickup" },
  { value: "drop_off", label: "Drop-off" },
  { value: "hub", label: "Hub" },
  { value: "warehouse", label: "Warehouse" },
  { value: "depot", label: "Depot" },
];

export const FLEET_STATUSES = ["active", "paused", "inactive"];

export const FLEET_COLORS = ["#0066FF", "#16A34A", "#7C3AED", "#EA580C", "#0891B2", "#DC2626"];

export const SCHEDULE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
