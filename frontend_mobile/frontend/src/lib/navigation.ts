import { Linking, Platform } from "react-native";

export type MapCoordinate = {
  latitude: number;
  longitude: number;
  label?: string;
};

export async function openMapsNavigation(target: MapCoordinate) {
  const { latitude, longitude, label = "Destination" } = target;
  const encodedLabel = encodeURIComponent(label);
  const coords = `${latitude},${longitude}`;

  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${coords}&q=${encodedLabel}`
      : `google.navigation:q=${coords}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }

  await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coords}`);
}
