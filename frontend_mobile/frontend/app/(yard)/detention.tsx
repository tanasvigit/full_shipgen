import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { useDetentionBundle } from "@/src/hooks/useDetentionBundle";
import { useDetentionMutations } from "@/src/hooks/useDetentionMutations";
import {
  DETENTION_STATUS_OPTIONS,
  canUpdateDetentionStatus,
  type DetentionRow,
} from "@/src/services/detentionService";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";
import { YmsApiError } from "@/src/lib/ymsApi";

export default function YardDetentionScreen() {
  const { user, can, isYardAdmin } = useYardAuth();
  const { data, isLoading, isRefetching, refetch, error } = useDetentionBundle();
  const mutations = useDetentionMutations();
  const [selected, setSelected] = useState<DetentionRow | null>(null);

  const allowed = canAccessYardScreen("detention", can, isYardAdmin, user?.role);
  const canWrite = can("*") || can(YMS_PERMISSIONS.DETENTION_WRITE);

  const handleStatus = useCallback(
    async (row: DetentionRow, status: string) => {
      if (!canWrite || !canUpdateDetentionStatus(row.status, status)) return;
      try {
        await mutations.updateStatus.mutateAsync({ id: row.id, status });
        Alert.alert("Detention updated", `${row.detentionRef} → ${status}`);
        setSelected(null);
        await refetch();
      } catch (err) {
        Alert.alert(
          "Update failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [canWrite, mutations.updateStatus, refetch],
  );

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />
        }
      >
        <Text style={styles.overline}>YARD · DETENTION</Text>
        <Text style={styles.title}>Detention records</Text>
        <Text style={styles.subtitle}>
          Review charges and update status{canWrite ? " · tap a record to action" : " · view only"}
        </Text>

        {data?.summary ? (
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.summary.recordCount}</Text>
              <Text style={styles.kpiLabel}>Records</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.summary.disputedCount}</Text>
              <Text style={styles.kpiLabel}>Disputed</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.summary.today}</Text>
              <Text style={styles.kpiLabel}>Today</Text>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <Text style={styles.muted}>Loading detention…</Text>
        ) : error ? (
          <Text style={styles.muted}>{error instanceof Error ? error.message : "Unable to load detention."}</Text>
        ) : !data?.records.length ? (
          <Text style={styles.muted}>No detention records.</Text>
        ) : (
          data.records.map((row) => {
            const badge = statusColor(row.status);
            const expanded = selected?.id === row.id;
            return (
              <TouchableOpacity
                key={row.id}
                style={styles.rowCard}
                onPress={() => setSelected(expanded ? null : row)}
                testID={`detention-row-${row.id}`}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.plate}>{row.plate}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{row.detentionRef} · {row.transporter}</Text>
                <Text style={styles.meta}>
                  {row.actualHours}h · ₹{row.cost.toLocaleString()} · {row.category}
                </Text>
                {expanded && canWrite ? (
                  <View style={styles.actionRow}>
                    {DETENTION_STATUS_OPTIONS.filter((status) => canUpdateDetentionStatus(row.status, status)).map(
                      (status) => (
                        <TouchableOpacity
                          key={status}
                          style={styles.actionChip}
                          disabled={mutations.busy}
                          onPress={() => void handleStatus(row, status)}
                          testID={`detention-status-${row.id}-${status}`}
                        >
                          <Text style={styles.actionChipText}>{status}</Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg, lineHeight: 19 },
  kpiRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiValue: { fontSize: 20, fontWeight: "900", color: colors.text },
  kpiLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4, fontWeight: "700" },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plate: { fontSize: 15, fontWeight: "800", color: colors.text },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  actionChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.bg },
  actionChipText: { fontSize: 11, fontWeight: "800", color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
});
