const trimTrailingSlash = (value) => (value ? value.replace(/\/+$/, "") : "");

const apiHostFromLocation =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "http://localhost:8000";

const API_HOST = trimTrailingSlash(import.meta.env.VITE_API_HOST || apiHostFromLocation);
const API_NAMESPACE = (import.meta.env.VITE_API_NAMESPACE || "int/v1").replace(/^\/+/, "");
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000);
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
  import.meta.env.VITE_REGISTRY_MODULE_ROOT || "registry/v1",
);

export const env = {
  API_HOST,
  API_NAMESPACE,
  API_BASE_URL: `${API_HOST}/${API_NAMESPACE}`,
  API_TIMEOUT_MS: Number.isFinite(API_TIMEOUT_MS) ? API_TIMEOUT_MS : 20000,
  MODULE_ROOT_LEDGER,
  MODULE_ROOT_STOREFRONT,
  MODULE_ROOT_PALLET,
  MODULE_ROOT_REGISTRY,
};
