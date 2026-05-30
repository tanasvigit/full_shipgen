import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { fleetopsCacheKeys } from "@/domain/fleetops/cache/keys";

const ORDER_RELOAD_EVENTS = new Set([
  "order.created",
  "order.completed",
  "order.updated",
  "order.dispatched",
  "order.started",
  "order.canceled",
  "order.cancelled",
  "order.failed",
  "waypoint.activity",
  "entity.activity",
  "order.tracking_updated",
  "order.location_updated",
  "order.driver_changed",
  "order.vehicle_changed",
  "order.proof_uploaded",
  "order.comment_added",
  "order.assigned",
  "poll.tick",
]);

const DRIVER_EVENTS = new Set([
  "driver.position_updated",
  "driver.status_changed",
  "driver.assignment_changed",
  "driver.location_ping",
]);

const VEHICLE_EVENTS = new Set([
  "vehicle.telemetry_updated",
  "vehicle.gps_updated",
  "vehicle.fuel_updated",
]);

/** Cache invalidation + global event bus for entity patches. */
export function handleFleetopsRealtimeMessage(message, { channelId } = {}) {
  const event = message?.event || message?.type;
  const data = message?.data || message?.payload || {};
  if (!event) return;

  if (channelId?.startsWith("order.")) {
    const orderId = data?.uuid || data?.id || data?.order_uuid;
    if (ORDER_RELOAD_EVENTS.has(event) || event.startsWith("order.")) {
      if (orderId) fleetopsCache.invalidateOrder(orderId);
      fleetopsCache.invalidate([fleetopsCacheKeys.orders.all()]);
    }
  }

  if (channelId?.startsWith("company.")) {
    if (event.startsWith("order.") || event.startsWith("driver.")) {
      fleetopsCache.invalidate([fleetopsCacheKeys.orders.all(), fleetopsCacheKeys.drivers.all()]);
    }
  }

  if (DRIVER_EVENTS.has(event) && (data?.driver_uuid || data?.subject_uuid)) {
    fleetopsCache.invalidateDriver(data.driver_uuid || data.subject_uuid);
  }

  if (VEHICLE_EVENTS.has(event) && data?.vehicle_uuid) {
    fleetopsCache.invalidateVehicle(data.vehicle_uuid);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("fleetops:realtime", {
        detail: { event, data, channelId, message },
      }),
    );
  }
}
