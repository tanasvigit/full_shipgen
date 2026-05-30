/**
 * Merge list rows after mutations so UI reflects creates before list API catches up.
 */

export function markPendingSync(row) {
  if (!row || typeof row !== "object") return row;
  return { ...row, _pendingSync: true };
}

export function stripPendingSync(row) {
  if (!row || typeof row !== "object") return row;
  const { _pendingSync, ...rest } = row;
  return rest;
}

export function getRowId(row, key = "id") {
  return row?.[key] != null ? String(row[key]) : "";
}

export const FLEET_LAST_CREATED_ID_KEY = "fleetops:last-created-fleet-id";

/** Ensure row has a stable list key (API may omit id on create). */
export function ensureRowId(row, key = "id", prefix = "pending") {
  const base = stripPendingSync(row);
  const existing = getRowId(base, key);
  if (existing) return base;
  const fallback = `${prefix}-${String(base.name || "row").replace(/\s+/g, "-")}-${Date.now()}`;
  return { ...base, [key]: fallback };
}

/** Upsert one row at the front of the list. */
export function upsertListRow(list, row, key = "id") {
  const normalized = ensureRowId(row, key);
  const id = getRowId(normalized, key);
  const without = list.filter(
    (item) => getRowId(item, key) !== id && item.name !== normalized.name,
  );
  const pending = row._pendingSync ? markPendingSync(normalized) : normalized;
  return [pending, ...without];
}

/**
 * Replace/merge API list with any local rows still awaiting list API visibility.
 */
export function mergeListWithPending(apiRows, previous, key = "id") {
  const apiIds = new Set(apiRows.map((r) => getRowId(r, key)).filter(Boolean));
  const apiNames = new Set(apiRows.map((r) => r.name).filter(Boolean));
  const pending = previous
    .filter((r) => {
      if (!r._pendingSync) return false;
      if (apiIds.has(getRowId(r, key))) return false;
      if (r.name && apiNames.has(r.name)) return false;
      return true;
    })
    .map(stripPendingSync);
  return [...pending, ...apiRows];
}

/** Merge API entity with submitted form values (create responses may omit display fields). */
export function reconcileCreatedRow(mapped, formValues, fields) {
  const next = { ...mapped };
  for (const [formKey, rowKey] of Object.entries(fields)) {
    if (formValues?.[formKey] != null && formValues[formKey] !== "") {
      next[rowKey] = formValues[formKey];
    }
  }
  return next;
}
