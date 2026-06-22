import { useCallback, useMemo, useState, useEffect } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useQueueBundle } from "@/src/hooks/useQueueBundle";
import { useDockAvailability } from "@/src/hooks/useDockAvailability";
import { useQueueMutations } from "@/src/hooks/useQueueMutations";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardVehicle360 } from "@/src/contexts/YardVehicle360Context";
import { canAccessYardScreen, hasDocksModuleAccess } from "@/src/lib/moduleAccess";
import { canCallQueueEntry, filterQueueEntries } from "@/src/lib/queueActions";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";
import QueueEntrySheet from "@/src/components/yard/QueueEntrySheet";
import QueueOverrideSheet from "@/src/components/yard/QueueOverrideSheet";
import { fetchAvailableDocks, type QueueEntryRow } from "@/src/services/queueService";
import { YmsApiError } from "@/src/lib/ymsApi";

export default function YardQueueScreen() {
  const { user, can, isYardAdmin } = useYardAuth();
  const { openVehicle360 } = useYardVehicle360();
  const params = useLocalSearchParams<{ q?: string }>();
  const { data, isLoading, isRefetching, refetch, error } = useQueueBundle();
  const { data: dockData } = useDockAvailability({ enabled: hasDocksModuleAccess(can) });
  const mutations = useQueueMutations();

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntryRow | null>(null);
  const [assignDocks, setAssignDocks] = useState<Awaited<ReturnType<typeof fetchAvailableDocks>>>([]);
  const [assignDocksLoading, setAssignDocksLoading] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const allowed = canAccessYardScreen("queue", can, isYardAdmin, user?.role);
  const canCall = can("*") || can(YMS_PERMISSIONS.FLOW_CALL);
  const showDockChips = hasDocksModuleAccess(can);

  useEffect(() => {
    const q = typeof params.q === "string" ? params.q.trim() : "";
    if (q) setSearch(q);
  }, [params.q]);

  const filteredEntries = useMemo(
    () => filterQueueEntries(data?.entries || [], search),
    [data?.entries, search],
  );

  const openEntry = useCallback(
    async (entry: QueueEntryRow) => {
      setSelectedEntry(entry);
      setSheetOpen(true);
      if (can("*") || can(YMS_PERMISSIONS.FLOW_ASSIGN_DOCK)) {
        setAssignDocksLoading(true);
        try {
          setAssignDocks(await fetchAvailableDocks());
        } catch {
          setAssignDocks([]);
        } finally {
          setAssignDocksLoading(false);
        }
      }
    },
    [can],
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setSelectedEntry(null);
    setAssignDocks([]);
  }, []);

  const refreshAll = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleCall = useCallback(
    async (entry: QueueEntryRow) => {
      try {
        await mutations.callEntry.mutateAsync(entry.queueEntryId);
        Alert.alert("Called in", `${entry.plate || "Vehicle"} has been called.`);
        await refreshAll();
        if (sheetOpen && selectedEntry?.queueEntryId === entry.queueEntryId) {
          setSelectedEntry({ ...entry, status: "CALLED", displayStatus: "CALLED" });
          if (can("*") || can(YMS_PERMISSIONS.FLOW_ASSIGN_DOCK)) {
            setAssignDocks(await fetchAvailableDocks());
          }
        }
      } catch (err) {
        Alert.alert(
          "Call failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [can, mutations.callEntry, refreshAll, selectedEntry?.queueEntryId, sheetOpen],
  );

  const handleAssignDock = useCallback(
    async (dockId: string, entry = selectedEntry) => {
      if (!entry) return;
      try {
        await mutations.assignDock.mutateAsync({ queueEntryId: entry.queueEntryId, dockId });
        const dockLabel = assignDocks.find((dock) => dock.id === dockId)?.dockCode || "dock";
        Alert.alert("Dock assigned", `${entry.plate || "Vehicle"} assigned to ${dockLabel}.`);
        closeSheet();
        await refreshAll();
      } catch (err) {
        Alert.alert(
          "Assign failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [assignDocks, closeSheet, mutations.assignDock, refreshAll, selectedEntry],
  );

  const handleOverride = useCallback(
    async (payload: { targetRank: number; reason: string; supervisor: string }) => {
      if (!selectedEntry) return;
      try {
        await mutations.overrideRank.mutateAsync({
          queueEntryId: selectedEntry.queueEntryId,
          ...payload,
        });
        Alert.alert("Override applied", `${selectedEntry.plate || "Vehicle"} moved to rank ${payload.targetRank}.`);
        setOverrideOpen(false);
        closeSheet();
        await refreshAll();
      } catch (err) {
        Alert.alert(
          "Override failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [closeSheet, mutations.overrideRank, refreshAll, selectedEntry],
  );

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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.overline}>YARD · QUEUE</Text>
        <Text style={styles.title}>Virtual queue</Text>
        <Text style={styles.subtitle}>Tap a vehicle to call it in or assign a dock.</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search plate, booking, transporter"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            testID="queue-search-input"
          />
        </View>

        {showDockChips && dockData?.summary ? (
          <View style={styles.dockStrip}>
            <DockChip label="Available" value={dockData.summary.available} tone="success" />
            <DockChip label="Occupied" value={dockData.summary.occupied} tone="warning" />
            <DockChip label="Delayed" value={dockData.summary.delayed} tone="muted" />
          </View>
        ) : null}

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

            {filteredEntries.map((entry) => {
              const badge = statusColor(entry.displayStatus || entry.status || "waiting");
              const showQuickCall = canCall && canCallQueueEntry(entry);
              return (
                <View key={entry.queueEntryId} style={styles.rowCard}>
                  <TouchableOpacity onPress={() => openEntry(entry)} testID={`queue-row-${entry.queueEntryId}`}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rank}>#{entry.queueRank ?? "—"}</Text>
                      <Text style={styles.plate}>{entry.plate || "Vehicle"}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.fg }]}>
                          {entry.displayStatus || entry.status || "WAITING"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>{entry.transporter || "Transporter"} · Dock {entry.dockCode || "—"}</Text>
                    <Text style={styles.meta}>
                      Wait {entry.waitingMin ?? 0} min · Priority {entry.priorityScore ?? 0}
                    </Text>
                    {entry.recommendedDock?.dockCode ? (
                      <Text style={styles.recLine}>Suggested dock {entry.recommendedDock.dockCode}</Text>
                    ) : null}
                  </TouchableOpacity>
                  <View style={styles.rowFooter}>
                    <Text style={styles.rowHint}>Tap row for full actions</Text>
                    <View style={styles.rowActions}>
                      {entry.vehicleId ? (
                        <TouchableOpacity
                          style={styles.profileBtn}
                          onPress={() => openVehicle360({ vehicleId: entry.vehicleId, query: entry.plate })}
                          testID={`queue-360-${entry.queueEntryId}`}
                        >
                          <Text style={styles.profileBtnText}>360</Text>
                        </TouchableOpacity>
                      ) : null}
                      {showQuickCall ? (
                        <TouchableOpacity
                          style={styles.quickCallBtn}
                          onPress={() => void handleCall(entry)}
                          testID={`queue-quick-call-${entry.queueEntryId}`}
                        >
                          <Text style={styles.quickCallText}>Call in</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
            {!filteredEntries.length ? <Text style={styles.muted}>Queue is empty.</Text> : null}
          </>
        )}
      </ScrollView>

      <QueueEntrySheet
        visible={sheetOpen}
        entry={selectedEntry}
        docks={assignDocks}
        docksLoading={assignDocksLoading}
        actionBusy={mutations.busy}
        can={can}
        onClose={closeSheet}
        onCall={() => selectedEntry && void handleCall(selectedEntry)}
        onAssignDock={(dockId) => void handleAssignDock(dockId)}
        onOverride={() => setOverrideOpen(true)}
      />

      <QueueOverrideSheet
        visible={overrideOpen}
        entry={selectedEntry}
        supervisorName={user?.displayName || user?.username || "Supervisor"}
        busy={mutations.busy}
        onClose={() => setOverrideOpen(false)}
        onConfirm={(payload) => {
          void handleOverride(payload);
        }}
      />
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

function DockChip({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "muted" }) {
  const palette =
    tone === "success"
      ? { bg: colors.successBg, fg: colors.success }
      : tone === "warning"
        ? { bg: colors.warningBg, fg: colors.warning }
        : { bg: colors.surfaceAlt, fg: colors.textSecondary };

  return (
    <View style={[styles.dockChip, { backgroundColor: palette.bg }]}>
      <Text style={[styles.dockChipValue, { color: palette.fg }]}>{value}</Text>
      <Text style={styles.dockChipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md, lineHeight: 19 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 10 },
  dockStrip: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  dockChip: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dockChipValue: { fontSize: 18, fontWeight: "900" },
  dockChipLabel: { fontSize: 10, fontWeight: "700", color: colors.textSecondary, marginTop: 4 },
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
  recLine: { fontSize: 11, color: colors.shipgenOrange, marginTop: 6, fontWeight: "700" },
  rowFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  profileBtn: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  profileBtnText: { fontSize: 11, fontWeight: "800", color: colors.shipgenOrange },
  rowHint: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  quickCallBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickCallText: { color: "#fff", fontSize: 11, fontWeight: "800" },
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
