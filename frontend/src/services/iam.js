import { apiClient, unwrapEntity, unwrapList } from "@/lib/api";

export const iamService = {
  async listUsers() {
    const response = await apiClient.get("/users");
    return unwrapList(response.data, ["users"]);
  },
  async getUser(id) {
    const response = await apiClient.get(`/users/${id}`);
    return unwrapEntity(response.data, ["user"]);
  },
  async inviteUser(payload) {
    const response = await apiClient.post("/users/invite-user", payload);
    return unwrapEntity(response.data, ["user"]);
  },
  async updateUser(id, payload) {
    const response = await apiClient.patch(`/users/${id}`, payload);
    return unwrapEntity(response.data, ["user"]);
  },
  async listRoles() {
    const response = await apiClient.get("/roles");
    return unwrapList(response.data, ["roles"]);
  },
  async createRole(payload) {
    const response = await apiClient.post("/roles", payload);
    return unwrapEntity(response.data, ["role"]);
  },
  async listPermissions() {
    const response = await apiClient.get("/permissions");
    return unwrapList(response.data, ["permissions"]);
  },
  async listGroups() {
    const response = await apiClient.get("/groups");
    return unwrapList(response.data, ["groups"]);
  },
  async createGroup(payload) {
    const response = await apiClient.post("/groups", payload);
    return unwrapEntity(response.data, ["group"]);
  },
  async getRole(id) {
    const response = await apiClient.get(`/roles/${id}`);
    return unwrapEntity(response.data, ["role"]);
  },
  async updateRole(id, payload) {
    const response = await apiClient.patch(`/roles/${id}`, payload);
    return unwrapEntity(response.data, ["role"]);
  },
  async getGroup(id) {
    const response = await apiClient.get(`/groups/${id}`);
    return unwrapEntity(response.data, ["group"]);
  },
  async updateGroup(id, payload) {
    const response = await apiClient.patch(`/groups/${id}`, payload);
    return unwrapEntity(response.data, ["group"]);
  },
};
