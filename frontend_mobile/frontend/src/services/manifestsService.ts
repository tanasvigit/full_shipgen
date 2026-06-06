import { apiRequest, unwrapEntity, unwrapList } from "@/src/lib/api";

export const manifestsService = {
  async list(params?: { driver_id?: string; limit?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.driver_id) query.set("driver_id", params.driver_id);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const payload = await apiRequest(`/fleet-ops/manifests${suffix}`);
    return unwrapList(payload, ["manifests", "data"]);
  },

  async getById(id: string) {
    const payload = await apiRequest(`/fleet-ops/manifests/${encodeURIComponent(id)}`);
    return unwrapEntity(payload, ["manifest"]);
  },

  async updateStop(stopId: string, body: { status: string; actual_arrival?: string }) {
    const payload = await apiRequest(`/fleet-ops/manifest-stops/${encodeURIComponent(stopId)}`, {
      method: "PATCH",
      body: { manifest_stop: body },
    });
    return unwrapEntity(payload, ["stop", "manifest_stop"]);
  },
};
