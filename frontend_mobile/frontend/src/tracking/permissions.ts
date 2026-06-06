import * as Location from "expo-location";

export async function ensureForegroundLocationPermission() {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.granted;
}
