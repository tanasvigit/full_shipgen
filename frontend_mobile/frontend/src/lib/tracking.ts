import { trackingService } from "@/src/services/trackingService";

export async function uploadDriverLocation(driverId: string, latitude: number, longitude: number) {
  await trackingService.uploadDriverLocation(driverId, latitude, longitude);
}
