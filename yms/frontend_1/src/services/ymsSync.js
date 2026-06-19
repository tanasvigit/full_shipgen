/**
 * Cross-module YMS synchronization — broadcast mutations to all open views/drawers.
 */

export const YMS_SYNC_EVENT = "yms-data-changed";

/**
 * Notify all listeners that YMS data changed after a mutation.
 * @param {object} [detail] - Optional metadata: source, action, vehicleId, dockId, queueEntryId, appointmentId
 */
export function notifyYmsDataChanged(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(YMS_SYNC_EVENT, {
      detail: { ts: Date.now(), ...detail },
    })
  );
}

/**
 * Subscribe to YMS data changes. Returns unsubscribe function.
 * @param {(detail: object) => void} handler
 */
export function onYmsDataChanged(handler) {
  if (typeof window === "undefined") return () => {};
  const wrapped = (event) => handler(event?.detail || {});
  window.addEventListener(YMS_SYNC_EVENT, wrapped);
  return () => window.removeEventListener(YMS_SYNC_EVENT, wrapped);
}
