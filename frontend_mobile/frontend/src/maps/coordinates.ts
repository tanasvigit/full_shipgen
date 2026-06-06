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

  const route = markers.map((m) => m.coordinate);

  return {
    pickup: pickup || markers[0],
    dropoff: dropoff || markers[markers.length - 1],
    driver: driver || markers[0],
    route,
  };
}
