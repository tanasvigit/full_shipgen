import { apiRequest, unwrapList } from "@/src/lib/api";

export const scheduleService = {
  async getScheduleItems(driverId: string, params?: { start_at?: string; end_at?: string }) {
    const query = new URLSearchParams();
    if (params?.start_at) query.set("start_at", params.start_at);
    if (params?.end_at) query.set("end_at", params.end_at);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const payload = await apiRequest(`/drivers/${encodeURIComponent(driverId)}/schedule-items${suffix}`);
    return unwrapList(payload, ["data", "schedule_items"]);
  },

  async getActiveShift(driverId: string) {
    const payload = await apiRequest(`/drivers/${encodeURIComponent(driverId)}/active-shift`);
    return payload?.data ?? payload;
  },

  async getHosStatus(driverId: string) {
    return apiRequest(`/drivers/${encodeURIComponent(driverId)}/hos-status`);
  },
};
