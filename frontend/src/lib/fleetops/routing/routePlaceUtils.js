/** Shared pickup/drop-off place labels across FleetOps route surfaces. */

export const ROUTE_ORDER_WITH = "order.payload.pickup,order.payload.dropoff,order.driverAssigned";

const GENERIC_STOP_NAMES = new Set(["pickup", "dropoff", "drop-off", "stop", "waypoint"]);

export function isGenericStopName(name) {
  if (name == null || name === "") return true;
  return GENERIC_STOP_NAMES.has(String(name).trim().toLowerCase());
}

export function placeLabel(place) {
  if (!place || typeof place !== "object") return null;
  return place.name || place.address || place.street1 || place.public_id || null;
}

export function resolveRouteDriver(route) {
  const safe = route ?? {};
  const driver = safe.driver || safe.order?.driver_assigned || safe.order?.driverAssigned || safe.order?.driver;
  if (!driver) return null;
  if (typeof driver === "string") return driver;
  return driver.name || driver.public_id || driver.uuid || null;
}

export function resolveOrderPlaces(route) {
  const safe = route ?? {};
  const payload = safe.payload || safe.order?.payload || {};
  const order = safe.order || {};
  return {
    pickup: payload.pickup || order.pickup || order.pickup_place || null,
    dropoff: payload.dropoff || order.dropoff || order.dropoff_place || null,
    pickupName: payload.pickup_name || null,
    dropoffName: payload.dropoff_name || null,
  };
}

export function resolveOrderPickupDropoff(record) {
  const safe = record ?? {};
  const payload = safe.payload || safe.order?.payload || {};
  const order = safe.order || safe;
  const pickup =
    placeLabel(payload.pickup || order.pickup || order.pickup_place) ||
    payload.pickup_name ||
    null;
  const dropoff =
    placeLabel(payload.dropoff || order.dropoff || order.dropoff_place) ||
    payload.dropoff_name ||
    null;

  return {
    pickup: pickup || "—",
    dropoff: dropoff || "—",
  };
}

export function resolveStopLocationName(stop = {}, places = {}) {
  const explicit = stop.name || stop.location_name || stop.location || stop.address || stop.street1;
  if (explicit && !isGenericStopName(explicit)) return explicit;

  const type = String(stop.type || "").toLowerCase();
  if (type === "pickup") return placeLabel(places.pickup) || places.pickupName || "—";
  if (type === "dropoff") return placeLabel(places.dropoff) || places.dropoffName || "—";

  return placeLabel(stop.place) || (explicit && !isGenericStopName(explicit) ? explicit : "—");
}

/** Resolve pickup/drop-off labels for a route list row. */
export function resolveRoutePickupDropoff(route) {
  const safe = route ?? {};
  const places = resolveOrderPlaces(safe);
  const stops = safe.details?.stops?.length ? safe.details.stops : safe.details?.assignments || [];
  const pickupStop = Array.isArray(stops) ? stops.find((s) => s.type === "pickup") : null;
  const dropoffStop = Array.isArray(stops) ? stops.find((s) => s.type === "dropoff") : null;

  const pickup =
    placeLabel(places.pickup) ||
    (pickupStop?.name && !isGenericStopName(pickupStop.name) ? pickupStop.name : null) ||
    places.pickupName ||
    null;
  const dropoff =
    placeLabel(places.dropoff) ||
    (dropoffStop?.name && !isGenericStopName(dropoffStop.name) ? dropoffStop.name : null) ||
    places.dropoffName ||
    null;

  return {
    pickup: pickup || "—",
    dropoff: dropoff || "—",
  };
}

/** Build enriched stop rows for route detail tables. */
export function buildRouteStopRows(route) {
  const safe = route ?? {};
  const places = resolveOrderPlaces(safe);
  const orderId = safe.order_public_id || safe.order?.public_id || null;
  const routeDriver = resolveRouteDriver(safe);
  const routeDistance = safe.total_distance ?? safe.total_distance_m ?? null;
  const routeDuration = safe.total_time ?? safe.total_duration ?? safe.total_duration_s ?? null;
  const stops = safe.details?.stops || [];

  const formatDriver = (stop) => {
    const id = stop.driver_id || stop.driverId;
    if (id && typeof id === "object") return id.name || id.public_id || "—";
    if (routeDriver) return routeDriver;
    if (id) return String(id);
    return "—";
  };

  if (stops.length) {
    return stops.map((s, i) => ({
      id: s.id || `${s.order_id || s.orderId || "stop"}-${i}`,
      sequence: s.sequence ?? i + 1,
      orderId: s.order_id || s.orderId || orderId,
      type: s.type || "stop",
      location: resolveStopLocationName(s, places),
      driver: formatDriver(s),
      distance: s.distance ?? s.distance_m ?? (i === stops.length - 1 ? routeDistance : null),
      duration: s.duration ?? s.duration_s ?? (i === stops.length - 1 ? routeDuration : null),
    }));
  }

  const assignments = safe.details?.assignments || [];
  const synthesized = [];
  let sequence = 1;

  if (places.pickup || places.pickupName) {
    synthesized.push({
      id: `${orderId || "route"}-pickup`,
      sequence: sequence++,
      orderId: assignments[0]?.order_id || assignments[0]?.orderId || orderId,
      type: "pickup",
      location: placeLabel(places.pickup) || places.pickupName || "—",
      driver: routeDriver || "—",
      distance: null,
      duration: null,
    });
  }

  if (places.dropoff || places.dropoffName) {
    synthesized.push({
      id: `${orderId || "route"}-dropoff`,
      sequence: sequence++,
      orderId: assignments[0]?.order_id || assignments[0]?.orderId || orderId,
      type: "dropoff",
      location: placeLabel(places.dropoff) || places.dropoffName || "—",
      driver: routeDriver || "—",
      distance: assignments[0]?.distance ?? routeDistance,
      duration: assignments[0]?.duration ?? routeDuration,
    });
  }

  if (synthesized.length) return synthesized;

  return assignments.map((a, i) => ({
    id: a.order_id || i,
    sequence: a.sequence ?? i + 1,
    orderId: a.order_id || a.orderId || orderId,
    type: a.type || "stop",
    location: resolveStopLocationName(a, places),
    driver: formatDriver(a),
    distance: a.distance ?? (i === assignments.length - 1 ? routeDistance : null),
    duration: a.duration ?? (i === assignments.length - 1 ? routeDuration : null),
  }));
}

export function routeHasPlaceData(route) {
  const places = resolveOrderPlaces(route);
  return Boolean(
    placeLabel(places.pickup) ||
      placeLabel(places.dropoff) ||
      places.pickupName ||
      places.dropoffName,
  );
}
