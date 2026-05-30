import { apiClient, authorizedHostRequest, unwrapEntity, unwrapList } from "@/lib/api";

/** GET list: try primary apiClient path then optional module mount (e.g. ledger/int/v1). */
export async function getListWithFallback(primaryPath, unwrapKeys, modulePathSuffix, requestConfig = {}) {
  try {
    const { data } = await apiClient.get(primaryPath, requestConfig);
    return unwrapList(data, unwrapKeys);
  } catch {
    if (!modulePathSuffix) throw new Error("Resource not found");
    const { data } = await authorizedHostRequest("get", modulePathSuffix.replace(/^\/+/, ""), { params: requestConfig.params });
    return unwrapList(data, unwrapKeys);
  }
}

/** GET entity by id with same fallback pattern. */
export async function getEntityWithFallback(primaryPath, unwrapKeys, modulePathSuffix, requestConfig = {}) {
  try {
    const { data } = await apiClient.get(primaryPath, requestConfig);
    return unwrapEntity(data, unwrapKeys);
  } catch {
    if (!modulePathSuffix) throw new Error("Resource not found");
    const { data } = await authorizedHostRequest("get", modulePathSuffix.replace(/^\/+/, ""), { params: requestConfig.params });
    return unwrapEntity(data, unwrapKeys);
  }
}

export async function mutateWithFallback(method, primaryPath, payload, modulePathSuffix) {
  try {
    const { data } = await apiClient.request({ method, url: primaryPath, data: payload });
    return data;
  } catch {
    if (!modulePathSuffix) throw new Error("Request failed");
    const { data } = await authorizedHostRequest(method, modulePathSuffix.replace(/^\/+/, ""), { data: payload });
    return data;
  }
}
