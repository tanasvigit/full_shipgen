import { apiClient, getLastApiSuccessAt } from "@/lib/api";
import { env } from "@/lib/env";
import { fleetopsRealtimeManager } from "@/domain/fleetops/realtime/registry";
import { parseApiError } from "@/lib/errors";

/**
 * Single lightweight probe — avoid stacking /settings/branding + /users/me on startup
 * when auth bootstrap and PlatformContext already hit related /int/v1 paths.
 * Congestion through the Vite proxy otherwise causes 6–20s hangs → false degraded banner.
 */
const HEALTH_PROBE_PATH = "/settings/platform";
const HEALTH_TIMEOUT_MS = 5000;
/** If auth/API traffic succeeded recently, treat probe timeout as congestion not outage. */
const RECENT_SUCCESS_MS = 20000;

const silentRequest = {
  loading: false,
  timeout: HEALTH_TIMEOUT_MS,
  silent: true,
  validateStatus: () => true,
};

function isTimeoutOrAbort(err) {
  const code = err?.code || err?.name || "";
  const message = String(err?.message || err?.friendlyMessage || "");
  return (
    code === "ECONNABORTED" ||
    code === "ERR_CANCELED" ||
    code === "CanceledError" ||
    code === "AbortError" ||
    /timeout|aborted|canceled|cancelled/i.test(message)
  );
}

/**
 * Probe API reachability without throwing or spamming the console.
 * 5xx on a probe path → degraded (server up, endpoint unhealthy).
 * Network failure → unreachable (unless recent successful API traffic).
 */
export async function checkApiHealth() {
  const started = Date.now();
  const path = HEALTH_PROBE_PATH;

  try {
    const response = await apiClient.get(path, silentRequest);
    const status = response?.status ?? 0;
    const latencyMs = Date.now() - started;

    if (status >= 200 && status < 400) {
      return {
        ok: true,
        degraded: false,
        latencyMs,
        url: `${env.API_BASE_URL}${path}`,
        status,
        probe: path,
        settings: null,
      };
    }

    // 4xx means the API answered — connectivity is fine.
    if (status >= 400 && status < 500) {
      return {
        ok: true,
        degraded: false,
        latencyMs,
        url: `${env.API_BASE_URL}${path}`,
        status,
        probe: path,
        settings: null,
      };
    }

    if (status >= 500) {
      return {
        ok: false,
        degraded: true,
        latencyMs,
        url: `${env.API_BASE_URL}${path}`,
        status,
        error: `HTTP ${status} on ${path}`,
        settings: null,
      };
    }
  } catch (err) {
    const latencyMs = Date.now() - started;
    const recentOk = Date.now() - getLastApiSuccessAt() < RECENT_SUCCESS_MS;

    // Vite proxy queues under load; auth bootstrap may have just succeeded.
    if (isTimeoutOrAbort(err) && recentOk) {
      return {
        ok: true,
        degraded: false,
        latencyMs,
        url: `${env.API_BASE_URL}${path}`,
        status: 0,
        probe: "recent-success",
        settings: null,
      };
    }

    return {
      ok: false,
      degraded: true,
      latencyMs,
      url: env.API_BASE_URL,
      error: parseApiError(err, "API unreachable"),
      settings: null,
    };
  }

  return {
    ok: false,
    degraded: true,
    latencyMs: Date.now() - started,
    url: env.API_BASE_URL,
    error: "API unreachable",
    settings: null,
  };
}

export function getWebsocketHealth() {
  const state = fleetopsRealtimeManager.getStatus?.() ?? "unknown";
  return {
    ok: state === "connected",
    state: state || "unknown",
    // idle/connecting/unknown are normal before FleetOps realtime starts — not degraded.
    degraded: state === "degraded" || state === "disconnected",
  };
}

export async function runPlatformHealthCheck() {
  try {
    const [api, websocket] = await Promise.all([
      checkApiHealth(),
      Promise.resolve(getWebsocketHealth()),
    ]);
    const healthy = Boolean(api.ok) && !api.degraded;
    return {
      api,
      websocket,
      checkedAt: new Date().toISOString(),
      healthy,
      degraded: !healthy || websocket.degraded,
    };
  } catch {
    return {
      api: { ok: false, degraded: true, error: "Health check failed", settings: null },
      websocket: { ok: false, state: "unknown", degraded: true },
      checkedAt: new Date().toISOString(),
      healthy: false,
      degraded: true,
    };
  }
}
