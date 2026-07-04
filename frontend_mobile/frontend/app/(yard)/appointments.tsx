import { useCallback, useMemo, useState } from "react";
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
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { useGateAppointments } from "@/src/hooks/useGateAppointments";
import { useAppointmentMutations } from "@/src/hooks/useAppointmentMutations";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";
import BookAppointmentSheet from "@/src/components/yard/BookAppointmentSheet";
import AppointmentDetailSheet from "@/src/components/yard/AppointmentDetailSheet";
import {
  appointmentDayKpis,
  appointmentLookupQuery,
  filterAppointmentsByKpi,
  groupAppointmentsBySlot,
  todayIsoDate,
  type AppointmentKpiFilter,
  type AppointmentRow,
  type BookAppointmentForm,
} from "@/src/lib/appointmentActions";
import YardKpiStat from "@/src/components/yard/YardKpiStat";
import { useYardMoreBackHandler } from "@/src/components/yard/YardMoreBackHandler";
import { YmsApiError } from "@/src/lib/ymsApi";

export default function YardAppointmentsScreen() {
  useYardMoreBackHandler();
  const router = useRouter();
  const { user, can, isYardAdmin } = useYardAuth();
  const today = todayIsoDate();
  const { data, isLoading, isRefetching, refetch, error } = useGateAppointments(today);
  const mutations = useAppointmentMutations();
  const [kpiFilter, setKpiFilter] = useState<AppointmentKpiFilter>("all");
  const [bookOpen, setBookOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<AppointmentRow | null>(null);

  const allowed = canAccessYardScreen("appointments", can, isYardAdmin, user?.role);
  const canWrite = can("*") || can(YMS_PERMISSIONS.APPOINTMENT_WRITE);

  const filteredRows = useMemo(() => filterAppointmentsByKpi(data?.rows ?? [], kpiFilter), [data?.rows, kpiFilter]);
  const grouped = useMemo(() => groupAppointmentsBySlot(filteredRows), [filteredRows]);
  const kpis = useMemo(() => appointmentDayKpis(data?.rows ?? []), [data?.rows]);

  const openAtGate = useCallback(
    (row: AppointmentRow) => {
      router.push({ pathname: "/(yard)/gate", params: { q: appointmentLookupQuery(row) } });
    },
    [router],
  );

  const handleBook = useCallback(
    async (form: BookAppointmentForm) => {
      try {
        const row = await mutations.book.mutateAsync(form);
        setBookOpen(false);
        Alert.alert("Booking created", `${row.bookingRef} · ${row.plate}`);
        await refetch();
      } catch (err) {
        Alert.alert(
          "Booking failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [mutations.book, refetch],
  );

  const handleCancel = useCallback(async () => {
    if (!detailRow) return;
    try {
      await mutations.cancel.mutateAsync(detailRow.id);
      Alert.alert("Cancelled", detailRow.bookingRef);
      setDetailRow(null);
      await refetch();
    } catch (err) {
      Alert.alert(
        "Cancel failed",
        err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
      );
    }
  }, [detailRow, mutations.cancel, refetch]);

  const handleReschedule = useCallback(
    async (patch: { slot: string; gate: string; date: string }) => {
      if (!detailRow) return;
      try {
        await mutations.reschedule.mutateAsync({ appointmentId: detailRow.id, patch });
        Alert.alert("Rescheduled", `${detailRow.bookingRef} moved to ${patch.slot} at ${patch.gate}`);
        setDetailRow(null);
        await refetch();
      } catch (err) {
        Alert.alert(
          "Reschedule failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [detailRow, mutations.reschedule, refetch],
  );

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />
        }
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>YARD · APPOINTMENTS</Text>
            <Text style={styles.title}>Today&apos;s schedule</Text>
            <Text style={styles.subtitle}>{today} · tap for details or gate lookup</Text>
          </View>
          {canWrite ? (
            <TouchableOpacity style={styles.bookBtn} onPress={() => setBookOpen(true)} testID="appointments-book-open">
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.kpiGrid}>
          <YardKpiStat
            label="Total"
            value={kpis.total}
            onPress={() => setKpiFilter("all")}
            testID="appointments-kpi-total"
            style={[styles.kpiCard, kpiFilter === "all" && styles.kpiCardActive]}
          />
          <YardKpiStat
            label="Scheduled"
            value={kpis.scheduled}
            onPress={() => setKpiFilter("scheduled")}
            testID="appointments-kpi-scheduled"
            style={[styles.kpiCard, kpiFilter === "scheduled" && styles.kpiCardActive]}
          />
          <YardKpiStat
            label="Delayed"
            value={kpis.delayed}
            onPress={() => setKpiFilter("delayed")}
            testID="appointments-kpi-delayed"
            style={[styles.kpiCard, kpiFilter === "delayed" && styles.kpiCardActive]}
          />
        </View>

        {isLoading ? (
          <Text style={styles.muted}>Loading appointments…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load appointments</Text>
            <Text style={styles.muted}>{error instanceof Error ? error.message : "Check YMS service."}</Text>
          </View>
        ) : !filteredRows.length ? (
          <Text style={styles.muted}>No appointments for today.</Text>
        ) : (
          grouped.map(([slot, rows]) => (
            <View key={slot} style={styles.slotSection}>
              <Text style={styles.sectionTitle}>{slot} · {rows.length}</Text>
              {rows.map((row) => {
                const badge = statusColor(row.status);
                return (
                  <TouchableOpacity
                    key={row.id}
                    style={styles.rowCard}
                    onPress={() => setDetailRow(row)}
                    testID={`appointment-row-${row.id}`}
                  >
                    <View style={styles.rowTop}>
                      <Text style={styles.plate}>{row.plate}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>{row.bookingRef} · {row.type}</Text>
                    <Text style={styles.meta}>{row.transporter} · Gate {row.gate}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <BookAppointmentSheet
        visible={bookOpen}
        busy={mutations.busy}
        onClose={() => setBookOpen(false)}
        onSubmit={(form) => {
          void handleBook(form);
        }}
      />

      <AppointmentDetailSheet
        visible={Boolean(detailRow)}
        row={detailRow}
        busy={mutations.busy}
        canWrite={canWrite}
        onClose={() => setDetailRow(null)}
        onOpenGate={() => {
          if (detailRow) openAtGate(detailRow);
        }}
        onCancel={() => {
          void handleCancel();
        }}
        onReschedule={(patch) => {
          void handleReschedule(patch);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.md },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.shipgenOrange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.lg,
  },
  bookBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  kpiGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  kpiCard: { flex: 1 },
  kpiCardActive: { borderColor: colors.shipgenOrange },
  slotSection: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
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
