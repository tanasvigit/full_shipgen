import { Text, View, StyleSheet } from "react-native";
import { colors, radius, statusColor } from "../theme";

export default function StatusBadge({ status }: { status: string }) {
  const c = statusColor(status);
  const label = status.replace(/_/g, " ").toUpperCase();
  return (
    <View
      testID={`status-badge-${status}`}
      style={[styles.badge, { backgroundColor: c.bg, borderColor: c.fg }]}
    >
      <View style={[styles.dot, { backgroundColor: c.fg }]} />
      <Text style={[styles.text, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
});
