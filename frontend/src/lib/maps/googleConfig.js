/** Google Maps JavaScript API configuration for the web console. */

export const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"];

export function getGoogleMapsApiKey() {
  return String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
}

export function isGoogleMapsEnabled() {
  return getGoogleMapsApiKey().length > 0;
}

export const DEFAULT_MAP_CENTER = { lat: 40.7128, lng: -74.006 };
export const DEFAULT_MAP_ZOOM = 12;
