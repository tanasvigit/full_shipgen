const DEFAULT_TWO_FA = { enabled: false, method: "email", enforced: false };

function normalizeTwoFaValue(settings) {
  if (!settings || typeof settings !== "object") return null;
  return {
    enabled: Boolean(settings.enabled),
    method: settings.method || "email",
    enforced: Boolean(settings.enforced),
  };
}

/** Normalize 2FA settings from API user payloads or dedicated /users/two-fa responses. */
export function parseTwoFaSettings(source) {
  if (!source || typeof source !== "object") return { ...DEFAULT_TWO_FA };

  const nested =
    source.two_fa ??
    source.twoFaSettings ??
    source.twoFa ??
    (source.raw ? source.raw.two_fa ?? source.raw.twoFa : null);

  const fromNested = normalizeTwoFaValue(nested);
  if (fromNested) return fromNested;

  // GET/POST /users/two-fa returns a flat { enabled, method } object.
  if ("enabled" in source && !source.user && !source.uuid && !source.email) {
    return normalizeTwoFaValue(source) ?? { ...DEFAULT_TWO_FA };
  }

  return { ...DEFAULT_TWO_FA };
}

/** Prefer API payload; fall back to the value the user just requested when PATCH omits two_fa. */
export function resolveTwoFaAfterSave(apiResult, requested) {
  const parsed = parseTwoFaSettings(apiResult);
  const hasExplicitSettings =
    apiResult &&
    (apiResult.two_fa != null ||
      apiResult.twoFa != null ||
      apiResult.twoFaSettings != null ||
      ("enabled" in apiResult && !apiResult.user && !apiResult.uuid && !apiResult.email));

  if (hasExplicitSettings) return parsed;

  return {
    enabled: Boolean(requested?.enabled),
    method: requested?.method || parsed.method || "email",
    enforced: parsed.enforced,
  };
}

export function twoFaSettingsPayload(enabled, method = "email") {
  return { twoFaSettings: { enabled: Boolean(enabled), method } };
}
