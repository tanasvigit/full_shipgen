const trimTrailingSlash = (value) => (value ? value.replace(/\/+$/, "") : "");

/**
 * Browser always uses same-origin so /int/v1 (and module roots) hit the Vite or
 * nginx proxy — never call the gateway on :8000 from the page.
 * VITE_API_HOST is only a non-browser fallback (e.g. tests without window).
 */
function resolveApiHost() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const configured = trimTrailingSlash(import.meta.env.VITE_API_HOST || "");
  return configured || "http://localhost:8000";
}

const API_HOST = resolveApiHost();
const API_NAMESPACE = (import.meta.env.VITE_API_NAMESPACE || "int/v1").replace(/^\/+/, "");
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000);
const INSTALLER_API_TIMEOUT_MS = Number(import.meta.env.VITE_INSTALLER_API_TIMEOUT_MS || 600000);
const INSTALLER_UI_ENABLED = String(import.meta.env.VITE_INSTALLER_UI_ENABLED || "false").toLowerCase() === "true";
const MODULE_ROOT_LEDGER = trimTrailingSlash(
  import.meta.env.VITE_LEDGER_MODULE_ROOT || "ledger/int/v1",
);
const MODULE_ROOT_STOREFRONT = trimTrailingSlash(
  import.meta.env.VITE_STOREFRONT_MODULE_ROOT || "storefront/int/v1",
);
const MODULE_ROOT_PALLET = trimTrailingSlash(
  import.meta.env.VITE_PALLET_MODULE_ROOT || "pallet/int/v1",
);
const MODULE_ROOT_REGISTRY = trimTrailingSlash(
  import.meta.env.VITE_REGISTRY_MODULE_ROOT || "~registry/v1",
);
const YARD_BASE_PATH = (import.meta.env.VITE_YARD_BASE_PATH || "/yard").replace(/\/$/, "");
const YMS_API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_YMS_API_BASE_URL || "/api/yms",
);

export const env = {
  API_HOST,
  API_NAMESPACE,
  API_BASE_URL: `${API_HOST}/${API_NAMESPACE}`,
  API_TIMEOUT_MS: Number.isFinite(API_TIMEOUT_MS) ? API_TIMEOUT_MS : 20000,
  INSTALLER_API_TIMEOUT_MS: Number.isFinite(INSTALLER_API_TIMEOUT_MS) ? INSTALLER_API_TIMEOUT_MS : 600000,
  INSTALLER_UI_ENABLED,
  MODULE_ROOT_LEDGER,
  MODULE_ROOT_STOREFRONT,
  MODULE_ROOT_PALLET,
  MODULE_ROOT_REGISTRY,
  YARD_BASE_PATH,
  YMS_API_BASE_URL,
};
