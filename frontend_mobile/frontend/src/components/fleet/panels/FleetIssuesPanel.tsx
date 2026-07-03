import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, shadow, spacing } from "@/src/theme";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";

const priorityColor = (p: string) =>
  p === "high" ? colors.error : p === "medium" ? colors.warning : colors.info;

export default function FleetIssuesPanel() {
  const router = useRouter();
  const { issues, findVehicle, sectionLoading, sectionError, refresh } = useFleetData();
  const loading = sectionLoading.issues;
  const error = sectionError.issues;

  if (loading && !issues.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={issues}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={loading && issues.length > 0} onRefresh={() => void refresh()} />}
      ListHeaderComponent={
        <View>
          <View style={styles.toolbar}>
            <Text style={styles.toolbarHint}>{issues.length} reports</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/report-issue")}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Report</Text>
            </TouchableOpacity>
          </View>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => void refresh()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      }
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
            onPress={() => router.push(`/issue/${item.id}`)}
          >
            <View style={styles.top}>
              <View style={[styles.prioDot, { backgroundColor: priorityColor(item.priority) }]} />
              <Text style={styles.title}>{item.title}</Text>
              <StatusBadge
                status={
                  item.status === "in_progress" ? "assigned" : item.status === "resolved" ? "delivered" : "pending"
                }
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
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  toolbarHint: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  addBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  empty: { paddingVertical: spacing.xxl, alignItems: "center" },
  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  errorBanner: {
    marginBottom: spacing.sm,
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
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  top: { flexDirection: "row", alignItems: "center" },
  prioDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { fontSize: 14, fontWeight: "800", color: colors.text, flex: 1, marginRight: 8 },
  desc: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 16 },
  metaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 10, color: colors.textSecondary, marginLeft: 4, fontWeight: "600" },
  prioBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  prioText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
});
