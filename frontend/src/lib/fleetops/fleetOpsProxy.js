/**
 * Dev (Vite) and prod (nginx) must only proxy FleetOps *API* paths under /fleet-ops/.
 * UI routes like /fleet-ops/maintenance/schedules are React Router pages — not backend routes.
 */

export const FLEETOPS_UI_ROUTE_PREFIXES = [
  "/fleet-ops/management",
  "/fleet-ops/maintenance",
  "/fleet-ops/operations",
  "/fleet-ops/connectivity",
  "/fleet-ops/admin",
  "/fleet-ops/service-areas",
  "/fleet-ops/geo",
  "/fleet-ops/custom-fields",
  "/fleet-ops/analytics",
  "/fleet-ops/tracking/lookup",
];

/** Settings tabs in the React app (not API slug names like routing-settings). */
export const FLEETOPS_SETTINGS_UI_SEGMENTS = new Set([
  "navigator",
  "routing",
  "orchestrator",
  "scheduling",
  "notifications",
  "avatars",
  "payments",
  "entity-editing",
]);

export function isFleetOpsApiPath(pathname = "") {
  const path = pathname.split("?")[0];
  if (/^\/fleet-ops\/(live|orchestrator|metrics|positions|payments|manifests|manifest-stops|lookup|navigator)\//.test(path)) {
    return true;
  }
  if (/^\/fleet-ops\/(metrics|positions)\/?$/.test(path)) {
    return true;
  }
  if (path.startsWith("/fleet-ops/settings/")) {
    const segment = path.slice("/fleet-ops/settings/".length).split("/")[0];
    return !FLEETOPS_SETTINGS_UI_SEGMENTS.has(segment);
  }
  return false;
}

export function isFleetOpsUiRoute(pathname = "") {
  const path = pathname.split("?")[0];
  if (path === "/fleet-ops") {
    return true;
  }
  if (FLEETOPS_UI_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true;
  }
  if (path === "/fleet-ops/settings" || path.startsWith("/fleet-ops/settings/")) {
    const segment = path.replace(/^\/fleet-ops\/settings\/?/, "").split("/")[0];
    return !segment || FLEETOPS_SETTINGS_UI_SEGMENTS.has(segment);
  }
  return false;
}

/** True when the dev proxy should forward the request to the API gateway. */
export function shouldProxyFleetOpsRequest(pathname = "", acceptHeader = "") {
  if (isFleetOpsApiPath(pathname)) {
    return true;
  }
  if (isFleetOpsUiRoute(pathname)) {
    return false;
  }
  if (String(acceptHeader).includes("text/html")) {
    return false;
  }
  return false;
}
