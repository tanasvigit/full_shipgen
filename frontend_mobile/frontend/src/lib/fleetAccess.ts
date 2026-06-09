import type { MobileUser } from "@/src/services/authService";
import { isDriverUser } from "@/src/lib/driver";

type CanFleetops = (action: string, resource: string) => boolean;

/** Fleet bottom tab — ops users with vehicle list access, not field drivers. */
export function showFleetTab(
  user: MobileUser | null | undefined,
  canFleetops: CanFleetops,
): boolean {
  if (!user || isDriverUser(user)) return false;
  return canFleetops("list", "vehicle");
}

export function canManageFleetVehicles(canFleetops: CanFleetops): boolean {
  return canFleetops("create", "vehicle");
}

export function canListFleetDrivers(canFleetops: CanFleetops): boolean {
  return canFleetops("list", "driver");
}

export function canListFleetRoutes(canFleetops: CanFleetops): boolean {
  return canFleetops("list", "route");
}

export function canListFleetPlaces(canFleetops: CanFleetops): boolean {
  return canFleetops("list", "place");
}

export function canListFleetIssues(canFleetops: CanFleetops): boolean {
  return canFleetops("list", "issue");
}

export function canListFleetFuel(canFleetops: CanFleetops): boolean {
  return canFleetops("list", "fuel-report") || canFleetops("list", "fuel_report");
}
