const BRANDING_KEY = "fleetops.tenant.branding";
const PREFS_KEY = "fleetops.tenant.preferences";
const ONBOARDING_KEY = "fleetops.onboarding";

export const DEFAULT_BRANDING = {
  primaryColor: "#0066FF",
  accentColor: "#00E676",
  logoUrl: "",
  productName: "FleetOps",
};

export const DEFAULT_PREFERENCES = {
  timezone: "UTC",
  currency: "USD",
  locale: "en-US",
  notifications: {
    orderCreated: { email: true, push: true },
    orderDispatched: { email: true, push: true },
    driverOffline: { email: false, push: true },
    dailySummary: { email: true, push: false },
  },
  operations: {
    defaultOrderView: "table",
    autoRefreshList: true,
    showRiskAlerts: true,
  },
};

export function loadBranding(orgId) {
  try {
    const raw = localStorage.getItem(`${BRANDING_KEY}.${orgId || "default"}`);
    return raw ? { ...DEFAULT_BRANDING, ...JSON.parse(raw) } : { ...DEFAULT_BRANDING };
  } catch {
    return { ...DEFAULT_BRANDING };
  }
}

export function saveBranding(orgId, branding) {
  localStorage.setItem(`${BRANDING_KEY}.${orgId || "default"}`, JSON.stringify(branding));
}

export function loadPreferences(orgId) {
  try {
    const raw = localStorage.getItem(`${PREFS_KEY}.${orgId || "default"}`);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(orgId, prefs) {
  localStorage.setItem(`${PREFS_KEY}.${orgId || "default"}`, JSON.stringify(prefs));
}

export function loadOnboardingState(orgId) {
  try {
    const raw = localStorage.getItem(`${ONBOARDING_KEY}.${orgId || "default"}`);
    return raw ? JSON.parse(raw) : { completed: false, steps: {} };
  } catch {
    return { completed: false, steps: {} };
  }
}

export function saveOnboardingState(orgId, state) {
  localStorage.setItem(`${ONBOARDING_KEY}.${orgId || "default"}`, JSON.stringify(state));
}

export function applyTenantTheme(branding) {
  const root = document.documentElement;
  root.style.setProperty("--tenant-primary", branding.primaryColor || DEFAULT_BRANDING.primaryColor);
  root.style.setProperty("--tenant-accent", branding.accentColor || DEFAULT_BRANDING.accentColor);
}
