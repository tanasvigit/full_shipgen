import { apiClient, unwrapEntity, unwrapList } from "@/lib/api";

const mapCredentialLabels = ["api_credentials", "apiCredentials"];

export const developersService = {
  async listApiCredentials(params) {
    const response = await apiClient.get("/api-credentials", { params });
    return unwrapList(response.data, mapCredentialLabels);
  },
  async createApiCredential(payload) {
    const response = await apiClient.post("/api-credentials", payload);
    return unwrapEntity(response.data, ["api_credential", "apiCredential"]);
  },
  async rollApiCredential(id) {
    const response = await apiClient.patch(`/api-credentials/roll/${id}`, {});
    return unwrapEntity(response.data, ["api_credential", "apiCredential"]);
  },
  async deleteApiCredential(id) {
    await apiClient.delete(`/api-credentials/${id}`);
  },
  async listWebhooks(params) {
    const response = await apiClient.get("/webhook-endpoints", { params });
    return unwrapList(response.data, ["webhook_endpoints", "webhookEndpoints", "webhooks"]);
  },
  async getWebhook(id) {
    const response = await apiClient.get(`/webhook-endpoints/${id}`);
    return unwrapEntity(response.data, ["webhook_endpoint", "webhookEndpoint", "webhook"]);
  },
  async createWebhook(payload) {
    const response = await apiClient.post("/webhook-endpoints", payload);
    return unwrapEntity(response.data, ["webhook_endpoint", "webhookEndpoint"]);
  },
  async updateWebhook(id, payload) {
    const response = await apiClient.patch(`/webhook-endpoints/${id}`, payload);
    return unwrapEntity(response.data, ["webhook_endpoint", "webhookEndpoint"]);
  },
  async enableWebhook(id) {
    await apiClient.patch(`/webhook-endpoints/enable/${id}`, {});
  },
  async disableWebhook(id) {
    await apiClient.patch(`/webhook-endpoints/disable/${id}`, {});
  },
  async listWebhookRequestLogs(params) {
    const response = await apiClient.get("/webhook-request-logs", { params });
    return unwrapList(response.data, ["webhook_request_logs", "webhookRequestLogs", "logs"]);
  },
  async listChatChannels(params) {
    const response = await apiClient.get("/chat-channels", { params });
    return unwrapList(response.data, ["chat_channels", "chatChannels", "channels"]);
  },
  async listWebhookEvents() {
    const response = await apiClient.get("/webhook-endpoints/events");
    return unwrapList(response.data, ["events"]);
  },
  async listApiRequestLogs(params) {
    const response = await apiClient.get("/api-request-logs", { params });
    return unwrapList(response.data, ["api_request_logs", "logs", "apiRequestLogs"]);
  },
  async listApiEvents(params) {
    const response = await apiClient.get("/api-events", { params });
    return unwrapList(response.data, ["api_events", "events", "apiEvents"]);
  },
};
