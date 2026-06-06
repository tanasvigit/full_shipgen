import { apiRequest, unwrapList } from "@/src/lib/api";

export const geofenceService = {
  async getDriverHistory(driverUuid: string) {
    const payload = await apiRequest(`/geofences/driver/${encodeURIComponent(driverUuid)}/history`);
    return unwrapList(payload, ["data", "events", "history"]);
  },

  async getEvents(params?: { driver_uuid?: string; from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (params?.driver_uuid) query.set("driver_uuid", params.driver_uuid);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const payload = await apiRequest(`/geofences/events${suffix}`);
    return unwrapList(payload, ["data", "events"]);
  },
};
