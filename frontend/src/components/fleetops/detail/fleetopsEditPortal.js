/** Dedicated body mount for detail edit/create modals — outside drawer stacking context. */
let portalEl = null;

export function ensureFleetopsEditPortal() {
  if (typeof document === "undefined") return null;
  if (portalEl?.isConnected) return portalEl;

  portalEl = document.getElementById("fleetops-detail-edit-portal");
  if (portalEl) return portalEl;

  portalEl = document.createElement("div");
  portalEl.id = "fleetops-detail-edit-portal";
  portalEl.setAttribute("data-fleetops-edit-portal", "true");
  document.body.appendChild(portalEl);
  return portalEl;
}

export function releaseFleetopsEditPortal() {
  if (portalEl?.isConnected) {
    portalEl.remove();
  }
  portalEl = null;
}
