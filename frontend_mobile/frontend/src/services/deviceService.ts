import { Platform } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { logEvent } from "@/src/services/observability";

export const deviceService = {
  async registerPushToken(token: string) {
    if (!token) return null;
    const body = { token, platform: Platform.OS, os: Platform.OS };
    try {
      return await apiRequest("/user-devices/register", { method: "POST", body });
    } catch (error: unknown) {
      if ((error as { status?: number })?.status === 404) {
        return apiRequest("/user-devices", { method: "POST", body: { user_device: body } });
      }
      throw error;
    }
  },

  /** Best-effort push registration when expo-notifications is available. */
  async registerCurrentDevice() {
    try {
      const Notifications = await import("expo-notifications");
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        logEvent("device.push.permission_denied");
        return null;
      }
      const pushToken = await Notifications.getExpoPushTokenAsync();
      const token = pushToken?.data;
      if (!token) return null;
      await this.registerPushToken(token);
      logEvent("device.push.registered");
      return token;
    } catch {
      logEvent("device.push.unavailable");
      return null;
    }
  },
};
