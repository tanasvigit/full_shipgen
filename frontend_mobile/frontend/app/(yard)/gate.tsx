import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useGateDashboard } from "@/src/hooks/useGateDashboard";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardTab } from "@/src/lib/moduleAccess";

const KPI_ITEMS = [
  { key: "approaching", label: "Approaching" },
  { key: "arrived", label: "Arrived" },
  { key: "checkedIn", label: "Checked In" },
  { key: "waiting", label: "Waiting" },
  { key: "exitHolding", label: "Exit Hold" },
  { key: "exitedToday", label: "Exited Today" },
] as const;

export default function YardGateScreen() {
  const { user, can, isYardAdmin } = useYardAuth();
  const { data, isLoading, isRefetching, refetch, error } = useGateDashboard();

  if (!canAccessYardTab("gate", can, isYardAdmin)) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />}
      >
        <Text style={styles.overline}>YARD · GATE</Text>
        <Text style={styles.title}>Gate dashboard</Text>
        <Text style={styles.subtitle}>
          {user?.displayName || user?.username} · {user?.role?.replace(/_/g, " ")}
        </Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading gate activity…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load gate data</Text>
            <Text style={styles.muted}>{error instanceof Error ? error.message : "Check YMS service and network."}</Text>
          </View>
        ) : (
          <>
            <View style={styles.kpiGrid}>
              {KPI_ITEMS.map((item) => (
                <View key={item.key} style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{data?.kpis?.[item.key] ?? 0}</Text>
                  <Text style={styles.kpiLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Active vehicles</Text>
            {(data?.activity || []).slice(0, 20).map((row) => {
              const badge = statusColor(row.activityTab || row.status || "pending");
              return (
                <View key={`${row.vehicleId}-${row.appointment}`} style={styles.rowCard}>
                  <View style={styles.rowTop}>
                    <Text style={styles.plate}>{row.plate || "—"}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>{row.activityTab || row.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>{row.transporter || "—"} · {row.driver || "No driver"}</Text>
                  <Text style={styles.meta}>Appt {row.appointment || "—"} · Slot {row.slot || "—"}</Text>
                </View>
              );
            })}
            {!data?.activity?.length ? <Text style={styles.muted}>No vehicles at gate right now.</Text> : null}
          </>
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
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg, textTransform: "capitalize" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  kpiCard: {
    width: "31%",
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiValue: { fontSize: 22, fontWeight: "900", color: colors.text },
  kpiLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4, fontWeight: "700" },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  plate: { fontSize: 15, fontWeight: "800", color: colors.text },
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
