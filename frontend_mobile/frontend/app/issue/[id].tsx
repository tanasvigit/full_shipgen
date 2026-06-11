import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";
import { colors, radius, spacing } from "@/src/theme";

const priorityColor = (p: string) =>
  p === "high" ? colors.error : p === "medium" ? colors.warning : colors.info;

export default function IssueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const issueRef = String(id);
  const { issues, findVehicle } = useFleetData();
  const issue = issues.find((row) => row.id === issueRef);
  const vehicle = issue ? findVehicle(issue.vehicleId) : undefined;

  if (!issue) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Issue" back />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Issue not found in cache. Refresh the issues list.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Issue" subtitle={issue.title} back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={[styles.prioDot, { backgroundColor: priorityColor(issue.priority) }]} />
            <StatusBadge
              status={issue.status === "in_progress" ? "assigned" : issue.status === "resolved" ? "delivered" : "pending"}
            />
          </View>
          <Text style={styles.title}>{issue.title}</Text>
          <Text style={styles.description}>{issue.description}</Text>
        </View>

        <View style={styles.card}>
          <Meta label="REPORTED BY" value={issue.reportedBy} />
          <Meta label="REPORTED AT" value={issue.reportedAt} />
          <Meta label="PRIORITY" value={issue.priority.toUpperCase()} />
          <Meta label="VEHICLE" value={vehicle?.plate || issue.vehicleName || "—"} />
        </View>

        {vehicle ? (
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push(`/vehicle/${vehicle.id}`)}>
            <Ionicons name="car-sport-outline" size={16} color="#fff" />
            <Text style={styles.linkBtnText}>View vehicle</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxxl },
  emptyText: { color: colors.textMuted, textAlign: "center", fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prioDot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 18, fontWeight: "900", color: colors.text, marginTop: spacing.md },
  description: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  metaRow: { marginTop: spacing.sm },
  metaLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.2 },
  metaValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 4 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 48,
  },
  linkBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
