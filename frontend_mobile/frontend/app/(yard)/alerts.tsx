import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardVehicle360 } from "@/src/contexts/YardVehicle360Context";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { useYardAlerts } from "@/src/hooks/useYardAlerts";
import { alertSeverityTone, formatAlertHeadline } from "@/src/lib/overviewMetrics";
import type { ControlTowerAlert } from "@/src/services/alertsService";

export default function YardAlertsScreen() {
  const { can, isYardAdmin, user } = useYardAuth();
  const { openVehicle360 } = useYardVehicle360();
  const { data, isLoading, isRefetching, refetch, error } = useYardAlerts();

  const allowed = canAccessYardScreen("alerts", can, isYardAdmin, user?.role);

  const refreshAll = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const openAlert = useCallback(
    (alert: ControlTowerAlert) => {
      if (alert.vehicleId) {
        openVehicle360({ vehicleId: alert.vehicleId, query: alert.vehicle || undefined });
      }
    },
    [openVehicle360],
  );

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  const alerts = data?.activeAlerts ?? [];

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refreshAll()} tintColor={colors.shipgenOrange} />
        }
      >
        <Text style={styles.overline}>YARD · ALERTS</Text>
        <Text style={styles.title}>Needs attention</Text>
        <Text style={styles.subtitle}>
          {data?.criticalCount ?? 0} critical · {data?.warningCount ?? 0} warning
        </Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading alerts…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load alerts</Text>
            <Text style={styles.muted}>{error instanceof Error ? error.message : "Check YMS service."}</Text>
          </View>
        ) : alerts.length ? (
          alerts.map((alert) => {
            const tone = alertSeverityTone(alert.severity);
            const palette =
              tone === "danger"
                ? { fg: colors.error, bg: colors.errorBg }
                : tone === "warning"
                  ? { fg: colors.warning, bg: colors.warningBg }
                  : { fg: colors.info, bg: colors.infoBg };
            return (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertCard}
                onPress={() => openAlert(alert)}
                disabled={!alert.vehicleId}
                testID={`alerts-row-${alert.id}`}
              >
                <View style={[styles.alertIcon, { backgroundColor: palette.bg }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={palette.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{formatAlertHeadline(alert)}</Text>
                  <Text style={[styles.alertSeverity, { color: palette.fg }]}>{alert.severity}</Text>
                  {alert.dock ? <Text style={styles.alertMeta}>Dock {alert.dock}</Text> : null}
                </View>
                {alert.vehicleId ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.muted}>No active operational alerts right now.</Text>
          </View>
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
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.lg },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
  },
  errorTitle: { fontSize: 14, fontWeight: "800", color: colors.error, marginBottom: 4 },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { fontSize: 13, fontWeight: "700", color: colors.text, lineHeight: 18 },
  alertSeverity: { fontSize: 10, fontWeight: "800", marginTop: 4, letterSpacing: 0.5 },
  alertMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
});
