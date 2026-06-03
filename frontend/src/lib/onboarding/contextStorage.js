const STORAGE_KEY = "onboarding:context:v1";
const ALLOWED_KEYS = ["name", "email", "phone", "organization_name", "session"];

function pickAllowed(value) {
  if (!value || typeof value !== "object") return {};
  const sanitized = {};
  for (const key of ALLOWED_KEYS) {
    if (value[key] !== undefined && value[key] !== null) {
      sanitized[key] = String(value[key]);
    }
  }
  return sanitized;
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function readRaw() {
  if (typeof window === "undefined") return {};
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
}

function writeRaw(payload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Graceful fallback: keep working with in-memory state only.
  }
}

export const onboardingContextStorage = {
  key: STORAGE_KEY,
  load() {
    return pickAllowed(readRaw());
  },
  merge(patch) {
    const current = readRaw();
    const next = pickAllowed({ ...current, ...patch });
    writeRaw(next);
    return next;
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  },
};

