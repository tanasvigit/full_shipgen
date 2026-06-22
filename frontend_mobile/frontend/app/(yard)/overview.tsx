import { useCallback } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import { useOverviewDashboard } from "@/src/hooks/useOverviewDashboard";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardVehicle360 } from "@/src/contexts/YardVehicle360Context";
import { canAccessYardScreen, YARD_ROLE } from "@/src/lib/moduleAccess";
import { alertSeverityTone, formatAlertHeadline } from "@/src/lib/overviewMetrics";
import type { OverviewKpi } from "@/src/lib/overviewMetrics";

export default function YardOverviewScreen() {
  const router = useRouter();
  const { user, can, isYardAdmin } = useYardAuth();
  const { openVehicle360 } = useYardVehicle360();
  const { data, isLoading, isRefetching, refetch, error } = useOverviewDashboard();

  const allowed = canAccessYardScreen("overview", can, isYardAdmin, user?.role);
  const showQueueShortcut = user?.role === YARD_ROLE.MANAGER;

  const refreshAll = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refreshAll()} tintColor={colors.shipgenOrange} />
        }
      >
        <Text style={styles.overline}>YARD · OVERVIEW</Text>
        <Text style={styles.title}>Today{"'"}s yard</Text>
        <Text style={styles.subtitle}>
          {user?.displayName || user?.username} · live snapshot for managers and administrators.
        </Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading overview…</Text>
        ) : error && !data ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load overview</Text>
            <Text style={styles.muted}>{error instanceof Error ? error.message : "Check YMS service."}</Text>
          </View>
        ) : (
          <>
            {data?.fetchErrors?.length ? (
              <View style={styles.warnBox}>
                <Text style={styles.warnTitle}>Partial data</Text>
                <Text style={styles.muted}>Some sources failed to load. Pull to refresh.</Text>
              </View>
            ) : null}

            <View style={styles.kpiGrid}>
              {(data?.kpis ?? []).map((item) => (
                <KpiCard key={item.key} item={item} />
              ))}
            </View>

            <View style={styles.secondaryRow}>
              {(data?.secondaryKpis ?? []).map((item) => (
                <SecondaryChip key={item.key} item={item} />
              ))}
            </View>

            {data?.yardUtilizationPct != null ? (
              <View style={styles.utilCard}>
                <View style={styles.utilHeader}>
                  <Text style={styles.sectionTitle}>Yard utilization</Text>
                  <Text style={styles.utilValue}>{Math.round(data.yardUtilizationPct)}%</Text>
                </View>
                <View style={styles.utilTrack}>
                  <View
                    style={[
                      styles.utilFill,
                      {
                        width: `${Math.min(100, Math.max(0, data.yardUtilizationPct))}%`,
                        backgroundColor: data.yardUtilizationPct >= 85 ? colors.warning : colors.shipgenOrange,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Needs attention</Text>
                <Text style={styles.sectionMeta}>
                  {data?.alertSummary?.critical ?? 0} critical · {data?.alertSummary?.warning ?? 0} warning
                </Text>
              </View>
              {data?.alerts?.length ? (
                data.alerts.map((alert) => {
                  const tone = alertSeverityTone(alert.severity);
                  const palette =
                    tone === "danger"
                      ? { bg: colors.errorBg, fg: colors.error }
                      : tone === "warning"
                        ? { bg: colors.warningBg, fg: colors.warning }
                        : { bg: colors.infoBg, fg: colors.info };
                  return (
                    <TouchableOpacity
                      key={alert.id}
                      style={styles.alertRow}
                      onPress={() =>
                        alert.vehicleId
                          ? openVehicle360({ vehicleId: alert.vehicleId, query: alert.vehicle || undefined })
                          : undefined
                      }
                      disabled={!alert.vehicleId}
                      testID={`overview-alert-${alert.id}`}
                    >
                      <View style={[styles.alertDot, { backgroundColor: palette.fg }]} />
                      <View style={styles.alertCopy}>
                        <Text style={styles.alertTitle}>{formatAlertHeadline(alert)}</Text>
                        <Text style={[styles.alertSeverity, { color: palette.fg }]}>{alert.severity}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptySection}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                  <Text style={styles.muted}>No active alerts right now.</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              {data?.liveEvents?.length ? (
                data.liveEvents.map((event) => (
                  <View key={event.id} style={styles.eventRow}>
                    <Text style={styles.eventTime}>{event.time}</Text>
                    <View style={styles.eventCopy}>
                      <Text style={styles.eventMessage}>{event.message}</Text>
                      {event.plate ? <Text style={styles.eventPlate}>{event.plate}</Text> : null}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.muted}>No recent yard events.</Text>
              )}
            </View>

            {showQueueShortcut ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/(yard)/more")}
                testID="overview-open-more"
              >
                <Ionicons name="menu-outline" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Open modules</Text>
              </TouchableOpacity>
            ) : isYardAdmin ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/(yard)/more")}
                testID="overview-open-more"
              >
                <Ionicons name="grid-outline" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Open modules</Text>
              </TouchableOpacity>
            ) : null}
            {canAccessYardScreen("alerts", can, isYardAdmin, user?.role) ? (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push("/(yard)/alerts")}
                testID="overview-open-alerts"
              >
                <Text style={styles.secondaryBtnText}>View all alerts</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({ item }: { item: OverviewKpi }) {
  const toneColor =
    item.tone === "danger"
      ? colors.error
      : item.tone === "warning"
        ? colors.warning
        : item.tone === "success"
          ? colors.success
          : colors.text;

  return (
    <View style={styles.kpiCard} testID={`overview-kpi-${item.key}`}>
      <Text style={[styles.kpiValue, { color: toneColor }]}>{item.value}</Text>
      <Text style={styles.kpiLabel}>{item.label}</Text>
      {item.hint ? <Text style={styles.kpiHint}>{item.hint}</Text> : null}
    </View>
  );
}

function SecondaryChip({ item }: { item: OverviewKpi }) {
  return (
    <View style={styles.secondaryChip}>
      <Text style={styles.secondaryValue}>{item.value}</Text>
      <Text style={styles.secondaryLabel}>{item.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.lg, lineHeight: 19 },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
  },
  errorTitle: { fontSize: 14, fontWeight: "800", color: colors.error, marginBottom: 4 },
  warnBox: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warnTitle: { fontSize: 13, fontWeight: "800", color: colors.warning, marginBottom: 4 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  kpiCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiValue: { fontSize: 22, fontWeight: "900", color: colors.text },
  kpiLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: "600" },
  kpiHint: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  secondaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  secondaryChip: {
    minWidth: "22%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  secondaryValue: { fontSize: 16, fontWeight: "900", color: colors.text },
  secondaryLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
  utilCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  utilHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  utilValue: { fontSize: 18, fontWeight: "900", color: colors.text },
  utilTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  utilFill: { height: "100%", borderRadius: radius.pill },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
  sectionMeta: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  alertRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  alertCopy: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: "700", color: colors.text, lineHeight: 18 },
  alertSeverity: { fontSize: 10, fontWeight: "800", marginTop: 2, letterSpacing: 0.5 },
  emptySection: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  eventRow: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  eventTime: { width: 52, fontSize: 11, fontWeight: "700", color: colors.textMuted },
  eventCopy: { flex: 1 },
  eventMessage: { fontSize: 13, color: colors.text, lineHeight: 18 },
  eventPlate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  actionBtn: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.shipgenOrange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  actionBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  secondaryBtn: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "800", fontSize: 13 },
});
