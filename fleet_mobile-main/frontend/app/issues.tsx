import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";

const priorityColor = (p: string) =>
  p === "high" ? colors.error : p === "medium" ? colors.warning : colors.info;

export default function IssuesList() {
  const router = useRouter();
  const { issues, findVehicle } = useFleetData();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Issues" subtitle={`${issues.length} reports`} back rightIcon="add" />
      <FlatList
        data={issues}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const v = findVehicle(item.vehicleId);
          return (
            <TouchableOpacity
              testID={`issue-${item.id}`}
              style={styles.row}
              onPress={() => v && router.push(`/vehicle/${v.id}`)}
            >
              <View style={styles.top}>
                <View style={[styles.prioDot, { backgroundColor: priorityColor(item.priority) }]} />
                <Text style={styles.title}>{item.title}</Text>
                <StatusBadge status={item.status === "in_progress" ? "assigned" : item.status === "resolved" ? "delivered" : "pending"} />
              </View>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="car-sport-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{v?.plate ?? "—"}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.reportedBy}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.reportedAt}</Text>
                </View>
              </View>
              <View style={[styles.prioBadge, { borderColor: priorityColor(item.priority) }]}>
                <Text style={[styles.prioText, { color: priorityColor(item.priority) }]}>
                  {item.priority.toUpperCase()} PRIORITY
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  row: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  top: { flexDirection: "row", alignItems: "center" },
  prioDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { fontSize: 14, fontWeight: "800", color: colors.text, flex: 1, marginRight: 8 },
  desc: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 16 },
  metaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 10, color: colors.textSecondary, marginLeft: 4, fontWeight: "600" },
  prioBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginTop: spacing.sm },
  prioText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
});
