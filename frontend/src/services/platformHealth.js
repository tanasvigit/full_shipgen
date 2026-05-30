import { apiClient } from "@/lib/api";
import { env } from "@/lib/env";
import { fleetopsRealtimeManager } from "@/domain/fleetops/realtime/registry";

const HEALTH_PROBE_PATHS = ["/health", "/settings", "/"];

const silentRequest = {
  loading: false,
  timeout: 6000,
  silent: true,
  validateStatus: () => true,
};

/**
 * Probe API reachability without throwing or spamming the console.
 * 5xx on a probe path → degraded (server up, endpoint unhealthy).
 * Network failure → unreachable.
 */
export async function checkApiHealth() {
  const started = Date.now();
  let lastStatus = null;
  let lastError = null;
  let sawReachable4xx = false;

  for (const path of HEALTH_PROBE_PATHS) {
    try {
      const response = await apiClient.get(path, silentRequest);
      const status = response?.status ?? 0;
      lastStatus = status;
      const latencyMs = Date.now() - started;

      if (status >= 200 && status < 400) {
        return {
          ok: true,
          degraded: false,
          latencyMs,
          url: `${env.API_BASE_URL}${path}`,
          status,
          probe: path,
          settings: path === "/settings" && status < 400 ? response.data : null,
        };
      }

      // 4xx on probe paths often means endpoint unsupported for this backend shape,
      // not that API connectivity is down. Keep probing other paths before degrading.
      if (status >= 400 && status < 500) {
        sawReachable4xx = true;
        continue;
      }

      if (status >= 500) {
        lastError = `HTTP ${status} on ${path}`;
        continue;
      }
    } catch (err) {
      lastError = err?.friendlyMessage || err?.message || "API unreachable";
    }
  }

  const latencyMs = Date.now() - started;
  if (lastStatus != null && lastStatus >= 500) {
    return {
      ok: false,
      degraded: true,
      latencyMs,
      url: env.API_BASE_URL,
      status: lastStatus,
      error: lastError || `HTTP ${lastStatus}`,
      settings: null,
    };
  }

  if (sawReachable4xx) {
    return {
      ok: true,
      degraded: false,
      latencyMs,
      url: env.API_BASE_URL,
      status: lastStatus ?? 0,
      probe: "fallback-4xx",
      settings: null,
    };
  }

  return {
    ok: false,
    degraded: true,
    latencyMs,
    url: env.API_BASE_URL,
    error: lastError || "API unreachable",
    settings: null,
  };
}

export function getWebsocketHealth() {
  const state = fleetopsRealtimeManager.getStatus?.() ?? "unknown";
  return {
    ok: state === "connected",
    state: state || "unknown",
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
