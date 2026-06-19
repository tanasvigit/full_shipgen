import { safeText } from "./search";

/** Human-readable dock label from API entity, mapped row, or code string. */
export function formatDockLabel(dock, dockName) {
  if (dock == null && dockName == null) return "—";
  if (typeof dock === "string") {
    const code = safeText(dock);
    const name = safeText(dockName);
    if (code && name && name !== code) return `${code} · ${name}`;
    return code || name || "—";
  }
  if (typeof dock === "object") {
    const code = safeText(dock.dock_code || dock.code);
    const name = safeText(dock.dock_name || dock.name);
    if (code && name && name !== code) return `${code} · ${name}`;
    return code || name || "—";
  }
  return "—";
}

/** Status or label safe for StatusPill / table cells. */
export function safeStatus(value, fallback = "—") {
  if (value == null) return fallback;
  if (typeof value === "object") {
    return safeText(value.status || value.label || value.name, fallback);
  }
  return safeText(value, fallback);
}

/** Parse a value to a finite number, or null if missing/invalid. */
export function safeNumber(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Format a number with fixed decimals; returns fallback when not finite. */
export function safeToFixed(value, digits = 1, fallback = "—") {
  const n = safeNumber(value);
  if (n === null) return fallback;
  return n.toFixed(digits);
}

/** Distance label for gate / map panels. */
export function formatDistanceKm(value, { digits = 1, estimated = false } = {}) {
  const n = safeNumber(value);
  if (n === null) return "—";
  const suffix = estimated ? " (est.)" : "";
  return `${n.toFixed(digits)} km${suffix}`;
}

/** Weight label for gate vehicle details. */
export function formatWeightKg(value) {
  const n = safeNumber(value);
  if (n === null) return "—";
  return `${n.toLocaleString("en-IN")} kg`;
}

/** Coerce API values to strings safe for JSX text nodes. */
export function safeDisplayValue(value, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "object") {
    if ("dock_code" in value || "dock_name" in value || "code" in value) {
      return formatDockLabel(value);
    }
    if ("booking_reference" in value) return safeText(value.booking_reference, fallback);
    if ("vehicle_number" in value) return safeText(value.vehicle_number, fallback);
    if ("status" in value) return safeText(value.status, fallback);
    return safeText(value.name || value.label || value.id, fallback);
  }
  return safeText(value, fallback);
}
