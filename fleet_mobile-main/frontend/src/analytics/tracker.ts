import { logEvent } from "@/src/services/observability";

const counters = new Map<string, number>();

function sanitize(payload?: Record<string, unknown>) {
  if (!payload) return {};
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (/token|password|signature|photo|authorization/i.test(key)) continue;
    safe[key] = value;
  }
  return safe;
}

export function trackEvent(name: string, payload?: Record<string, unknown>) {
  counters.set(name, (counters.get(name) || 0) + 1);
  logEvent(`analytics.${name}`, sanitize(payload));
}

export function getAnalyticsCounters() {
  return Object.fromEntries(counters.entries());
}
