import { extractStopsFromOrder, extractStopsFromOrders } from "./extractStopsFromOrders";

const AVG_SPEED_MPS = 11.11; // ~40 km/h fallback ETA

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pathDistanceMeters(stops = []) {
  let total = 0;
  for (let i = 1; i < stops.length; i += 1) {
    const prev = stops[i - 1];
    const next = stops[i];
    if (prev?.lat == null || next?.lat == null) continue;
    total += haversineMeters(Number(prev.lat), Number(prev.lng), Number(next.lat), Number(next.lng));
  }
  return total;
}

function orderKey(order) {
  return String(order?.public_id || order?.publicId || order?.uuid || order?.id || "");
}

function stopsForOrder(orders, orderId) {
  const order = orders.find((o) => {
    const key = orderKey(o);
    return key === String(orderId) || o?.public_id === orderId || o?.publicId === orderId;
  });
  return order ? extractStopsFromOrder(order) : [];
}

function buildSequencedStops(assignments = [], orders = [], rawStops = []) {
  if (rawStops.length) {
    return rawStops
      .map((stop, index) => ({
        id: stop.id || `${stop.order_id || stop.orderId || "stop"}-${index}`,
        orderId: stop.order_id || stop.orderId,
        type: stop.type || "stop",
        name: stop.name || stop.type || "Stop",
        lat: stop.lat,
        lng: stop.lng,
        sequence: stop.sequence ?? index + 1,
        vehicleId: stop.vehicle_id || stop.vehicleId,
        driverId: stop.driver_id || stop.driverId,
        distance: stop.distance,
        duration: stop.duration,
      }))
      .filter((stop) => stop.lat != null && stop.lng != null);
  }

  const sequenced = [];
  const sorted = [...assignments].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  for (const row of sorted) {
    const orderId = String(row.order_id || row.orderId || "");
    const orderStops = stopsForOrder(orders, orderId);
    const visitOrder = ["pickup", "waypoint", "dropoff"];

    const sortedStops = [...orderStops].sort((a, b) => {
      const ai = visitOrder.indexOf(a.type);
      const bi = visitOrder.indexOf(b.type);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    for (const stop of sortedStops) {
      sequenced.push({
        ...stop,
        orderId,
        sequence: row.sequence,
        vehicleId: row.vehicle_id || row.vehicleId,
        driverId: row.driver_id || row.driverId,
        distance: row.distance,
        duration: row.duration,
      });
    }
  }

  if (!sequenced.length && orders.length) {
    return extractStopsFromOrders(orders);
  }

  return sequenced;
}

function polylineFromStops(stops = []) {
  return stops.filter((s) => s.lat != null && s.lng != null).map((s) => [Number(s.lat), Number(s.lng)]);
}

/**
 * Normalize orchestrator / OSRM / VROOM responses into a shared shape for UI + map.
 */
export function normalizeOptimizationResult(raw = {}, orders = []) {
  const assignments = Array.isArray(raw?.assignments) ? raw.assignments : [];
  const unassigned = Array.isArray(raw?.unassigned) ? raw.unassigned : [];
  const summary = raw?.summary || {};
  const rawStops = Array.isArray(raw?.stops) ? raw.stops : [];

  const sequencedStops = buildSequencedStops(assignments, orders, rawStops);

  let polyline = Array.isArray(raw?.polyline)
    ? raw.polyline
        .map((point) => (Array.isArray(point) ? [Number(point[0]), Number(point[1])] : point))
        .filter((point) => point?.[0] != null && point?.[1] != null)
    : [];

  if (polyline.length < 2) {
    polyline = polylineFromStops(sequencedStops);
  }

  let totalDistance =
    summary.total_distance_m ??
    summary.total_distance ??
    assignments.reduce((n, a) => n + Number(a.distance || 0), 0);

  let totalDuration =
    summary.total_duration_s ??
    summary.total_duration ??
    assignments.reduce((n, a) => n + Number(a.duration || 0), 0);

  if (!totalDistance && sequencedStops.length >= 2) {
    totalDistance = pathDistanceMeters(sequencedStops);
  }

  if (!totalDuration && totalDistance > 0) {
    totalDuration = Math.round(totalDistance / AVG_SPEED_MPS);
  }

  return {
    assignments,
    unassigned,
    summary,
    sequencedStops,
    polyline,
    totalDistance,
    totalDuration,
    engine: raw?.engine || summary?.engine,
    raw,
  };
}

export function assignmentsForCommit(assignments = [], scheduledDate) {
  return {
    assignments: assignments.map((a, i) => ({
      order_id: a.order_id || a.orderId,
      vehicle_id: a.vehicle_id || a.vehicleId,
      driver_id: a.driver_id || a.driverId,
      sequence: a.sequence ?? i + 1,
      distance: a.distance ?? 0,
      duration: a.duration ?? 0,
      arrival: a.arrival,
      waypoint_sequence: a.waypoint_sequence,
    })),
    scheduled_date: scheduledDate || new Date().toISOString().slice(0, 10),
  };
}
