import type { TripMapMarker } from "@/src/maps/markers";
import { placeCoordinate } from "@/src/lib/placeCoordinates";
import { resolveEntityId } from "@/src/lib/vehicleMapper";
import type { DriverDTO } from "@/src/types/api/fleet";

export type LiveDriverPin = {
  id: string;
  name: string;
  status: string;
  coordinate: TripMapMarker["coordinate"];
};

export function mapLiveDriverPins(drivers: DriverDTO[]): LiveDriverPin[] {
  return drivers
    .map((driver) => {
      const coordinate = placeCoordinate(driver.location);
      if (!coordinate) return null;
      return {
        id: resolveEntityId(driver),
        name: driver.name || "Driver",
        status: driver.online ? "online" : String(driver.status || "offline"),
        coordinate,
      };
    })
    .filter(Boolean) as LiveDriverPin[];
}

export function liveDriversToMapMarkers(pins: LiveDriverPin[]): TripMapMarker[] {
  return pins.map((pin) => ({
    id: pin.id,
    coordinate: pin.coordinate,
    title: pin.name,
    description: pin.status,
    kind: "driver" as const,
  }));
}
