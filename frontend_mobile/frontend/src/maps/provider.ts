import Constants from "expo-constants";
import { Platform } from "react-native";

/** Google Maps API key from env (Metro / app.config at build time). */
export function googleMapsApiKey() {
  return String(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
}

export function hasGoogleMapsApiKey() {
  return resolveGoogleMapsApiKey().length > 0;
}

/** Key baked into native config at build time. */
export function nativeGoogleMapsApiKey() {
  const fromAndroid = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  const fromIos = Constants.expoConfig?.ios?.config?.googleMapsApiKey;
  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey;
  return String(fromAndroid || fromIos || fromExtra || "").trim();
}

/** Best available key for runtime checks (native manifest preferred on Android). */
export function resolveGoogleMapsApiKey() {
  return nativeGoogleMapsApiKey() || googleMapsApiKey();
}

/** Native MapView is safe only when the platform provider is configured. */
export function isNativeMapsSupported() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "ios") return true;
  // Android requires the key in the native manifest (set at build time from .env).
  return nativeGoogleMapsApiKey().length > 0;
}

/** Env key is set but the Android dev client was not rebuilt yet. */
export function needsNativeMapsRebuild() {
  if (Platform.OS !== "android") return false;
  return googleMapsApiKey().length > 0 && nativeGoogleMapsApiKey().length === 0;
}

/** Use Google as the map tile provider when a key is configured. */
export function shouldUseGoogleMapProvider() {
  if (Platform.OS === "web") return false;
  return resolveGoogleMapsApiKey().length > 0;
}

export function mapsProviderLabel() {
  if (!isNativeMapsSupported()) return "Preview map";
  if (shouldUseGoogleMapProvider()) return "Google Maps";
  return Platform.OS === "ios" ? "Apple Maps" : "Maps";
}

export function markerPinColor(kind: "pickup" | "dropoff" | "driver" | "waypoint") {
  switch (kind) {
    case "pickup":
      return "#111827";
    case "dropoff":
      return "#F97316";
    case "driver":
      return "#16A34A";
    default:
      return "#6B7280";
  }
}
