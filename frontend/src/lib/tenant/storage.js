import { PORTAL_NAME } from "@/lib/branding";
import { DISPLAY_CURRENCY } from "@/lib/formatMoney";

const BRANDING_KEY = "fleetops.tenant.branding";
const PREFS_KEY = "fleetops.tenant.preferences";
const ONBOARDING_KEY = "fleetops.onboarding";

export const DEFAULT_BRANDING = {
  primaryColor: "#0066FF",
  accentColor: "#00E676",
  logoUrl: "",
  productName: PORTAL_NAME,
};

export const DEFAULT_PREFERENCES = {
  timezone: "Asia/Kolkata",
  currency: DISPLAY_CURRENCY,
  locale: "en-IN",
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

const LEGACY_PORTAL_NAMES = new Set(["FleetOps", "Fleetbase", "Fleetbase Console"]);

export function loadBranding(orgId) {
  try {
    const raw = localStorage.getItem(`${BRANDING_KEY}.${orgId || "default"}`);
    if (!raw) return { ...DEFAULT_BRANDING };
    const parsed = { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
    if (LEGACY_PORTAL_NAMES.has(parsed.productName)) {
      parsed.productName = PORTAL_NAME;
      saveBranding(orgId, parsed);
    }
    return parsed;
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
    const parsed = raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES };
    if (!parsed.currency || parsed.currency === "USD") {
      parsed.currency = DISPLAY_CURRENCY;
    }
    return parsed;
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
