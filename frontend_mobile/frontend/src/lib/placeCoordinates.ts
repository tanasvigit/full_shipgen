import type { MapCoordinate } from "@/src/maps/markers";

function readNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function readGeoJsonPoint(value: unknown): MapCoordinate | null {
  if (!value || typeof value !== "object") return null;

  const point = value as Record<string, unknown>;
  const coords = point.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;

  const lng = readNumber(coords[0]);
  const lat = readNumber(coords[1]);
  if (lat === null || lng === null) return null;
  return { latitude: lat, longitude: lng };
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

  const geoJson =
    readGeoJsonPoint(location) ??
    readGeoJsonPoint(coordinates) ??
    readGeoJsonPoint(record);

  const lat =
    geoJson?.latitude ??
    readNumber(record.latitude) ??
    readNumber(record.lat) ??
    readNumber(location?.latitude) ??
    readNumber(location?.lat) ??
    readNumber(coordinates?.latitude) ??
    readNumber(coordinates?.lat);
  const lng =
    geoJson?.longitude ??
    readNumber(record.longitude) ??
    readNumber(record.lng) ??
    readNumber(location?.longitude) ??
    readNumber(location?.lng) ??
    readNumber(coordinates?.longitude) ??
    readNumber(coordinates?.lng);

  if (lat === null || lng === null) return null;
  return { latitude: lat, longitude: lng };
}
