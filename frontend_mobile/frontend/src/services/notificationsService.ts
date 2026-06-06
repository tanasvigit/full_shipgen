import { apiRequest } from "@/src/lib/api";

export const notificationsService = {
  async markAllRead() {
    return apiRequest("/notifications/mark-all-read", { method: "PUT" });
  },

  async markAsRead(notificationId: string) {
    return apiRequest("/notifications/mark-as-read", {
      method: "PUT",
      body: { notification: notificationId },
    });
  },
};
