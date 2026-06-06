import Constants from "expo-constants";
import { Platform } from "react-native";

/** Google Maps API key from env (used when generating native config). */
export function googleMapsApiKey() {
  return String(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
}

export function hasGoogleMapsApiKey() {
  return googleMapsApiKey().length > 0;
}

/** Key baked into the Android manifest at native build time. */
export function nativeGoogleMapsApiKey() {
  const fromConfig = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  return String(fromConfig || "").trim();
}

/** Native MapView is safe only when the platform provider is configured. */
export function isNativeMapsSupported() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "ios") return true;
  // Android MapView crashes at runtime without a Google Maps API key in the native manifest.
  return nativeGoogleMapsApiKey().length > 0;
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
