import * as Sentry from "@sentry/react-native";

let sentryInitialized = false;

/** Set EXPO_PUBLIC_MOBILE_DEBUG=true to force verbose logs in release builds. */
export const mobileDebugEnabled =
  typeof __DEV__ !== "undefined" && __DEV__
    ? process.env.EXPO_PUBLIC_MOBILE_DEBUG !== "false"
    : process.env.EXPO_PUBLIC_MOBILE_DEBUG === "true";

type ObservabilityContext = {
  userId?: string;
  email?: string;
  companyUuid?: string;
};

let context: ObservabilityContext = {};

function writeLog(level: "log" | "warn", prefix: string, message: string, data?: Record<string, unknown>) {
  if (!mobileDebugEnabled && level === "log") return;
  const line = `${prefix} ${message}`;
  if (level === "warn" || mobileDebugEnabled) {
    console.warn(line, data ?? "");
  } else {
    console.log(line, data ?? "");
  }
}

export function initObservability() {
  if (sentryInitialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    enableNativeFramesTracking: true,
  });
  sentryInitialized = true;
}

export function setObservabilityContext(next: ObservabilityContext) {
  context = { ...context, ...next };
  if (!sentryInitialized) return;

  if (next.userId) {
    Sentry.setUser({
      id: next.userId,
      email: next.email,
    });
  }
  if (next.companyUuid) {
    Sentry.setTag("company_uuid", next.companyUuid);
  }
}

export function clearObservabilityContext() {
  context = {};
  if (!sentryInitialized) return;
  Sentry.setUser(null);
  Sentry.setTag("company_uuid", "");
}

export function captureError(error: unknown, meta?: Record<string, unknown>) {
  const payload = { ...context, ...(meta || {}) };
  console.error("[mobile-error]", payload, error);

  if (!sentryInitialized) return;
  Sentry.withScope((scope) => {
    Object.entries(payload).forEach(([key, value]) => {
      scope.setExtra(key, value as never);
    });
    Sentry.captureException(error);
  });
}

export function logEvent(name: string, payload?: Record<string, unknown>) {
  const data = { ...context, ...(payload || {}) };
  writeLog("log", "[mobile-event]", name, data);

  if (!sentryInitialized) return;
  Sentry.addBreadcrumb({
    category: "mobile",
    level: "info",
    message: name,
    data,
  });
}

export function logDebug(name: string, payload?: Record<string, unknown>) {
  if (!mobileDebugEnabled) return;
  writeLog("warn", "[mobile-debug]", name, { ...context, ...(payload || {}) });
}

export function logWorkflow(action: string, payload?: Record<string, unknown>) {
  logEvent(`workflow.${action}`, payload);
}

export function logApiTiming(path: string, method: string, durationMs: number, status: number) {
  logEvent("api.timing", { path, method, durationMs, status });
}

export function logYmsTiming(path: string, method: string, durationMs: number, status: number) {
  logEvent("yms.timing", { path, method, durationMs, status });
}
