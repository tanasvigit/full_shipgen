import { extractStopsFromOrders } from "./extractStopsFromOrders";

/**
 * Normalize orchestrator / OSRM / VROOM responses into a shared shape for UI + map.
 */
export function normalizeOptimizationResult(raw = {}, orders = []) {
  const assignments = Array.isArray(raw?.assignments) ? raw.assignments : [];
  const unassigned = Array.isArray(raw?.unassigned) ? raw.unassigned : [];
  const summary = raw?.summary || {};

  const stopsByOrder = {};
  for (const order of orders) {
    const id = order?.public_id || order?.publicId || order?.uuid || order?.id;
    if (id) stopsByOrder[String(id)] = extractStopsFromOrders([order]);
  }

  const sequencedStops = [];
  const sorted = [...assignments].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  for (const row of sorted) {
    const orderId = String(row.order_id || row.orderId || "");
    const orderStops = stopsByOrder[orderId] || [];
    const drop = orderStops.find((s) => s.type === "dropoff") || orderStops[orderStops.length - 1];
    if (drop) {
      sequencedStops.push({
        ...drop,
        sequence: row.sequence,
        vehicleId: row.vehicle_id,
        driverId: row.driver_id,
        distance: row.distance,
        duration: row.duration,
      });
    }
  }

  if (!sequencedStops.length && orders.length) {
    sequencedStops.push(...extractStopsFromOrders(orders));
  }

  const polyline = sequencedStops
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => [s.lat, s.lng]);

  const totalDistance =
    summary.total_distance_m ??
    summary.total_distance ??
    assignments.reduce((n, a) => n + Number(a.distance || 0), 0);

  const totalDuration =
    summary.total_duration_s ??
    summary.total_duration ??
    assignments.reduce((n, a) => n + Number(a.duration || 0), 0);

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
