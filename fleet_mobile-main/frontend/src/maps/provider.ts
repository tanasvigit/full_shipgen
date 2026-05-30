import { Platform } from "react-native";

export function isNativeMapsSupported() {
  return Platform.OS === "ios" || Platform.OS === "android";
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
