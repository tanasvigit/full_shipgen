const SCOPE_KEY = "fleetbase.frontend.sessionScope";

export const SESSION_SCOPE = {
  PLATFORM: "platform",
  YARD_ONLY: "yard-only",
};

export const sessionScopeStorage = {
  get() {
    if (typeof window === "undefined") return SESSION_SCOPE.PLATFORM;
    return window.localStorage.getItem(SCOPE_KEY) || SESSION_SCOPE.PLATFORM;
  },
  set(scope) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SCOPE_KEY, scope);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(SCOPE_KEY);
  },
};

/** Detect YMS demo / yard-operator emails for login routing hints. */
export function isYardOperatorEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return normalized.endsWith("@shipgen.demo") && normalized.startsWith("yard.");
}
