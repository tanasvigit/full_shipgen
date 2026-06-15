import { getGoogleMapsApiKey } from "@/lib/maps/googleConfig";
import { decodePolyline } from "@/lib/maps/decodePolyline";

const routeCache = new Map();
const CACHE_LIMIT = 64;

/** @typedef {'google-routes' | 'google-directions' | 'google-directions-js' | 'straight' | 'geometry'} RoutePathSource */
/** @typedef {'idle' | 'loading' | 'ok' | 'fallback' | 'error'} RoutePathStatus */

/**
 * @param {unknown} point
 * @returns {{ lat: number, lng: number } | null}
 */
export function toLatLng(point) {
  if (!point) return null;
  if (Array.isArray(point)) {
    const lat = Number(point[0]);
    const lng = Number(point[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/**
 * @param {unknown[]} points
 * @returns {{ lat: number, lng: number }[]}
 */
export function normalizeWaypoints(points = []) {
  return (points || []).map(toLatLng).filter(Boolean);
}

/**
 * Dense coordinate lists are treated as live GPS trails, not road waypoints.
 * @param {unknown[]} points
 */
export function isLiveGpsTrail(points = []) {
  return Array.isArray(points) && points.length > 12;
}

function cacheKey(waypoints) {
  return waypoints
    .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
    .join("|");
}

function rememberCache(key, value) {
  if (routeCache.size >= CACHE_LIMIT) {
    const first = routeCache.keys().next().value;
    routeCache.delete(first);
  }
  routeCache.set(key, value);
}

/**
 * @param {{ lat: number, lng: number }[]} waypoints
 * @param {string} apiKey
 */
async function fetchRoutesApi(waypoints, apiKey) {
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
  };

  if (waypoints.length > 2) {
    body.intermediates = waypoints.slice(1, -1).map((point) => ({
      location: { latLng: { latitude: point.lat, longitude: point.lng } },
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
    const detail = await response.text();
    throw new Error(detail || `Routes API failed (${response.status})`);
  }

  const data = await response.json();
  const encoded = data?.routes?.[0]?.polyline?.encodedPolyline;
  if (!encoded) throw new Error("Routes API returned no polyline");

  return decodePolyline(encoded);
}

/**
 * @param {{ lat: number, lng: number }[]} waypoints
 * @param {string} apiKey
 */
async function fetchDirectionsRest(waypoints, apiKey) {
  const params = new URLSearchParams({
    origin: `${waypoints[0].lat},${waypoints[0].lng}`,
    destination: `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`,
    mode: "driving",
    key: apiKey,
  });

  const middle = waypoints.slice(1, -1);
  if (middle.length) {
    params.set("waypoints", middle.map((p) => `${p.lat},${p.lng}`).join("|"));
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

/**
 * @param {{ lat: number, lng: number }[]} waypoints
 */
function fetchDirectionsJs(waypoints) {
  return new Promise((resolve, reject) => {
    if (!window.google?.maps?.DirectionsService) {
      reject(new Error("Google Maps DirectionsService unavailable"));
      return;
    }

    const service = new window.google.maps.DirectionsService();
    const middle =
      waypoints.length > 2
        ? waypoints.slice(1, -1).map((location) => ({ location, stopover: true }))
        : [];

    service.route(
      {
        origin: waypoints[0],
        destination: waypoints[waypoints.length - 1],
        waypoints: middle,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]?.overview_path?.length) {
          resolve(
            result.routes[0].overview_path.map((ll) => ({
              lat: ll.lat(),
              lng: ll.lng(),
            })),
          );
          return;
        }
        reject(new Error(status || "DirectionsService failed"));
      },
    );
  });
}

function waitForDirectionsService(maxAttempts = 20, intervalMs = 250) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tick = () => {
      if (window.google?.maps?.DirectionsService) {
        resolve(true);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error("Google Maps DirectionsService timed out"));
        return;
      }
      setTimeout(tick, intervalMs);
    };

    tick();
  });
}

/**
 * Resolve a road-following path for stop waypoints.
 *
 * @param {unknown[]} routePoints
 * @param {{ apiKey?: string, allowJsFallback?: boolean }} [options]
 * @returns {Promise<{ path: { lat: number, lng: number }[], status: RoutePathStatus, source: RoutePathSource, error?: string }>}
 */
export async function resolveGoogleRoute(routePoints, options = {}) {
  const waypoints = normalizeWaypoints(routePoints);

  if (waypoints.length < 2) {
    return { path: waypoints, status: "ok", source: "straight" };
  }

  const apiKey = options.apiKey || getGoogleMapsApiKey();
  const key = cacheKey(waypoints);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const straight = waypoints;
  let lastError = "";

  if (apiKey) {
    try {
      const path = await fetchRoutesApi(waypoints, apiKey);
      const result = { path, status: "ok", source: "google-routes" };
      rememberCache(key, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    try {
      const path = await fetchDirectionsRest(waypoints, apiKey);
      const result = { path, status: "ok", source: "google-directions" };
      rememberCache(key, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (options.allowJsFallback !== false) {
    try {
      await waitForDirectionsService();
      const path = await fetchDirectionsJs(waypoints);
      const result = { path, status: "ok", source: "google-directions-js" };
      rememberCache(key, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  const result = {
    path: straight,
    status: apiKey ? "fallback" : "fallback",
    source: "straight",
    error: lastError || (apiKey ? undefined : "Google Maps API key is not configured"),
  };
  return result;
}

/**
 * @param {unknown[]} path
 * @returns {{ lat: number, lng: number }[]}
 */
export function normalizePath(path = []) {
  return normalizeWaypoints(path);
}
