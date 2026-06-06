import type { MobileUser } from "@/src/services/authService";

/** Resolve the driver record id used by /drivers/{id}/track and toggle-online. */
export function resolveDriverTrackId(user: MobileUser | null | undefined): string | null {
  if (!user?.raw) return null;
  const driver = user.raw.driver;
  if (driver?.public_id) return String(driver.public_id);
  if (driver?.uuid) return String(driver.uuid);
  if (user.raw.driver_uuid) return String(user.raw.driver_uuid);
  return null;
}

export function isDriverUser(user: MobileUser | null | undefined): boolean {
  if (!user) return false;
  if (String(user.raw?.type || "").toLowerCase() === "driver") return true;
  return Boolean(resolveDriverTrackId(user));
}

function driverIdentityCandidates(user: MobileUser | null | undefined): string[] {
  if (!user?.raw) return [];
  const driver = user.raw.driver;
  return [
    resolveDriverTrackId(user),
    driver?.uuid,
    driver?.public_id,
    user.raw.driver_uuid,
  ]
    .filter(Boolean)
    .map((value) => String(value));
}

export function orderAssignedToDriver(orderDriverId: string | undefined, user: MobileUser | null | undefined) {
  if (!orderDriverId || !user) return false;
  const candidates = driverIdentityCandidates(user);
  if (!candidates.length) return false;
  return candidates.includes(String(orderDriverId));
}
