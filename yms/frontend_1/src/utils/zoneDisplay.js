/** Zone display helpers — map layout zones (A–F) vs operational flow zones. */

const MAP_LAYOUT_CODES = new Set(["A", "B", "C", "D", "E", "F"]);

export function isMapLayoutZone(zone) {
  const mapCode = zone?.mapCode || null;
  if (mapCode && MAP_LAYOUT_CODES.has(mapCode)) return true;
  const code = zone?.code;
  return typeof code === "string" && code.length === 1 && MAP_LAYOUT_CODES.has(code);
}

export function resolveMapCode(zone) {
  if (!zone) return null;
  if (zone.mapCode && MAP_LAYOUT_CODES.has(zone.mapCode)) return zone.mapCode;
  if (zone.code && MAP_LAYOUT_CODES.has(zone.code)) return zone.code;
  return null;
}

/** Section card title for Yard Map zone detail panel. */
export function zonePanelTitle(zone) {
  if (!zone) return "Zone";
  const mapCode = resolveMapCode(zone);
  if (mapCode) return `Zone ${mapCode} — ${zone.name}`;
  if (zone.zoneCode) return `${zone.name} — ${zone.zoneCode}`;
  return zone.name || "Zone";
}
