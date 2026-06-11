/** Prefer stable API uuid for PATCH/workflow; fall back to public id / route ref. */
export function resolveOrderMutationRef(
  order?: { id?: string; code?: string } | null,
  fallback?: string
) {
  const candidates = [order?.id, order?.code, fallback]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== "undefined");
  return candidates[0] || "";
}

/** Public id first — tracker/eta endpoints accept order codes. */
export function resolveOrderTrackingRef(
  order?: { id?: string; code?: string } | null,
  fallback?: string
) {
  const candidates = [order?.code, order?.id, fallback]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== "undefined");
  return candidates[0] || "";
}
