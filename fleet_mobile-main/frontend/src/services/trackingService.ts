import { apiRequest } from "@/src/lib/api";
import type { TrackingUploadRequestDTO } from "@/src/types/api/orders";

export const trackingService = {
  async uploadOrderLocation(orderId: string, latitude: number, longitude: number) {
    const id = String(orderId);
    const body: TrackingUploadRequestDTO = { latitude, longitude, lat: latitude, lng: longitude };
    let lastError: unknown = null;

    for (const method of ["POST", "PATCH"] as const) {
      try {
        await apiRequest(`/orders/${id}/track`, { method, body });
        return;
      } catch (error: unknown) {
        lastError = error;
        if ((error as { status?: number })?.status !== 404) {
          throw error;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Tracking upload failed");
  },
};

