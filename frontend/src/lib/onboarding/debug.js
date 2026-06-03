function redactedMessage(value) {
  const text = String(value || "");
  return text.slice(0, 240);
}

export function logOnboardingDebug(event, payload = {}) {
  if (!import.meta.env?.DEV) return;
  const safePayload = {
    route: payload.route || "unknown",
    action: payload.action || "unknown",
    status: payload.status ?? null,
    code: payload.code ?? null,
    message: redactedMessage(payload.message),
  };
  // Never include sensitive values (password/token/code).
  console.debug(`[onboarding] ${event}`, safePayload);
}

