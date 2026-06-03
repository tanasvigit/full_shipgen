/**
 * Dev-only FleetOps permission bypass. Ignored in production builds (import.meta.env.PROD).
 * Never set VITE_FLEETOPS_PERMISSIVE in production — see docs/DEPLOYMENT.md.
 */
export function isFleetopsPermissiveMode() {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) {
    return false;
  }
  return import.meta.env?.VITE_FLEETOPS_PERMISSIVE === "true";
}
