import { apiClient, unwrapEntity, unwrapList, unwrapListPage } from "@/lib/api";
import { resolveIamUserUuid } from "@/lib/iam/userIds";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const iamService = {
  async listUsers(params = {}) {
    const { rows } = await this.listUsersPage(params);
    return rows;
  },

  async listUsersPage(params = {}) {
    const response = await apiClient.get("/users", { params, loading: false });
    return unwrapListPage(response.data, ["users"]);
  },

  async getUser(id) {
    const response = await apiClient.get(`/users/${id}`);
    return unwrapEntity(response.data, ["user"]);
  },

  async createUser(payload) {
    const response = await apiClient.post("/users", payload);
    return unwrapEntity(response.data, ["user"]);
  },

  async inviteUser({ email, name, role_uuid }) {
    const response = await apiClient.post("/users/invite-user", {
      user: {
        email,
        name: name || email.split("@")[0],
        role_uuid: role_uuid || undefined,
      },
    });
    return response.data;
  },

  async updateUser(id, userFields) {
    const body =
      userFields?.user != null
        ? userFields
        : {
            user: userFields,
          };
    const response = await apiClient.patch(`/users/${id}`, body);
    return unwrapEntity(response.data, ["user"]);
  },

  async deactivateUser(id) {
    const response = await apiClient.patch(`/users/deactivate/${id}`);
    return response.data;
  },

  async activateUser(id) {
    const response = await apiClient.patch(`/users/activate/${id}`);
    return response.data;
  },

  async verifyUser(id) {
    const response = await apiClient.patch(`/users/verify/${id}`);
    return response.data;
  },

  async resendInvite(userId) {
    const response = await apiClient.post("/users/resend-invite", { user: userId });
    return response.data;
  },

  async changeUserPassword({ userId, user, password, password_confirmation, send_credentials = false }) {
    const uuid = userId || resolveIamUserUuid(user);
    if (!uuid) {
      return Promise.reject({ friendlyMessage: "User identifier is missing." });
    }
    const response = await apiClient.post("/auth/change-user-password", {
      user: uuid,
      password,
      password_confirmation,
      send_credentials,
    });
    return response.data;
  },

  async removeFromCompany(id) {
    const response = await apiClient.delete(`/users/remove-from-company/${id}`);
    return response.data;
  },

  async bulkDeleteUsers(ids) {
    const response = await apiClient.delete("/users/bulk-delete", { data: { ids } });
    return response.data;
  },

  async bulkDeleteRoles(ids) {
    const response = await apiClient.delete("/roles/bulk-delete", { data: { ids } });
    return response.data;
  },

  async bulkDeleteGroups(ids) {
    const response = await apiClient.delete("/groups/bulk-delete", { data: { ids } });
    return response.data;
  },

  async bulkDeletePolicies(ids) {
    const response = await apiClient.delete("/policies/bulk-delete", { data: { ids } });
    return response.data;
  },

  async exportUsers({ selections = [], format = "xlsx" } = {}) {
    const params = { format, selections };
    let response;
    try {
      response = await apiClient.get("/users/export", {
        params,
        responseType: "blob",
        loading: false,
      });
    } catch {
      response = await apiClient.post("/users/export", params, {
        responseType: "blob",
        loading: false,
      });
    }
    const ext = format === "csv" ? "csv" : "xlsx";
    const filename = `users-${new Date().toISOString().slice(0, 10)}.${ext}`;
    triggerDownload(response.data, filename);
    return response.data;
  },

  async listRoles(params = {}) {
    const { rows } = await this.listRolesPage(params);
    return rows;
  },

  async listRolesPage(params = {}) {
    const response = await apiClient.get("/roles", { params, loading: false });
    return unwrapListPage(response.data, ["roles"]);
  },

  async createRole(payload) {
    const body = payload?.role != null ? payload : { role: payload };
    const response = await apiClient.post("/roles", body);
    return unwrapEntity(response.data, ["role"]);
  },

  async deleteRole(id) {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  },

  async exportRoles({ selections = [], format = "xlsx" } = {}) {
    const params = { format, selections };
    let response;
    try {
      response = await apiClient.get("/roles/export", {
        params,
        responseType: "blob",
        loading: false,
      });
    } catch {
      response = await apiClient.post("/roles/export", params, {
        responseType: "blob",
        loading: false,
      });
    }
    const ext = format === "csv" ? "csv" : "xlsx";
    const filename = `roles-${new Date().toISOString().slice(0, 10)}.${ext}`;
    triggerDownload(response.data, filename);
    return response.data;
  },

  async getAuthServices() {
    const response = await apiClient.get("/auth/services", { loading: false });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.services)) return data.services;
    return unwrapList(data, ["services"]);
  },

  async listPolicies(params = {}) {
    const { rows } = await this.listPoliciesPage({
      limit: 100,
      sort: "name",
      ...params,
    });
    return rows;
  },

  async listPoliciesPage(params = {}) {
    const response = await apiClient.get("/policies", { params, loading: false });
    return unwrapListPage(response.data, ["policies"]);
  },

  async getPolicy(id) {
    const response = await apiClient.get(`/policies/${id}`);
    return unwrapEntity(response.data, ["policy"]);
  },

  async createPolicy(payload) {
    const body = payload?.policy != null ? payload : { policy: payload };
    const response = await apiClient.post("/policies", body);
    return unwrapEntity(response.data, ["policy"]);
  },

  async updatePolicy(id, payload) {
    const body = payload?.policy != null ? payload : { policy: payload };
    const response = await apiClient.patch(`/policies/${id}`, body);
    return unwrapEntity(response.data, ["policy"]);
  },

  async deletePolicy(id) {
    const response = await apiClient.delete(`/policies/${id}`);
    return response.data;
  },

  async exportPolicies({ selections = [], format = "xlsx" } = {}) {
    const params = { format, selections };
    let response;
    try {
      response = await apiClient.get("/policies/export", {
        params,
        responseType: "blob",
        loading: false,
      });
    } catch {
      response = await apiClient.post("/policies/export", params, {
        responseType: "blob",
        loading: false,
      });
    }
    const ext = format === "csv" ? "csv" : "xlsx";
    const filename = `policies-${new Date().toISOString().slice(0, 10)}.${ext}`;
    triggerDownload(response.data, filename);
    return response.data;
  },

  async listPermissions() {
    const response = await apiClient.get("/permissions");
    return unwrapList(response.data, ["permissions"]);
  },

  async listGroups(params = {}) {
    const { rows } = await this.listGroupsPage(params);
    return rows;
  },

  async listGroupsPage(params = {}) {
    const response = await apiClient.get("/groups", { params, loading: false });
    return unwrapListPage(response.data, ["groups"]);
  },

  async createGroup(payload) {
    const body = payload?.group != null ? payload : { group: payload };
    const response = await apiClient.post("/groups", body);
    return unwrapEntity(response.data, ["group"]);
  },

  async deleteGroup(id) {
    const response = await apiClient.delete(`/groups/${id}`);
    return response.data;
  },

  async exportGroups({ selections = [], format = "xlsx" } = {}) {
    const params = { format, selections };
    let response;
    try {
      response = await apiClient.get("/groups/export", {
        params,
        responseType: "blob",
        loading: false,
      });
    } catch {
      response = await apiClient.post("/groups/export", params, {
        responseType: "blob",
        loading: false,
      });
    }
    const ext = format === "csv" ? "csv" : "xlsx";
    const filename = `groups-${new Date().toISOString().slice(0, 10)}.${ext}`;
    triggerDownload(response.data, filename);
    return response.data;
  },

  async getRole(id) {
    const response = await apiClient.get(`/roles/${id}`);
    return unwrapEntity(response.data, ["role"]);
  },

  async updateRole(id, payload) {
    const body = payload?.role != null ? payload : { role: payload };
    const response = await apiClient.patch(`/roles/${id}`, body);
    return unwrapEntity(response.data, ["role"]);
  },

  async getGroup(id) {
    const response = await apiClient.get(`/groups/${id}`);
    return unwrapEntity(response.data, ["group"]);
  },

  async updateGroup(id, payload) {
    const body = payload?.group != null ? payload : { group: payload };
    const response = await apiClient.patch(`/groups/${id}`, body);
    return unwrapEntity(response.data, ["group"]);
  },

  /** Sync members via `group.users` UUID array (Ember group.save parity). */
  async syncGroupMembers(groupId, userIds) {
    return this.updateGroup(groupId, { users: userIds.map(String) });
  },

  async addGroupMembers(groupId, userIds) {
    const raw = await this.getGroup(groupId);
    const existing = (raw?.users || []).map((u) => String(u.uuid || u.id)).filter(Boolean);
    const merged = [...new Set([...existing, ...userIds.map(String)])];
    return this.syncGroupMembers(groupId, merged);
  },

  async removeGroupMember(groupId, userId) {
    const raw = await this.getGroup(groupId);
    const remaining = (raw?.users || [])
      .map((u) => String(u.uuid || u.id))
      .filter((id) => id && id !== String(userId));
    return this.syncGroupMembers(groupId, remaining);
  },

  async removeGroupMembers(groupId, userIds) {
    const removeSet = new Set(userIds.map(String));
    const raw = await this.getGroup(groupId);
    const remaining = (raw?.users || [])
      .map((u) => String(u.uuid || u.id))
      .filter((id) => id && !removeSet.has(id));
    return this.syncGroupMembers(groupId, remaining);
  },

  /** GET /metrics/iam — dashboard IAM metrics widget (Ember iam-metrics-widget). */
  async getIamMetrics() {
    const response = await apiClient.get("/metrics/iam", { loading: false });
    const body = response.data;
    if (body && typeof body === "object" && !Array.isArray(body)) {
      if (body.metrics && typeof body.metrics === "object") return body.metrics;
      return body;
    }
    return {};
  },
};
