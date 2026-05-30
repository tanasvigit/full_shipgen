import { apiClient, unwrapEntity, unwrapList } from "@/lib/api";

const ORDER_KEYS = ["orders"];
const POSITION_KEYS = ["positions"];

async function tryGet(paths, params = {}) {
  let lastError;
  for (const path of paths) {
    try {
      const response = await apiClient.get(path, { params, loading: false });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function tryPost(paths, body = {}) {
  let lastError;
  for (const path of paths) {
    try {
      const response = await apiClient.post(path, body, { loading: false });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Query orders with server-side filters (driver, vehicle, status, place, limit, page). */
export async function queryOrders(params = {}) {
  const payload = await tryGet(
    ORDER_KEYS.map((k) => `/${k}`),
    params,
  );
  return unwrapList(payload, ["orders"]);
}

/** Live tracker payload for order drawer map tab. */
export async function fetchOrderTracker(orderId) {
  const id = String(orderId);
  const payload = await tryGet(ORDER_KEYS.map((k) => `/${k}/${id}/tracker`));
  return unwrapEntity(payload, ["tracker", "data", "order"]);
}

/** Order comment thread. */
export async function fetchOrderComments(orderId) {
  const id = String(orderId);
  const payload = await tryGet(ORDER_KEYS.map((k) => `/${k}/${id}/comments`));
  return unwrapList(payload, ["comments"]);
}

/** Positions for a subject (driver uuid). */
export async function queryPositions(params = {}) {
  try {
    const payload = await tryGet(POSITION_KEYS.map((k) => `/${k}`), params);
    return unwrapList(payload, ["positions"]);
  } catch {
    return [];
  }
}

/** Position metrics for replay analytics. */
export async function fetchPositionMetrics(positionIds = []) {
  if (!positionIds.length) return { metrics: [] };
  try {
    const payload = await tryPost(
      POSITION_KEYS.map((k) => `/${k}/metrics`),
      { position_ids: positionIds },
    );
    return unwrapEntity(payload, ["metrics", "data"]) || payload;
  } catch {
    return { metrics: [] };
  }
}

/** Geofence operational events. */
export async function queryGeofenceEvents(params = {}) {
  try {
    const payload = await tryGet(["/geofences/events"], params);
    return unwrapList(payload, ["events", "geofence_events"]);
  } catch {
    return [];
  }
}

/** Driver geofence history. */
export async function fetchGeofenceDriverHistory(driverUuid, params = {}) {
  try {
    const payload = await tryGet([`/geofences/driver/${driverUuid}/history`], params);
    return unwrapList(payload, ["history", "events"]);
  } catch {
    return [];
  }
}

/** Normalize coordinates from Fleetbase position records. */
export function positionToLatLng(position) {
  const c = position?.coordinates;
  if (Array.isArray(c) && c.length >= 2) {
    return { lat: Number(c[1]), lng: Number(c[0]) };
  }
  if (c?.coordinates?.length >= 2) {
    return { lat: Number(c.coordinates[1]), lng: Number(c.coordinates[0]) };
  }
  return {
    lat: Number(position?.latitude || position?.lat || 0),
    lng: Number(position?.longitude || position?.lng || 0),
  };
}
