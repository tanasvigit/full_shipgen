/** Extract map stops from order records (pickup, dropoff, payload entities). */

function coordsFromPlace(place) {
  if (!place) return null;
  if (place.location?.coordinates?.length >= 2) {
    const [lng, lat] = place.location.coordinates;
    return { lat: Number(lat), lng: Number(lng) };
  }
  if (place.lat != null && place.lng != null) {
    return { lat: Number(place.lat), lng: Number(place.lng) };
  }
  return null;
}

export function extractStopsFromOrder(order, index = 0) {
  const stops = [];
  const orderId = order?.public_id || order?.publicId || order?.uuid || order?.id || `order-${index}`;
  const payload = order?.payload || order;

  const pickup = payload?.pickup || order?.pickup;
  const dropoff = payload?.dropoff || order?.dropoff;
  const pickupCoords = coordsFromPlace(pickup);
  const dropoffCoords = coordsFromPlace(dropoff);

  if (pickupCoords) {
    stops.push({
      id: `${orderId}-pickup`,
      orderId,
      type: "pickup",
      name: pickup?.name || pickup?.street1 || "Pickup",
      ...pickupCoords,
    });
  }

  const entities = payload?.entities || order?.entities || [];
  if (Array.isArray(entities)) {
    entities.forEach((entity, i) => {
      const place = entity?.destination || entity?.place || entity;
      const c = coordsFromPlace(place);
      if (c) {
        stops.push({
          id: entity?.uuid || entity?.id || `${orderId}-wp-${i}`,
          orderId,
          type: entity?.type || "waypoint",
          name: entity?.name || place?.name || `Stop ${i + 1}`,
          ...c,
        });
      }
    });
  }

  if (dropoffCoords) {
    stops.push({
      id: `${orderId}-dropoff`,
      orderId,
      type: "dropoff",
      name: dropoff?.name || dropoff?.street1 || "Drop-off",
      ...dropoffCoords,
    });
  }

  return stops;
}

export function extractStopsFromOrders(orders = []) {
  return orders.flatMap((order, i) => extractStopsFromOrder(order, i));
}

export function orderPublicIds(orders = []) {
  return orders
    .map((o) => o?.public_id || o?.publicId || o?.uuid || o?.id)
    .filter(Boolean)
    .map(String);
}
