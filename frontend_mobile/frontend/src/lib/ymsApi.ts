import { DeviceEventEmitter } from "react-native";
import { env } from "@/src/lib/env";
import { storage } from "@/src/utils/storage";
import { captureError } from "@/src/services/observability";

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

    if (!res.ok) {
      const message =
        typeof payload?.detail === "string"
          ? payload.detail
          : Array.isArray(payload?.detail)
            ? payload.detail.map((item: any) => item?.msg || String(item)).join(", ")
            : `Request failed (${res.status})`;
      throw new YmsApiError(message, res.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (!(error instanceof YmsApiError)) {
      captureError(error, { operation: "yms.request", path });
    }
    throw error;
  }
}
