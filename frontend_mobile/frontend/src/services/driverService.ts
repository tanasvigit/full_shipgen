import { apiRequest, unwrapEntity } from "@/src/lib/api";

export const driverService = {
  async getById(driverId: string) {
    const payload = await apiRequest(`/drivers/${encodeURIComponent(driverId)}`);
    return unwrapEntity(payload, ["driver"]);
  },
  async uploadLocation(driverId: string, latitude: number, longitude: number, extras?: { altitude?: number; heading?: number; speed?: number }) {
    const id = String(driverId);
    const body = {
      latitude,
      longitude,
      lat: latitude,
      lng: longitude,
      ...extras,
    };
    let lastError: unknown = null;

    for (const method of ["POST", "PATCH"] as const) {
      try {
        await apiRequest(`/drivers/${encodeURIComponent(id)}/track`, { method, body });
        return;
      } catch (error: unknown) {
        lastError = error;
        if ((error as { status?: number })?.status !== 404) {
          throw error;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Driver location upload failed");
  },

  async toggleOnline(driverId: string, online?: boolean) {
    const id = String(driverId);
    return apiRequest(`/drivers/${encodeURIComponent(id)}/toggle-online`, {
      method: "POST",
      body: online === undefined ? {} : { online },
    });
  },
};
