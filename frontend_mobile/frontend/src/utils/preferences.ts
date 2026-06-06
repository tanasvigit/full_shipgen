import { storage } from "@/src/utils/storage";

export type DriverPreferences = {
  pushNotifications: boolean;
  locationTracking: boolean;
  darkMode: boolean;
};

const PREFERENCES_KEY = "fleet_mobile.preferences";

const DEFAULTS: DriverPreferences = {
  pushNotifications: true,
  locationTracking: true,
  darkMode: false,
};

let cachedLocationTracking: boolean | null = null;

export async function isLocationTrackingEnabled() {
  if (cachedLocationTracking === null) {
    const prefs = await loadDriverPreferences();
    cachedLocationTracking = prefs.locationTracking;
  }
  return cachedLocationTracking;
}

export function setLocationTrackingEnabledCache(enabled: boolean) {
  cachedLocationTracking = enabled;
}

export async function loadDriverPreferences(): Promise<DriverPreferences> {
  return storage.getItem<DriverPreferences>(PREFERENCES_KEY, DEFAULTS);
}

export async function saveDriverPreferences(next: Partial<DriverPreferences>) {
  const current = await loadDriverPreferences();
  const merged = { ...current, ...next };
  await storage.setItem(PREFERENCES_KEY, merged);
  if (typeof next.locationTracking === "boolean") {
    setLocationTrackingEnabledCache(next.locationTracking);
  }
  return merged;
}
