import { trackingService } from "@/src/services/trackingService";

export async function uploadOrderLocation(orderId: string, latitude: number, longitude: number) {
  await trackingService.uploadOrderLocation(orderId, latitude, longitude);
}
