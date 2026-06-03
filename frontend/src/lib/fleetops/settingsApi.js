import { apiClient } from "@/lib/api";

const unwrap = (response) => response?.data?.settings ?? response?.data ?? response ?? {};

export const FLEETOPS_SETTINGS_LOADERS = {
  notifications: async () => {
    const res = await apiClient.get("/fleet-ops/settings/notification-settings", { loading: false });
    const data = res?.data ?? {};
    if (data.notificationSettings != null && typeof data.notificationSettings === "object") {
      return data.notificationSettings;
    }
    return {};
  },
  routing: async () => {
    const res = await apiClient.get("/fleet-ops/settings/routing-settings", { loading: false });
    return unwrap(res);
  },
  scheduling: async () => {
    const res = await apiClient.get("/fleet-ops/settings/scheduling-settings", { loading: false });
    return unwrap(res);
  },
  orchestrator: async () => {
    const res = await apiClient.get("/fleet-ops/settings/orchestrator-settings", { loading: false });
    return unwrap(res);
  },
  payments: async () => {
    const res = await apiClient.get("/fleet-ops/settings/customer-payments-config", { loading: false });
    return unwrap(res);
  },
  entityEditing: async () => {
    const res = await apiClient.get("/fleet-ops/settings/entity-editing-settings", { loading: false });
    return unwrap(res);
  },
  navigator: async () => {
    const res = await apiClient.get("/fleet-ops/navigator/get-link-app", { loading: false }).catch(() => ({}));
    return unwrap(res);
  },
  branding: async () => {
    const res = await apiClient.get("/settings/branding", { loading: false, silent: true }).catch(() => null);
    if (!res?.data) return {};
    const brand = res.data.brand || res.data.branding;
    return brand && typeof brand === "object" ? brand : {};
  },
  avatars: async () => {
    const entity = await FLEETOPS_SETTINGS_LOADERS.entityEditing().catch(() => ({}));
    return { avatarsEnabled: entity?.avatars_enabled ?? entity?.avatarsEnabled ?? false };
  },
};

export const FLEETOPS_SETTINGS_SAVERS = {
  notifications: async (notificationSettings) => {
    const res = await apiClient.post("/fleet-ops/settings/notification-settings", {
      notificationSettings,
    });
    const data = res?.data ?? {};
    if (data.status && data.status !== "ok") {
      throw new Error(data.message || "Failed to save notification settings");
    }
    return notificationSettings;
  },
  routing: async (values) => {
    const res = await apiClient.post("/fleet-ops/settings/routing-settings", values);
    return unwrap(res);
  },
  scheduling: async (values) => {
    const res = await apiClient.post("/fleet-ops/settings/scheduling-settings", values);
    return unwrap(res);
  },
  orchestrator: async (values) => {
    const res = await apiClient.post("/fleet-ops/settings/orchestrator-settings", values);
    return unwrap(res);
  },
  payments: async (values) => {
    const res = await apiClient.post("/fleet-ops/settings/customer-payments-config", values);
    return unwrap(res);
  },
  entityEditing: async (values) => {
    const res = await apiClient.post("/fleet-ops/settings/entity-editing-settings", values);
    return unwrap(res);
  },
  navigator: async (values) => {
    const res = await apiClient.post("/fleet-ops/settings/driver-onboard-settings", values);
    return unwrap(res);
  },
  branding: async (values) => {
    const res = await apiClient.post(
      "/settings/branding",
      { brand: values.brand || values },
      { loading: false, silent: true },
    );
    return res?.data?.brand || res?.data || values;
  },
  avatars: async (values) => {
    const res = await apiClient.post("/fleet-ops/settings/entity-editing-settings", {
      avatars_enabled: values.avatarsEnabled,
    });
    return unwrap(res);
  },
};
