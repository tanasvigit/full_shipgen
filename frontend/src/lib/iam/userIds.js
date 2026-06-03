/** Fleetbase admin password reset expects the target user's `uuid` (not DB integer id). */
export function resolveIamUserUuid(user) {
  if (!user) return null;
  const raw = user.raw ?? user;
  if (raw?.uuid) return String(raw.uuid);
  if (user.uuid) return String(user.uuid);
  return null;
}
