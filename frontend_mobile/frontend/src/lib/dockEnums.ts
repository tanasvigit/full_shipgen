/** Values accepted by YMS backend — see yms/backend/enums.py */
export const DOCK_TYPE_OPTIONS = [
  "GENERAL",
  "LOADING",
  "UNLOADING",
  "MIXED",
  "CONTAINER",
  "COLD_CHAIN",
  "HAZMAT",
] as const;

export const DOCK_ZONE_OPTIONS = [
  "Zone A",
  "Zone B",
  "Zone C",
  "Zone D",
  "Zone E",
  "Zone F",
] as const;

export const DOCK_VEHICLE_TYPE_DEFAULTS = ["TRUCK", "TRAILER", "CONTAINER"] as const;
export const DOCK_CARGO_TYPE_DEFAULTS = ["GENERAL", "PALLETS", "STEEL"] as const;

export function dockZoneLabel(zone: string) {
  return zone.replace(/^Zone\s+/i, "") || zone;
}
