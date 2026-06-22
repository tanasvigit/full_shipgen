import { ymsRequest } from "@/src/lib/ymsApi";
import { mapVehicle360Profile, type VehicleJourneyPayload } from "@/src/lib/vehicle360";

export type { Vehicle360Profile, VehicleJourneyEvent, VehicleJourneyStep, VehicleJourneyPayload } from "@/src/lib/vehicle360";
export { buildJourneySteps, mapVehicle360Profile } from "@/src/lib/vehicle360";

export async function fetchVehicleJourney(vehicleId: string) {
  return ymsRequest<VehicleJourneyPayload>(`/vehicles/${vehicleId}/journey`);
}

export async function fetchVehicle360Profile(vehicleId: string) {
  const journey = await fetchVehicleJourney(vehicleId);
  return mapVehicle360Profile(journey);
}
