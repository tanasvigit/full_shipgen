import { apiClient, unwrapEntity } from "@/lib/api";

export const settingsService = {
  async getCompany(id) {
    const response = await apiClient.get(`/companies/${id}`, { loading: false });
    return unwrapEntity(response.data, ["company", "organization"]);
  },

  async updateCompany(id, fields) {
    const body =
      fields?.company != null
        ? fields
        : {
            company: fields,
          };
    const response = await apiClient.patch(`/companies/${id}`, body);
    return unwrapEntity(response.data, ["company", "organization"]);
  },
};
