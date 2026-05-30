import { apiClient, unwrapList } from "@/lib/api";

export const consoleService = {
  async listNotifications(params) {
    const response = await apiClient.get("/notifications", { params });
    return unwrapList(response.data, ["notifications"]);
  },
  async markAllNotificationsRead() {
    await apiClient.put("/notifications/mark-all-read", {});
  },
  async markNotificationRead(ids = []) {
    await apiClient.put("/notifications/mark-as-read", { ids });
  },
};
