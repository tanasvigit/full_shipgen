import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useQueueBundle } from "@/src/hooks/useQueueBundle";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardTab } from "@/src/lib/moduleAccess";

export default function YardQueueScreen() {
  const { can, isYardAdmin } = useYardAuth();
  const { data, isLoading, isRefetching, refetch, error } = useQueueBundle();

  if (!canAccessYardTab("queue", can, isYardAdmin)) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />}
      >
        <Text style={styles.overline}>YARD · QUEUE</Text>
        <Text style={styles.title}>Virtual queue</Text>
        <Text style={styles.subtitle}>Live queue positions, wait times, and dock assignments.</Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading queue…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load queue</Text>
            <Text style={styles.muted}>{error instanceof Error ? error.message : "Check YMS service."}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <SummaryChip label="In queue" value={data?.summary?.inQueue ?? data?.entries?.length ?? 0} />
              <SummaryChip label="Avg wait" value={data?.summary?.avgWaitMin ?? 0} suffix="m" />
              <SummaryChip label="Ready" value={data?.summary?.readyToCall ?? 0} />
            </View>

            {(data?.entries || []).map((entry) => {
              const badge = statusColor(entry.displayStatus || entry.status || "waiting");
              return (
                <View key={entry.queueEntryId} style={styles.rowCard}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rank}>#{entry.queueRank ?? "—"}</Text>
                    <Text style={styles.plate}>{entry.plate || "Vehicle"}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>{entry.displayStatus || entry.status || "WAITING"}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>{entry.transporter || "Transporter"} · Dock {entry.dockCode || "—"}</Text>
                  <Text style={styles.meta}>
                    Wait {entry.waitingMin ?? 0} min · Priority {entry.priorityScore ?? 0}
                  </Text>
                </View>
              );
            })}
            {!data?.entries?.length ? <Text style={styles.muted}>Queue is empty.</Text> : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryChip({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}{suffix}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  summaryRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  chipValue: { fontSize: 20, fontWeight: "900", color: colors.text },
  chipLabel: { fontSize: 10, fontWeight: "700", color: colors.textSecondary, marginTop: 4 },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rank: { fontSize: 12, fontWeight: "800", color: colors.shipgenOrange, width: 28 },
  plate: { flex: 1, fontSize: 15, fontWeight: "800", color: colors.text },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: { fontSize: 14, fontWeight: "800", color: colors.error, marginBottom: 4 },
});
