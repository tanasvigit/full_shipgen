import { View, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";

type Marker = {
  id: string;
  x: number; // 0-1
  y: number; // 0-1
  color?: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function StylizedMap({
  markers = [],
  height = 320,
}: {
  markers?: Marker[];
  height?: number;
}) {
  // Pre-computed pseudo-streets to give a real map feel without external map SDKs.
  const horizontals = [0.18, 0.38, 0.55, 0.72, 0.88];
  const verticals = [0.12, 0.28, 0.46, 0.64, 0.82];

  return (
    <View testID="stylized-map" style={[styles.wrap, { height }]}>
      <View style={styles.bg}>
        {horizontals.map((y, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.streetH,
              { top: `${y * 100}%`, height: i === 2 ? 3 : 1.2, opacity: i === 2 ? 0.6 : 0.4 },
            ]}
          />
        ))}
        {verticals.map((x, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.streetV,
              { left: `${x * 100}%`, width: i === 2 ? 3 : 1.2, opacity: i === 2 ? 0.6 : 0.35 },
            ]}
          />
        ))}
        {/* Diagonal accent */}
        <View style={styles.diag} />
        {/* River */}
        <View style={styles.river} />
        {/* Park */}
        <View style={styles.park} />
      </View>

      {/* Route polyline (simple curve) */}
      <View style={styles.routeLine1} />
      <View style={styles.routeLine2} />
      <View style={styles.routeLine3} />

      {markers.map((m) => (
        <View
          key={m.id}
          style={[
            styles.markerWrap,
            { left: `${m.x * 100}%`, top: `${m.y * 100}%` },
          ]}
        >
          <View style={[styles.marker, { backgroundColor: m.color ?? colors.brand }]}>
            <Ionicons name={m.icon ?? "car"} size={14} color="#fff" />
          </View>
          {m.label ? (
            <View style={styles.markerLabel}>
              <Text style={styles.markerLabelText}>{m.label}</Text>
            </View>
          ) : null}
        </View>
      ))}

      {/* Map attribution */}
      <View style={styles.attribution}>
        <Ionicons name="location" size={10} color={colors.textMuted} />
        <Text style={styles.attributionText}>Fleetbase Map</Text>
      </View>
    </View>
  );
}

const streetColor = "#CBD5E1";

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#E8EEF4",
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: colors.border,
  },
  bg: { ...StyleSheet.absoluteFillObject },
  streetH: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: streetColor,
  },
  streetV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: streetColor,
  },
  diag: {
    position: "absolute",
    left: -20,
    top: "30%",
    width: "140%",
    height: 2,
    backgroundColor: streetColor,
    opacity: 0.5,
    transform: [{ rotate: "18deg" }],
  },
  river: {
    position: "absolute",
    left: "60%",
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: "#BFD7EA",
    opacity: 0.55,
    transform: [{ skewX: "-8deg" }],
  },
  park: {
    position: "absolute",
    left: "8%",
    top: "60%",
    width: "22%",
    height: "22%",
    backgroundColor: "#CFE5C4",
    borderRadius: 8,
    opacity: 0.8,
  },
  routeLine1: {
    position: "absolute",
    left: "20%",
    top: "70%",
    width: "30%",
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  routeLine2: {
    position: "absolute",
    left: "48%",
    top: "44%",
    width: 3,
    height: "28%",
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  routeLine3: {
    position: "absolute",
    left: "48%",
    top: "42%",
    width: "28%",
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  markerWrap: {
    position: "absolute",
    transform: [{ translateX: -14 }, { translateY: -14 }],
    alignItems: "center",
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  markerLabel: {
    marginTop: 4,
    backgroundColor: colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  markerLabelText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  attribution: {
    position: "absolute",
    right: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  attributionText: { fontSize: 9, color: colors.textSecondary, marginLeft: 2, fontWeight: "600" },
});
