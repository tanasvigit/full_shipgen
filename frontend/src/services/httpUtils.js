import { apiClient, authorizedHostRequest, unwrapEntity, unwrapList } from "@/lib/api";

async function requestModuleFirst(method, modulePathSuffix, payload, requestConfig = {}) {
  const path = modulePathSuffix.replace(/^\/+/, "");
  if (method === "get") {
    const { data } = await authorizedHostRequest("get", path, { params: requestConfig.params });
    return data;
  }
  const { data } = await authorizedHostRequest(method, path, { data: payload });
  return data;
}

/** GET list: prefer module mount (storefront/pallet/ledger) then legacy /int/v1 path. */
export async function getListWithFallback(primaryPath, unwrapKeys, modulePathSuffix, requestConfig = {}) {
  if (modulePathSuffix) {
    try {
      const data = await requestModuleFirst("get", modulePathSuffix, null, requestConfig);
      return unwrapList(data, unwrapKeys);
    } catch {
      /* legacy monolith path */
    }
  }
  const { data } = await apiClient.get(primaryPath, requestConfig);
  return unwrapList(data, unwrapKeys);
}

/** GET entity by id with same fallback pattern. */
export async function getEntityWithFallback(primaryPath, unwrapKeys, modulePathSuffix, requestConfig = {}) {
  if (modulePathSuffix) {
    try {
      const data = await requestModuleFirst("get", modulePathSuffix, null, requestConfig);
      return unwrapEntity(data, unwrapKeys);
    } catch {
      /* legacy monolith path */
    }
  }
  const { data } = await apiClient.get(primaryPath, requestConfig);
  return unwrapEntity(data, unwrapKeys);
}

export async function mutateWithFallback(method, primaryPath, payload, modulePathSuffix) {
  if (modulePathSuffix) {
    try {
      return await requestModuleFirst(method, modulePathSuffix, payload);
    } catch {
      /* legacy monolith path */
    }
  }
  const { data } = await apiClient.request({ method, url: primaryPath, data: payload });
  return data;
}
