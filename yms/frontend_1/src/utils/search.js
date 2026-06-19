import { safeDisplayValue } from "./display";

/** Normalize nullable values for display and string matching. */
export function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function safeLower(value) {
  return safeText(value).toLowerCase();
}

/** Case-insensitive substring match; never throws on null haystack or needle. */
export function safeIncludes(haystack, needle, { caseSensitive = false } = {}) {
  const n = safeText(needle);
  if (!n) return true;
  const h = caseSensitive ? safeText(haystack) : safeLower(haystack);
  const q = caseSensitive ? n : n.toLowerCase();
  return h.includes(q);
}

/** Match query against any of several field values (strings, numbers, nulls). */
export function matchesAnyValues(values, query) {
  if (!query || !safeText(query).trim()) return true;
  const q = safeLower(query).trim();
  const list = Array.isArray(values) ? values : [values];
  return list.some((v) => safeLower(v).includes(q));
}

// Generic case-insensitive substring search across a set of fields on one item.
export const matchesSearch = (item, query, fields) => {
  if (!query || !safeText(query).trim()) return true;
  if (!item || !fields?.length) return false;
  const q = safeLower(query).trim();
  return fields.some((f) => {
    const v = item[f];
    if (v === null || v === undefined) return false;
    return safeLower(safeDisplayValue(v)).includes(q);
  });
};
