import { authorizedHostRequest, unwrapEntity, unwrapList } from "@/lib/api";
import { env } from "@/lib/env";

const registryPath = (suffix) =>
  `${env.MODULE_ROOT_REGISTRY}/${String(suffix).replace(/^\/+/, "")}`;

async function registryGet(pathSuffix, params) {
  const { data } = await authorizedHostRequest("get", registryPath(pathSuffix), { params });
  return data;
}

async function registryMutate(method, pathSuffix, payload) {
  const { data } = await authorizedHostRequest(method, registryPath(pathSuffix), { data: payload });
  return data;
}

export const registryService = {
  async listExtensions(params) {
    const data = await registryGet("registry-extensions", params);
    return unwrapList(data, ["registry_extensions", "registry-extensions", "extensions"]);
  },

  async getExtension(id) {
    const data = await registryGet(`registry-extensions/${id}`);
    return unwrapEntity(data, ["registry_extension", "registry-extension", "extension"]);
  },

  async listInstalled() {
    const data = await registryGet("registry-extensions/installed");
    return unwrapList(data, ["registry_extensions", "registry-extensions", "extensions", "installed"]);
  },

  async listCategories() {
    const data = await registryGet("categories");
    const list = unwrapList(data, ["categories"]);
    return list.length ? list : data?.categories || [];
  },

  async installExtension(extensionPublicId) {
    return registryMutate("post", "installer/install", { extension: extensionPublicId });
  },

  async uninstallExtension(extensionPublicId) {
    return registryMutate("post", "installer/uninstall", { extension: extensionPublicId });
  },

  async createExtension(payload) {
    const data = await registryMutate("post", "registry-extensions", payload);
    return unwrapEntity(data, ["registry_extension", "registry-extension", "extension"]);
  },

  async submitExtension(id) {
    const data = await registryMutate("post", `registry-extensions/${id}/submit`, {});
    return unwrapEntity(data, ["registry_extension", "registry-extension", "extension"]);
  },
};
