import { apiClient, unwrapEntity, unwrapList } from "@/lib/api";

export const schedulesService = {
  async listSchedules(params) {
    const response = await apiClient.get("/schedules", { params });
    return unwrapList(response.data, ["schedules"]);
  },
  async listScheduleItems(params) {
    const response = await apiClient.get("/schedule-items", { params });
    return unwrapList(response.data, ["scheduleItems", "schedule_items", "schedule-items"]);
  },
  async createSchedule(payload) {
    const response = await apiClient.post("/schedules", payload);
    return unwrapEntity(response.data, ["schedule"]);
  },
  async createScheduleItem(payload) {
    const body =
      payload?.schedule_item || payload?.scheduleItem ? payload : { schedule_item: payload };
    const response = await apiClient.post("/schedule-items", body);
    return unwrapEntity(response.data, ["scheduleItem", "schedule_item"]);
  },
};
