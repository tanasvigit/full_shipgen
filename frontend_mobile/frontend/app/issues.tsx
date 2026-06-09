import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
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
  const { issues, findVehicle, sectionLoading, sectionError, refresh } = useFleetData();
  const loading = sectionLoading.issues;
  const error = sectionError.issues;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Issues"
        subtitle={`${issues.length} reports`}
        back
        rightIcon="add"
        onRightPress={() => router.push("/report-issue")}
      />
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {loading && !issues.length ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading && issues.length > 0} onRefresh={() => void refresh()} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No issues reported.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const v = findVehicle(item.vehicleId);
            const vehicleLabel = v?.plate || item.vehicleName || "—";
            return (
              <TouchableOpacity
                testID={`issue-${item.id}`}
                style={styles.row}
                onPress={() => {
                  if (v) router.push(`/vehicle/${v.id}`);
                }}
              >
                <View style={styles.top}>
                  <View style={[styles.prioDot, { backgroundColor: priorityColor(item.priority) }]} />
                  <Text style={styles.title}>{item.title}</Text>
                  <StatusBadge
                    status={item.status === "in_progress" ? "assigned" : item.status === "resolved" ? "delivered" : "pending"}
                  />
                </View>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="car-sport-outline" size={11} color={colors.textMuted} />
                    <Text style={styles.metaText}>{vehicleLabel}</Text>
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg },
  empty: { paddingVertical: spacing.xxl, alignItems: "center" },
  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: { flex: 1, fontSize: 12, color: colors.error, fontWeight: "600", marginRight: 8 },
  retryText: { fontSize: 12, fontWeight: "800", color: colors.brand },
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
