import type { Order } from "@/src/data/types";
import { normalizeStatus } from "@/src/lib/orderStatus";
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

export function mapBackendOrder(raw: any): Order {
  const id = entityId(raw);
  const code = raw?.public_id || raw?.tracking_number || raw?.internal_id || id;
  const customerName = raw?.customer?.name || raw?.customer_name || "Customer";
  const status = normalizeStatus(raw?.status || "created");

  const pickupPlace = raw?.pickup || raw?.pickup_place;
  const dropoffPlace = raw?.dropoff || raw?.dropoff_place;

  return {
    id,
    code: String(code),
    customer: customerName,
    pickup: placeLabel(pickupPlace, "Pickup"),
    dropoff: placeLabel(dropoffPlace, "Dropoff"),
    pickupCoordinate: placeCoordinate(pickupPlace),
    dropoffCoordinate: placeCoordinate(dropoffPlace),
    status: status as Order["status"],
    driverId: entityId(raw?.driver || raw?.driver_assigned || { id: raw?.driver_uuid || raw?.driver_id }),
    vehicleId: entityId(raw?.vehicle || raw?.vehicle_assigned || { id: raw?.vehicle_uuid || raw?.vehicle_id }),
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
