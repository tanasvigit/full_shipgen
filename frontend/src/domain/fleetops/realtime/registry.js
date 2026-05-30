import { fleetopsRealtimeManager } from "./manager";

/** Extension point: register global realtime handlers (tabs, widgets, analytics). */
export function registerRealtimeHandler(handler) {
  return fleetopsRealtimeManager.registerHandler(handler);
}

export { fleetopsRealtimeManager };
