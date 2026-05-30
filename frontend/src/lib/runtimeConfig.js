import { env } from "@/lib/env";

const REQUIRED = [
  { key: "VITE_API_HOST", value: env.API_HOST, label: "API host" },
  { key: "VITE_API_NAMESPACE", value: env.API_NAMESPACE, label: "API namespace" },
];

/**
 * Validate runtime configuration at boot. Returns issues (empty = OK).
 */
export function validateRuntimeConfig() {
  const issues = [];
  for (const { key, value, label } of REQUIRED) {
    if (!value || String(value).trim() === "") {
      issues.push({ key, message: `${label} (${key}) is not configured.` });
    }
  }
  if (!Number.isFinite(env.API_TIMEOUT_MS) || env.API_TIMEOUT_MS < 5000) {
    issues.push({ key: "VITE_API_TIMEOUT_MS", message: "API timeout should be at least 5000ms." });
  }
  try {
    new URL(env.API_HOST);
  } catch {
    issues.push({ key: "VITE_API_HOST", message: "API host is not a valid URL." });
  }
  return issues;
}

export function getRuntimeConfigSummary() {
  return {
    apiHost: env.API_HOST,
    apiNamespace: env.API_NAMESPACE,
    apiBaseUrl: env.API_BASE_URL,
    timeoutMs: env.API_TIMEOUT_MS,
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
  };
}
