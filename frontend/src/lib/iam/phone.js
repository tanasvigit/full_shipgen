/**
 * Fleetbase `ValidPhoneNumber` rule: value must match /^\+[0-9]+$/
 * @param {string} phone
 * @returns {string|undefined}
 */
export function normalizeIamPhone(phone) {
  const trimmed = String(phone ?? "").trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : undefined;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : undefined;
}
