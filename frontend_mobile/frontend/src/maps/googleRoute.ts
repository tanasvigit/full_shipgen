import { decodePolyline } from "@/src/maps/decodePolyline";
import { resolveGoogleMapsApiKey } from "@/src/maps/provider";
import type { MapCoordinate } from "@/src/maps/markers";

export type RoutePathSource = "google-routes" | "google-directions" | "straight" | "geometry";
export type RoutePathStatus = "idle" | "loading" | "ok" | "fallback" | "error";

const routeCache = new Map<string, { path: MapCoordinate[]; status: RoutePathStatus; source: RoutePathSource }>();
const CACHE_LIMIT = 48;

function cacheKey(waypoints: MapCoordinate[]) {
  return waypoints
    .map((point) => `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`)
    .join("|");
}

function rememberCache(
  key: string,
  value: { path: MapCoordinate[]; status: RoutePathStatus; source: RoutePathSource }
) {
  if (routeCache.size >= CACHE_LIMIT) {
    const first = routeCache.keys().next().value;
    if (first) routeCache.delete(first);
  }
  routeCache.set(key, value);
}

export function isLiveGpsTrail(points: MapCoordinate[] = []) {
  return points.length > 12;
}

async function fetchRoutesApi(waypoints: MapCoordinate[], apiKey: string) {
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
    destination: {
      location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
  };

  if (waypoints.length > 2) {
    body.intermediates = waypoints.slice(1, -1).map((point) => ({
      location: { latLng: { latitude: point.latitude, longitude: point.longitude } },
    }));
  }

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  const encoded = data?.routes?.[0]?.polyline?.encodedPolyline;
  if (!encoded) throw new Error("Routes API returned no polyline");

  return decodePolyline(encoded);
}

async function fetchDirectionsRest(waypoints: MapCoordinate[], apiKey: string) {
  const params = new URLSearchParams({
    origin: `${waypoints[0].latitude},${waypoints[0].longitude}`,
    destination: `${waypoints[waypoints.length - 1].latitude},${waypoints[waypoints.length - 1].longitude}`,
    mode: "driving",
    key: apiKey,
  });

  const middle = waypoints.slice(1, -1);
  if (middle.length) {
    params.set("waypoints", middle.map((point) => `${point.latitude},${point.longitude}`).join("|"));
  }

  const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`);
  const data = await response.json();

  if (data.status !== "OK" || !data.routes?.[0]) {
    throw new Error(data.error_message || data.status || "Directions API failed");
  }

  const encoded = data.routes[0].overview_polyline?.points;
  if (!encoded) throw new Error("Directions API returned no polyline");

  return decodePolyline(encoded);
}

export async function resolveGoogleRoute(waypoints: MapCoordinate[]) {
  if (waypoints.length < 2) {
    return { path: waypoints, status: "ok" as const, source: "straight" as const };
  }

  const key = cacheKey(waypoints);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const apiKey = resolveGoogleMapsApiKey();
  const straight = waypoints;
  let lastError = "";

  if (apiKey) {
    try {
      const path = await fetchRoutesApi(waypoints, apiKey);
      const result = { path, status: "ok" as const, source: "google-routes" as const };
      rememberCache(key, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    try {
      const path = await fetchDirectionsRest(waypoints, apiKey);
      const result = { path, status: "ok" as const, source: "google-directions" as const };
      rememberCache(key, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    path: straight,
    status: "fallback" as const,
    source: "straight" as const,
    error: lastError || (apiKey ? undefined : "Google Maps API key is not configured"),
  };
}
