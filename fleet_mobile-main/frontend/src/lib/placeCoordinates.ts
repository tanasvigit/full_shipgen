import type { MapCoordinate } from "@/src/maps/markers";

function readNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Extract lat/lng from Fleetbase place payloads when present. */
export function placeCoordinate(place: unknown): MapCoordinate | null {
  if (!place || typeof place === "string") return null;

  const record = place as Record<string, unknown>;
  const location =
    record.location && typeof record.location === "object"
      ? (record.location as Record<string, unknown>)
      : null;
  const coordinates =
    record.coordinates && typeof record.coordinates === "object"
      ? (record.coordinates as Record<string, unknown>)
      : null;

  const lat =
    readNumber(record.latitude) ??
    readNumber(record.lat) ??
    readNumber(location?.latitude) ??
    readNumber(location?.lat) ??
    readNumber(coordinates?.latitude) ??
    readNumber(coordinates?.lat);
  const lng =
    readNumber(record.longitude) ??
    readNumber(record.lng) ??
    readNumber(location?.longitude) ??
    readNumber(location?.lng) ??
    readNumber(coordinates?.longitude) ??
    readNumber(coordinates?.lng);

  if (lat === null || lng === null) return null;
  return { latitude: lat, longitude: lng };
}
