import { formatDistanceToNow, isValid, parseISO } from "date-fns";

/** Renders ISO-ish API timestamps for console lists. */
export function formatRelativeApiTime(iso) {
  if (!iso) return "—";
  const d = typeof iso === "string" ? parseISO(iso) : new Date(iso);
  if (!isValid(d)) return String(iso);
  return formatDistanceToNow(d, { addSuffix: true });
}
