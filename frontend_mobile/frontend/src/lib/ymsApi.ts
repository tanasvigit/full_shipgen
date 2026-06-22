import { DeviceEventEmitter } from "react-native";
import { env } from "@/src/lib/env";
import { storage } from "@/src/utils/storage";
import { captureError, logDebug, logEvent, logYmsTiming, mobileDebugEnabled } from "@/src/services/observability";

const YARD_AUTH_KEY = "fleet_mobile.yard.auth";

export type YardSession = {
  accessToken: string;
  refreshToken: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export class YmsApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status = 500, payload: unknown = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function getStoredYardSession() {
  return storage.secureGet<YardSession | null>(YARD_AUTH_KEY, null);
}

export async function setStoredYardSession(session: YardSession | null) {
  if (!session) {
    await storage.secureRemove(YARD_AUTH_KEY);
    return;
  }
  await storage.secureSet(YARD_AUTH_KEY, session);
}

async function refreshYardSession(refreshToken: string) {
  const res = await fetch(`${env.YMS_API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const text = await res.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }
  if (!res.ok) {
    throw new YmsApiError(payload?.detail || "Yard session expired", res.status, payload);
  }
  const session = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
  };
  await setStoredYardSession(session);
  return session;
}

export async function ymsRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let session = auth ? await getStoredYardSession() : null;
  if (auth && session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const url = `${env.YMS_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const startedAt = Date.now();

  if (mobileDebugEnabled) {
    logDebug("yms.request.start", {
      method,
      path,
      auth,
      body: body === undefined ? undefined : redactYmsBody(body),
    });
  }

  const execute = async (token?: string) => {
    const reqHeaders = { ...headers };
    if (token) reqHeaders.Authorization = `Bearer ${token}`;
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let payload: any = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { detail: text };
      }
    }
    return { res, payload };
  };

  try {
    let { res, payload } = await execute(session?.accessToken);

    if (res.status === 401 && auth && session?.refreshToken) {
      logEvent("yms.auth.refresh", { path });
      try {
        session = await refreshYardSession(session.refreshToken);
        ({ res, payload } = await execute(session.accessToken));
      } catch (error) {
        await setStoredYardSession(null);
        DeviceEventEmitter.emit("shipgen:yard-unauthorized");
        throw error;
      }
    }

    if (res.status === 401 && auth) {
      await setStoredYardSession(null);
      DeviceEventEmitter.emit("shipgen:yard-unauthorized");
    }

    logYmsTiming(path, method, Date.now() - startedAt, res.status);

    if (!res.ok) {
      const message =
        typeof payload?.detail === "string"
          ? payload.detail
          : Array.isArray(payload?.detail)
            ? payload.detail.map((item: any) => item?.msg || String(item)).join(", ")
            : `Request failed (${res.status})`;
      logEvent("yms.error", { path, method, status: res.status, message });
      throw new YmsApiError(message, res.status, payload);
    }

    logEvent("yms.success", { path, method, status: res.status });
    if (mobileDebugEnabled) {
      logDebug("yms.response", { path, method, status: res.status, payload: summarizeYmsPayload(payload) });
    }

    return payload as T;
  } catch (error) {
    if (!(error instanceof YmsApiError)) {
      logEvent("yms.network_error", {
        path,
        method,
        message: error instanceof Error ? error.message : String(error),
      });
      captureError(error, { operation: "yms.request", path });
    }
    throw error;
  }
}

function redactYmsBody(body: unknown) {
  if (!body || typeof body !== "object") return body;
  const record = { ...(body as Record<string, unknown>) };
  if ("password" in record) record.password = "***";
  if ("refresh_token" in record) record.refresh_token = "***";
  return record;
}

function summarizeYmsPayload(payload: unknown) {
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) return { type: "array", length: payload.length };
  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) return { type: "paginated", total: record.total, count: record.items.length };
    if (Array.isArray(record.records)) return { type: "bundle", count: record.records.length };
    return { type: "object", keys: Object.keys(record).slice(0, 12) };
  }
  return payload;
}
