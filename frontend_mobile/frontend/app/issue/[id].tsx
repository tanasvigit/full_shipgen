import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useAuth } from "@/src/contexts/AuthContext";
import { isDriverUser } from "@/src/lib/driver";

const priorityColor = (p: string) =>
  p === "high" ? colors.error : p === "medium" ? colors.warning : colors.info;

const statusToBadge = (status: string) =>
  status === "in_progress" ? "assigned" : status === "resolved" ? "delivered" : "pending";

export default function IssueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const driverMode = isDriverUser(user);
  const { issues, findVehicle, sectionLoading } = useFleetData();
  const issue = issues.find((item) => item.id === id);

  if (!issue && sectionLoading.issues) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Issue" back />
        <View style={styles.empty}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.emptyText}>Loading issue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!issue) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Issue" back />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Issue not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const vehicle = findVehicle(issue.vehicleId);
  const vehicleLabel = vehicle?.plate || issue.vehicleName || "—";
  const prio = priorityColor(issue.priority);
  const canEdit = !driverMode && issue.status !== "resolved";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Issue"
        subtitle={issue.title}
        back
        rightIcon={canEdit ? "create-outline" : undefined}
        onRightPress={canEdit ? () => router.push({ pathname: "/report-issue", params: { id: issue.id } }) : undefined}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <View style={[styles.prioDot, { backgroundColor: prio }]} />
            <Text style={styles.title}>{issue.title}</Text>
            <StatusBadge status={statusToBadge(issue.status)} />
          </View>
          <View style={[styles.prioBadge, { borderColor: prio }]}>
            <Text style={[styles.prioText, { color: prio }]}>
              {issue.priority.toUpperCase()} PRIORITY
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.body}>{issue.description || "No description provided."}</Text>
        </View>

        {issue.location ? (
          <View style={styles.metaGrid}>
            <Meta label="Location" value={issue.location} />
          </View>
        ) : null}

        {vehicle ? (
          <TouchableOpacity style={styles.assignCard} onPress={() => router.push(`/vehicle/${vehicle.id}`)}>
            <View style={styles.assignIcon}>
              <Ionicons name="car-sport-outline" size={16} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assignLabel}>Vehicle</Text>
              <Text style={styles.assignValue}>{vehicleLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.metaGrid}>
            <Meta label="Vehicle" value={vehicleLabel} />
          </View>
        )}

        <View style={styles.metaGrid}>
          <Meta label="Reported by" value={issue.reportedBy || "—"} />
          <Meta label="Reported at" value={issue.reportedAt || "—"} />
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  empty: { padding: spacing.xxxl, alignItems: "center", gap: spacing.sm },
  emptyText: { color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  titleRow: { flexDirection: "row", alignItems: "center" },
  prioDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { fontSize: 16, fontWeight: "800", color: colors.text, flex: 1, marginRight: 8 },
  prioBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
  prioText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.6, marginBottom: spacing.sm },
  body: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  assignCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  assignIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  assignLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  assignValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
  metaGrid: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 9, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  metaValue: { fontSize: 14, fontWeight: "900", color: colors.text, marginTop: 4 },
});
