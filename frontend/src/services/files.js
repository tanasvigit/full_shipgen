import { apiClient, unwrapEntity, unwrapList } from "@/lib/api";

export const filesService = {
  async upload(file, options = {}) {
    const form = new FormData();
    form.append("file", file);
    if (options.type) form.append("type", options.type);
    if (options.path) form.append("path", options.path);

    const response = await apiClient.post("/files/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      loadingMessage: options.loadingMessage || "Uploading…",
      onUploadProgress: options.onProgress,
    });

    return unwrapEntity(response.data, ["file"]);
  },

  async uploadBase64(payload, options = {}) {
    const response = await apiClient.post("/files/uploadBase64", payload, {
      loadingMessage: options.loadingMessage || "Uploading…",
    });
    return unwrapEntity(response.data, ["file"]);
  },

  downloadUrl(fileId) {
    const base = apiClient.defaults.baseURL || "";
    return `${base.replace(/\/$/, "")}/files/download?file=${encodeURIComponent(fileId)}`;
  },

  normalizeFile(raw) {
    if (!raw) return null;
    return {
      id: raw.uuid || raw.id || raw.public_id,
      name: raw.original_filename || raw.filename || raw.name || "File",
      size: Number(raw.file_size || raw.size || 0),
      type: raw.content_type || raw.type || "",
      url: raw.url || raw.path,
      createdAt: raw.created_at,
    };
  },

  normalizeList(list) {
    return (Array.isArray(list) ? list : []).map((f) => this.normalizeFile(f)).filter(Boolean);
  },
};
