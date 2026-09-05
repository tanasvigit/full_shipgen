import axios, { getAdapter } from "axios";
import { env } from "@/lib/env";
import { parseApiError } from "@/lib/errors";
import { authStorage, orgStorage } from "@/lib/storage";
import { loadingManager } from "@/services/loading-manager";

function attachLoadingRelease(config) {
  if (config?.loading === false) return config;
  config.__releaseLoading = loadingManager.trackApi({
    message: config?.loadingMessage,
    debounceMs: config?.loadingDebounce,
    minVisibleMs: config?.loadingMinVisible,
    global: config?.loadingGlobal === true,
  });
  return config;
}

function releaseLoading(config) {
  config?.__releaseLoading?.();
}

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  parseApiError(error, fallback);

/** Wall-clock of last successful apiClient response — used by health soft-fail. */
let lastApiSuccessAt = 0;

export function getLastApiSuccessAt() {
  return lastApiSuccessAt;
}

/**
 * Collapse duplicate in-flight GETs (StrictMode remount + health + auth bootstrap)
 * into one network hop through the Vite proxy.
 */
const defaultAdapter = getAdapter(axios.defaults.adapter);
const inflightGets = new Map();

function coalesceGetKey(config) {
  if (config?.coalesce === false) return null;
  const method = String(config?.method || "get").toLowerCase();
  if (method !== "get") return null;
  const url = axios.getUri(config);
  const headers = config.headers || {};
  const auth = headers.Authorization || headers.authorization || "";
  const company = headers["X-Company"] || headers["x-company"] || "";
  return `${url}::${auth}::${company}`;
}

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: env.API_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  adapter: async (config) => {
    const key = coalesceGetKey(config);
    if (!key) {
      return defaultAdapter(config);
    }

    const existing = inflightGets.get(key);
    if (existing) {
      return existing.then(
        (response) => ({ ...response, config, request: response.request }),
        (error) => {
          const next = error && typeof error === "object" ? { ...error, config } : error;
          return Promise.reject(next);
        },
      );
    }

    const pending = defaultAdapter(config).finally(() => {
      if (inflightGets.get(key) === pending) {
        inflightGets.delete(key);
      }
    });
    inflightGets.set(key, pending);
    return pending;
  },
});

apiClient.interceptors.request.use((config) => {
  const auth = authStorage.get();
  const org = orgStorage.get();

  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  if (org?.id || org?.uuid) {
    config.headers["X-Company"] = org.id || org.uuid;
  }

  return attachLoadingRelease(config);
});

apiClient.interceptors.response.use(
  (response) => {
    lastApiSuccessAt = Date.now();
    releaseLoading(response.config);
    loadingManager.reconcileApiTokens();
    return response;
  },
  (error) => {
    releaseLoading(error?.config);
    loadingManager.reconcileApiTokens();
    const config = error?.config || {};
    if (config.silent) {
      return Promise.reject({ ...error, friendlyMessage: getErrorMessage(error) });
    }
    const status = error?.response?.status;
    const url = String(config.url || "");
    const isSessionProbe = url.includes("/users/me") || url.includes("/auth/session") || url.includes("/auth/login");
    if (status === 401 && typeof window !== "undefined" && isSessionProbe) {
      window.dispatchEvent(new CustomEvent("fleetbase:unauthorized"));
    }
    return Promise.reject({ ...error, friendlyMessage: getErrorMessage(error) });
  },
);

export const unwrapList = (payload, candidates = []) => {
  const keys = ["data", "records", "results", ...candidates];
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload)) return payload;
  return [];
};

/** List + pagination meta when API returns Fleetbase-style envelope. */
export const unwrapListPage = (payload, candidates = []) => {
  const rows = unwrapList(payload, candidates);
  const meta = payload?.meta || payload?.pagination || {};
  const total = Number(meta.total ?? payload?.total ?? rows.length);
  const page = Number(meta.current_page ?? meta.page ?? payload?.page ?? 1);
  const perPage = Number(meta.per_page ?? meta.limit ?? payload?.per_page ?? rows.length) || rows.length;
  const lastPage = Number(meta.last_page ?? Math.max(1, Math.ceil(total / perPage)));
  return {
    rows,
    meta: { total, page, perPage, lastPage },
  };
};

export const unwrapEntity = (payload, candidates = []) => {
  const keys = ["data", ...candidates];
  for (const key of keys) {
    if (payload?.[key] && typeof payload[key] === "object") return payload[key];
  }
  if (payload && typeof payload === "object") return payload;
  return null;
};

/** Authorized request relative to API host (alternate module mounts, e.g. ledger/int/v1/... ). */
export const authorizedHostRequest = async (method, absolutePathSuffix, axiosConfig = {}) => {
  const url = `${env.API_HOST}/${String(absolutePathSuffix).replace(/^\/+/, "")}`;
  const auth = authStorage.get();
  const org = orgStorage.get();
  const headers = { Accept: "application/json", ...axiosConfig.headers };
  if (!(axiosConfig.data instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
  if (org?.id || org?.uuid) headers["X-Company"] = org.id || org.uuid;

  const release =
    axiosConfig.loading === false
      ? null
      : loadingManager.trackApi({
          message: axiosConfig.loadingMessage,
          global: axiosConfig.loadingGlobal === true,
        });

  try {
    return await axios({
      method,
      url,
      timeout: env.API_TIMEOUT_MS,
      withCredentials: true,
      headers,
      ...axiosConfig,
    });
  } catch (error) {
    return Promise.reject({ ...error, friendlyMessage: getErrorMessage(error) });
  } finally {
    release?.();
  }
};

export const toApiError = (error, fallback = "Something went wrong. Please try again.") => ({
  status: error?.response?.status || 500,
  message: parseApiError(error, fallback),
  raw: error,
});

export { parseApiError, parseApiFieldErrors, showApiError } from "@/lib/errors";
