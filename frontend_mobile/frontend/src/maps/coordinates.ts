import type { MapCoordinate, TripMapMarker } from "@/src/maps/markers";

export type OrderMapInput = {
  id: string;
  code: string;
  pickup: string;
  dropoff: string;
  pickupCoordinate?: MapCoordinate | null;
  dropoffCoordinate?: MapCoordinate | null;
  driverCoordinate?: MapCoordinate | null;
};

export function tripMarkersFromOrder(order: OrderMapInput) {
  const markers: TripMapMarker[] = [];

  if (order.pickupCoordinate) {
    markers.push({
      id: "pickup",
      coordinate: order.pickupCoordinate,
      title: "Pickup",
      description: order.pickup,
      kind: "pickup",
    });
  }

  if (order.dropoffCoordinate) {
    markers.push({
      id: "dropoff",
      coordinate: order.dropoffCoordinate,
      title: "Dropoff",
      description: order.dropoff,
      kind: "dropoff",
    });
  }

  if (order.driverCoordinate) {
    markers.push({
      id: "driver",
      coordinate: order.driverCoordinate,
      title: "Driver",
      description: order.code,
      kind: "driver",
    });
  }

  if (markers.length === 0) {
    return null;
  }

  const pickup = markers.find((m) => m.kind === "pickup");
  const dropoff = markers.find((m) => m.kind === "dropoff");
  const driver = markers.find((m) => m.kind === "driver");

  const routeWaypoints = markers
    .filter((marker) => marker.kind !== "driver")
    .map((marker) => marker.coordinate);

  return {
    pickup: pickup || markers[0],
    dropoff: dropoff || markers[markers.length - 1],
    driver,
    route: routeWaypoints,
    routeWaypoints,
    /** Unique markers safe to pass directly to TripMap. */
    markers,
  };
}

/** Build a render-safe marker list without duplicate React keys. */
export function listTripMapMarkers(
  model: NonNullable<ReturnType<typeof tripMarkersFromOrder>>
): TripMapMarker[] {
  const seen = new Set<string>();
  const list: TripMapMarker[] = [];
  for (const marker of [model.pickup, model.dropoff, model.driver]) {
    if (!marker || seen.has(marker.id)) continue;
    seen.add(marker.id);
    list.push(marker);
  }
  return list.length > 0 ? list : model.markers;
}

type RouteMapInput = {
  waypoints: { name: string; address: string; coordinate?: MapCoordinate | null; done?: boolean }[];
};

export function tripMarkersFromRoute(route: RouteMapInput) {
  const markers: TripMapMarker[] = route.waypoints
    .map((waypoint, index) => {
      if (!waypoint.coordinate) return null;
      const kind: TripMapMarker["kind"] =
        index === 0 ? "pickup" : index === route.waypoints.length - 1 ? "dropoff" : "waypoint";
      return {
        id: `wp-${index}`,
        coordinate: waypoint.coordinate,
        title: waypoint.name,
        description: waypoint.address,
        kind,
      };
    })
    .filter(Boolean) as TripMapMarker[];

  if (markers.length === 0) return null;

  return {
    pickup: markers[0],
    dropoff: markers[markers.length - 1],
    driver: undefined,
    route: markers.map((marker) => marker.coordinate),
    routeWaypoints: markers.map((marker) => marker.coordinate),
    markers,
  };
}
