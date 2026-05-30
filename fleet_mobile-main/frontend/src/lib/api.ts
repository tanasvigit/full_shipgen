import { storage } from "@/src/utils/storage";
import { DeviceEventEmitter } from "react-native";
import { captureError, logApiTiming, logEvent } from "@/src/services/observability";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.0.171:8000/int/v1").replace(/\/$/, "");
const AUTH_STORAGE_KEY = "fleet_mobile.auth";
const ORG_STORAGE_KEY = "fleet_mobile.org";

export type AuthSession = {
  token: string | null;
  requiresTwoFactor?: boolean;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

export { unwrapEntity, unwrapList } from "@/src/lib/apiUnwrap";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status = 500, payload: unknown = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function getStoredSession() {
  return storage.secureGet<AuthSession | null>(AUTH_STORAGE_KEY, null);
}

export async function setStoredSession(session: AuthSession | null) {
  if (!session) {
    await storage.secureRemove(AUTH_STORAGE_KEY);
    return;
  }
  await storage.secureSet(AUTH_STORAGE_KEY, session);
}

export async function getStoredOrganization() {
  return storage.getItem<{ id?: string; uuid?: string } | null>(ORG_STORAGE_KEY, null);
}

export async function setStoredOrganization(org: { id?: string; uuid?: string } | null) {
  if (!org) {
    await storage.removeItem(ORG_STORAGE_KEY);
    return;
  }
  await storage.setItem(ORG_STORAGE_KEY, org);
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload: any) {
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) return String(payload.errors[0]);
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.message === "string") return payload.message;
  return "Unexpected API error";
}

/** Permission denial (401/403) — not an expired/invalid session. */
export function isPermissionDenied(status: number, payload: unknown) {
  if (status !== 401 && status !== 403) return false;
  const message = getErrorMessage(payload).toLowerCase();
  if (message.includes("not authorized") || message.includes("unauthorized to")) return true;
  if (message.includes("there is nothing to see here")) return true;
  return false;
}

function isAuthFailure(status: number, path: string, payload: unknown) {
  if (status !== 401) return false;
  if (isPermissionDenied(status, payload)) return false;
  if (path.startsWith("/auth/") || path === "/users/me") return true;
  const message = getErrorMessage(payload).toLowerCase();
  return (
    message.includes("unauthenticated") ||
    message.includes("invalid token") ||
    message.includes("token expired") ||
    message.includes("not authenticated")
  );
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth !== false;
  const session = useAuth ? await getStoredSession() : null;
  const org = useAuth ? await getStoredOrganization() : null;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  if (org?.id || org?.uuid) {
    headers["X-Company"] = org.id || org.uuid || "";
  }

  const method = options.method ?? "GET";
  const startedAt = Date.now();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseJsonSafe(response);
  logApiTiming(path, method, Date.now() - startedAt, response.status);

  if (!response.ok) {
    const permissionDenied = isPermissionDenied(response.status, payload);
    if (permissionDenied) {
      logEvent("api.permission_denied", { path, method, status: response.status });
    } else {
      logEvent("api.error", { path, method, status: response.status });
    }
    if (isAuthFailure(response.status, path, payload)) {
      await setStoredSession(null);
      await setStoredOrganization(null);
      DeviceEventEmitter.emit("fleetbase:unauthorized");
      captureError(payload, {
        operation: "api.request",
        path,
        method,
        status: response.status,
      });
    }
    throw new ApiError(getErrorMessage(payload), response.status, payload);
  }

  logEvent("api.success", { path, method, status: response.status });
  return payload as T;
}
