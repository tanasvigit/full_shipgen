/**
 * Dock supported vehicle / material type helpers (standard + custom chips).
 */

import { DOCK_MATERIAL_TYPES, DOCK_VEHICLE_TYPES } from "../services/docksApi";

export const RESERVED_CUSTOM_KEYWORD = "CUSTOM";

export const STANDARD_DOCK_VEHICLE_TYPES = DOCK_VEHICLE_TYPES.filter(
  (t) => t !== RESERVED_CUSTOM_KEYWORD
);

export const STANDARD_DOCK_MATERIAL_TYPES = DOCK_MATERIAL_TYPES.filter(
  (t) => t !== RESERVED_CUSTOM_KEYWORD
);

export function normalizeCustomTypeLabel(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function formatDockTypeLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (STANDARD_DOCK_VEHICLE_TYPES.includes(raw) || STANDARD_DOCK_MATERIAL_TYPES.includes(raw)) {
    return raw.replace(/_/g, " ");
  }
  return raw;
}

export function splitDockTypes(allTypes = [], standardSet = []) {
  const standard = [];
  const custom = [];
  for (const t of allTypes || []) {
    const code = String(t || "").trim().toUpperCase();
    if (!code || code === RESERVED_CUSTOM_KEYWORD) continue;
    if (standardSet.includes(code)) {
      if (!standard.includes(code)) standard.push(code);
    } else if (!custom.includes(code)) {
      custom.push(code);
    }
  }
  return { standard, custom };
}

export function mergeDockTypes(standardSelected = [], customTypes = []) {
  const merged = [];
  for (const t of standardSelected) {
    const code = String(t || "").trim().toUpperCase();
    if (!code || code === RESERVED_CUSTOM_KEYWORD) continue;
    if (!merged.includes(code)) merged.push(code);
  }
  for (const t of customTypes) {
    const code = normalizeCustomTypeLabel(t);
    if (!code || code === RESERVED_CUSTOM_KEYWORD) continue;
    if (!merged.includes(code)) merged.push(code);
  }
  return merged;
}

export function isValidCustomTypeLabel(value) {
  const code = normalizeCustomTypeLabel(value);
  if (code.length < 2 || code.length > 64) return false;
  if (code === RESERVED_CUSTOM_KEYWORD) return false;
  return /^[A-Z0-9][A-Z0-9 \-]*[A-Z0-9]$|^[A-Z0-9]{2}$/.test(code);
}
