import type { Order } from "@/src/data/types";
import { resolveEffectiveOrderStatus } from "@/src/lib/orderStatus";
import { placeCoordinate } from "@/src/lib/placeCoordinates";

function placeLabel(place: any, fallback = "—") {
  if (!place) return fallback;
  if (typeof place === "string") return place;
  return place?.address || place?.name || place?.street1 || fallback;
}

function entityId(entity: any) {
  if (entity?.uuid) {
    return String(entity.uuid);
  }
  if (entity?.public_id) {
    return String(entity.public_id);
  }
  return "";
}

function entityLabel(entity: any) {
  if (!entity || typeof entity === "string") {
    return typeof entity === "string" ? entity : "";
  }
  return (
    entity.name ||
    entity.plate_number ||
    entity.plate ||
    entity.display_name ||
    entity.public_id ||
    ""
  );
}

function resolveDriver(raw: any) {
  const driver = raw?.driver_assigned || raw?.driver || null;
  const id =
    entityId(driver) ||
    entityId({ uuid: raw?.driver_assigned_uuid, public_id: raw?.driver_public_id });
  const label = entityLabel(driver) || entityLabel(driver?.user) || id;
  return { id, label };
}

function resolveVehicle(raw: any) {
  const driver = raw?.driver_assigned || raw?.driver || null;
  const vehicle = raw?.vehicle_assigned || raw?.vehicle || driver?.vehicle || null;
  const id =
    entityId(vehicle) ||
    entityId({ uuid: raw?.vehicle_assigned_uuid }) ||
    entityId({ uuid: driver?.vehicle_uuid });
  const label =
    entityLabel(vehicle) ||
    String(driver?.vehicle_name || raw?.vehicle_name || "") ||
    id;
  return { id, label };
}

export function mapBackendOrder(raw: any): Order {
  const id = entityId(raw);
  const code = raw?.public_id || raw?.tracking_number || raw?.internal_id || id;
  const customerName = raw?.customer?.name || raw?.customer_name || "Customer";
  const status = resolveEffectiveOrderStatus({
    status: raw?.status || "created",
    dispatched: raw?.dispatched,
    dispatched_at: raw?.dispatched_at,
    started: raw?.started,
    started_at: raw?.started_at,
  });

  const pickupPlace = raw?.pickup || raw?.pickup_place || raw?.payload?.pickup;
  const dropoffPlace = raw?.dropoff || raw?.dropoff_place || raw?.payload?.dropoff;
  const driver = resolveDriver(raw);
  const vehicle = resolveVehicle(raw);

  return {
    id,
    code: String(code),
    customer: customerName,
    pickup: placeLabel(pickupPlace, "Pickup"),
    dropoff: placeLabel(dropoffPlace, "Dropoff"),
    pickupCoordinate: placeCoordinate(pickupPlace),
    dropoffCoordinate: placeCoordinate(dropoffPlace),
    status: status as Order["status"],
    dispatched: Boolean(raw?.dispatched || raw?.dispatched_at),
    started: Boolean(raw?.started || raw?.started_at),
    driverId: driver.id,
    driverName: driver.label,
    vehicleId: vehicle.id,
    vehicleLabel: vehicle.label,
    amount: Number(raw?.total || raw?.amount || 0),
    distance: raw?.distance ? `${raw.distance} mi` : "—",
    scheduledAt: raw?.scheduled_at || raw?.eta || "—",
    createdAt: raw?.created_at || "—",
    items: Array.isArray(raw?.payload?.items)
      ? raw.payload.items.map((item: any) => ({
          name: item?.name || "Item",
          qty: Number(item?.qty || item?.quantity || 1),
          weight: item?.weight ? String(item.weight) : "—",
        }))
      : [],
    timeline: Array.isArray(raw?.timeline)
      ? raw.timeline.map((step: any) => ({
          time: step?.time || step?.at || "—",
          label: step?.label || step?.name || "Step",
          done: Boolean(step?.done || step?.completed),
        }))
      : [],
  };
}
