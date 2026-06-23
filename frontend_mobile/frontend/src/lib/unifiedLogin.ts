/** True when the error likely means wrong account/password (safe to try the other auth backend). */
export function isCredentialMismatchError(error: unknown) {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status: number }).status)
      : null;
  if (status === 401 || status === 403 || status === 422) return true;

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("invalid") ||
    message.includes("credential") ||
    message.includes("unauthorized") ||
    message.includes("incorrect") ||
    message.includes("do not match")
  );
}

/** Prefer YMS auth for known yard operator identities to avoid a noisy Fleetops probe. */
export function shouldTryYmsFirst(identity: string) {
  const normalized = identity.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("yard.") || normalized.startsWith("yard_")) return true;
  if (/^yard[a-z0-9._-]*@/.test(normalized)) return true;
  if (normalized.includes("@shipgen.demo") && normalized.includes("yard")) return true;
  return false;
}

export function unifiedLoginErrorMessage(fleetError: unknown, yardError: unknown) {
  const candidates = [yardError, fleetError].filter((error): error is Error => error instanceof Error);
  if (candidates.length) return candidates[0].message;
  return "Unable to sign in. Check your email and password.";
}
