import { Text, View, StyleSheet } from "react-native";
import { canonicalOrderStatus, orderStatusLabel } from "@/src/lib/orderStatus";
import { colors, radius, statusColor } from "../theme";

export default function StatusBadge({ status }: { status: string }) {
  const canonical = canonicalOrderStatus(status);
  const c = statusColor(canonical);
  const label = orderStatusLabel(status).toUpperCase();
  return (
    <View
      testID={`status-badge-${canonical}`}
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
