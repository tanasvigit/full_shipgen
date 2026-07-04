import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useGateDashboard } from "@/src/hooks/useGateDashboard";
import { useGateMutations } from "@/src/hooks/useGateMutations";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardVehicle360 } from "@/src/contexts/YardVehicle360Context";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import {
  countGateActivityByTab,
  filterGateActivity,
  formatRejectReason,
  GATE_ACTIVITY_TABS,
  GATE_TAB_LABELS,
  type GatePipelineTab,
  type GateScreenMode,
  type GateActionId,
} from "@/src/lib/gateActions";
import GateVehicleSheet from "@/src/components/yard/GateVehicleSheet";
import GateScanModal from "@/src/components/yard/GateScanModal";
import GateRejectSheet, { type GateRejectPayload } from "@/src/components/yard/GateRejectSheet";
import {
  lookupGateVehicle,
  lookupQueryFromRow,
  mergeExitChecklistUpdate,
  type GateActivityRow,
  type GateVehicleContext,
} from "@/src/services/gateService";
import { patchExitCheck } from "@/src/lib/gateChecklist";
import { YmsApiError } from "@/src/lib/ymsApi";
import { gateKpiSelection, type GateKpiKey } from "@/src/lib/kpiNavigation";
import YardKpiStat from "@/src/components/yard/YardKpiStat";
import { useYardMoreBackHandler } from "@/src/components/yard/YardMoreBackHandler";

const KPI_ITEMS: { key: GateKpiKey; label: string }[] = [
  { key: "approaching", label: "Approaching" },
  { key: "arrived", label: "Arrived" },
  { key: "checkedIn", label: "Checked In" },
  { key: "waiting", label: "Waiting" },
  { key: "exitHolding", label: "Exit Hold" },
  { key: "exitedToday", label: "Exited Today" },
] as const;

type RejectTarget = { kind: "entry" | "exit"; vehicleId: string };

export default function YardGateScreen() {
  useYardMoreBackHandler();
  const { user, can, isYardAdmin } = useYardAuth();
  const { openVehicle360 } = useYardVehicle360();
  const params = useLocalSearchParams<{ q?: string; mode?: string; tab?: string }>();
  const { data, isLoading, isRefetching, refetch, error } = useGateDashboard();
  const mutations = useGateMutations(data?.gateId || "G1");

  const [mode, setMode] = useState<GateScreenMode>("entry");
  const [pipelineTab, setPipelineTab] = useState<GatePipelineTab>("ALL");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [vehicleContext, setVehicleContext] = useState<GateVehicleContext | null>(null);
  const [lookupQuery, setLookupQuery] = useState("");

  const allowed = canAccessYardScreen("gate", can, isYardAdmin, user?.role);

  const filteredRows = useMemo(
    () => filterGateActivity(data?.activity || [], mode, search, pipelineTab),
    [data?.activity, mode, pipelineTab, search],
  );

  const tabCounts = useMemo(
    () => countGateActivityByTab(data?.activity || [], mode),
    [data?.activity, mode],
  );

  const pipelineTabs = useMemo(() => {
    if (mode === "exit") return [] as GatePipelineTab[];
    return ["ALL", ...GATE_ACTIVITY_TABS] as GatePipelineTab[];
  }, [mode]);

  const loadVehicleContext = useCallback(
    async (query: string, options?: { silent?: boolean }) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setLookupQuery(trimmed);
      if (!options?.silent) {
        setContextLoading(true);
      }
      setContextError(null);
      try {
        const ctx = await lookupGateVehicle(trimmed, data?.gateId || "G1");
        if (!ctx) {
          setVehicleContext(null);
          setContextError("Vehicle not found at this gate.");
          return;
        }
        setVehicleContext(ctx);
      } catch (err) {
        setVehicleContext(null);
        setContextError(err instanceof YmsApiError ? err.message : "Unable to load vehicle.");
      } finally {
        if (!options?.silent) {
          setContextLoading(false);
        }
      }
    },
    [data?.gateId],
  );

  const openVehicle = useCallback(
    (row: GateActivityRow) => {
      setSheetOpen(true);
      void loadVehicleContext(lookupQueryFromRow(row));
    },
    [loadVehicleContext],
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setVehicleContext(null);
    setContextError(null);
  }, []);

  const refreshAfterAction = useCallback(async () => {
    await refetch();
    if (lookupQuery) {
      await loadVehicleContext(lookupQuery, { silent: true });
    }
  }, [loadVehicleContext, lookupQuery, refetch]);

  const submitReject = useCallback(
    async (payload: GateRejectPayload) => {
      if (!rejectTarget) return;
      const reason = formatRejectReason(payload.reason, payload.note, Boolean(payload.photoUri));
      try {
        if (rejectTarget.kind === "entry") {
          await mutations.rejectEntry.mutateAsync({ vehicleId: rejectTarget.vehicleId, reason });
          Alert.alert("Entry rejected", reason);
        } else {
          await mutations.rejectExit.mutateAsync({ vehicleId: rejectTarget.vehicleId, reason });
          Alert.alert("Exit rejected", reason);
        }
        setRejectTarget(null);
        closeSheet();
        await refreshAfterAction();
      } catch (err) {
        Alert.alert(
          "Reject failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [closeSheet, mutations.rejectEntry, mutations.rejectExit, refreshAfterAction, rejectTarget],
  );

  const handleGateAction = useCallback(
    async (actionId: GateActionId) => {
      if (!vehicleContext) return;

      try {
        if (actionId === "mark_arrived") {
          await mutations.markArrived.mutateAsync(vehicleContext.vehicleId);
          Alert.alert("Marked arrived", "Vehicle is now at the gate.");
        } else if (actionId === "approve_entry") {
          await mutations.approveEntry.mutateAsync(vehicleContext);
          Alert.alert("Entry approved", "Vehicle checked in and queued.");
        } else if (actionId === "reject_entry") {
          setRejectTarget({ kind: "entry", vehicleId: vehicleContext.vehicleId });
          return;
        } else if (actionId === "verify_exit") {
          await mutations.verifyExit.mutateAsync(vehicleContext.vehicleId);
          Alert.alert("Exit verified", "Vehicle cleared for gate out.");
        } else if (actionId === "gate_out") {
          await mutations.gateOut.mutateAsync(vehicleContext.vehicleId);
          Alert.alert("Gate out complete", "Vehicle has exited the yard.");
          closeSheet();
        } else if (actionId === "reject_exit") {
          setRejectTarget({ kind: "exit", vehicleId: vehicleContext.vehicleId });
          return;
        }
        await refreshAfterAction();
      } catch (err) {
        Alert.alert(
          "Action failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [closeSheet, mutations, refreshAfterAction, vehicleContext],
  );

  const handleToggleExitCheck = useCallback(
    async (field: string, value: boolean) => {
      if (!vehicleContext) return;
      const previous = vehicleContext;
      setVehicleContext({
        ...vehicleContext,
        exitChecks: patchExitCheck(vehicleContext.exitChecks, field, value),
      });
      try {
        const updated = await mutations.toggleExitCheck.mutateAsync({
          vehicleId: vehicleContext.vehicleId,
          field,
          value,
        });
        setVehicleContext((current) =>
          current && current.vehicleId === previous.vehicleId
            ? mergeExitChecklistUpdate(current, updated)
            : current,
        );
      } catch (err) {
        setVehicleContext(previous);
        Alert.alert(
          "Update failed",
          err instanceof YmsApiError ? err.message : err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [mutations.toggleExitCheck, vehicleContext],
  );

  const submitSearch = useCallback(() => {
    const trimmed = search.trim();
    if (!trimmed) return;
    setSheetOpen(true);
    void loadVehicleContext(trimmed);
  }, [loadVehicleContext, search]);

  const handleScan = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setSearch(trimmed);
      setSheetOpen(true);
      try {
        await mutations.scanBarcode.mutateAsync({ query: trimmed, scanType: "BARCODE" });
      } catch {
        /* scan audit is best-effort */
      }
      await loadVehicleContext(trimmed);
      setScanOpen(false);
    },
    [loadVehicleContext, mutations.scanBarcode],
  );

  useEffect(() => {
    const q = typeof params.q === "string" ? params.q.trim() : "";
    if (!q) return;
    setSearch(q);
    setSheetOpen(true);
    void loadVehicleContext(q);
  }, [loadVehicleContext, params.q]);

  useEffect(() => {
    if (params.mode === "entry" || params.mode === "exit") {
      setMode(params.mode);
    }
    if (params.tab && params.tab !== "ALL") {
      setPipelineTab(params.tab as GatePipelineTab);
    }
  }, [params.mode, params.tab]);

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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.overline}>YARD · GATE</Text>
        <Text style={styles.title}>Gate dashboard</Text>
        <Text style={styles.subtitle}>
          {user?.displayName || user?.username} · tap a vehicle for check-in and exit actions
        </Text>

        <View style={styles.modeRow}>
          {(["entry", "exit"] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.modeBtn, mode === value && styles.modeBtnActive]}
              onPress={() => setMode(value)}
              testID={`gate-mode-${value}`}
            >
              <Text style={[styles.modeText, mode === value && styles.modeTextActive]}>
                {value === "entry" ? "Entry" : "Exit holding"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search plate or appointment"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
            testID="gate-search-input"
          />
          <TouchableOpacity onPress={() => setScanOpen(true)} testID="gate-scan-open">
            <Ionicons name="barcode-outline" size={18} color={colors.shipgenOrange} />
          </TouchableOpacity>
          <TouchableOpacity onPress={submitSearch} testID="gate-search-submit">
            <Text style={styles.searchAction}>Open</Text>
          </TouchableOpacity>
        </View>

        {mode === "entry" && pipelineTabs.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pipelineRow}
          >
            {pipelineTabs.map((tab) => {
              const active = pipelineTab === tab;
              const count = tabCounts[tab] ?? 0;
              const label = tab === "ALL" ? "All" : GATE_TAB_LABELS[tab] || tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.pipelineChip, active && styles.pipelineChipActive]}
                  onPress={() => setPipelineTab(tab)}
                  testID={`gate-pipeline-${tab}`}
                >
                  <Text style={[styles.pipelineText, active && styles.pipelineTextActive]}>
                    {label}
                    {count ? ` (${count})` : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

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
                <YardKpiStat
                  key={item.key}
                  label={item.label}
                  value={data?.kpis?.[item.key] ?? 0}
                  onPress={() => {
                    const next = gateKpiSelection(item.key);
                    setMode(next.mode);
                    setPipelineTab(next.tab);
                  }}
                  testID={`gate-kpi-${item.key}`}
                  style={styles.kpiCard}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>
              {mode === "entry" ? "Entry lane" : "Exit holding"} · {filteredRows.length}
            </Text>
            {filteredRows.slice(0, 25).map((row) => {
              const badge = statusColor(row.activityTab || row.status || "pending");
              return (
                <View key={`${row.vehicleId}-${row.appointment}`} style={styles.rowCard}>
                  <TouchableOpacity onPress={() => openVehicle(row)} testID={`gate-row-${row.vehicleId}`}>
                    <View style={styles.rowTop}>
                      <Text style={styles.plate}>{row.plate || "—"}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.fg }]}>{row.activityTab || row.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>{row.transporter || "—"} · {row.driver || "No driver"}</Text>
                    <Text style={styles.meta}>Appt {row.appointment || "—"} · Slot {row.slot || "—"}</Text>
                  </TouchableOpacity>
                  <View style={styles.rowFooter}>
                    <Text style={styles.rowHint}>Tap for gate actions</Text>
                    <TouchableOpacity
                      style={styles.profileBtn}
                      onPress={() => openVehicle360({ vehicleId: row.vehicleId, query: row.plate })}
                      testID={`gate-360-${row.vehicleId}`}
                    >
                      <Ionicons name="person-circle-outline" size={14} color={colors.shipgenOrange} />
                      <Text style={styles.profileBtnText}>360</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {!filteredRows.length ? (
              <Text style={styles.muted}>
                {mode === "entry" ? "No entry-lane vehicles right now." : "No vehicles in exit holding."}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>

      <GateVehicleSheet
        visible={sheetOpen}
        mode={mode}
        context={vehicleContext}
        loading={contextLoading}
        actionBusy={mutations.actionBusy}
        error={contextError}
        can={can}
        onClose={closeSheet}
        onRefresh={() => loadVehicleContext(lookupQuery, { silent: Boolean(vehicleContext) })}
        onAction={handleGateAction}
        onToggleExitCheck={handleToggleExitCheck}
      />

      <GateScanModal
        visible={scanOpen}
        busy={mutations.scanBarcode.isPending}
        onClose={() => setScanOpen(false)}
        onScan={(value) => {
          void handleScan(value);
        }}
      />

      <GateRejectSheet
        visible={Boolean(rejectTarget)}
        title={rejectTarget?.kind === "exit" ? "Reject exit" : "Reject entry"}
        busy={mutations.rejectEntry.isPending || mutations.rejectExit.isPending}
        onClose={() => setRejectTarget(null)}
        onConfirm={(payload) => {
          void submitReject(payload);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md, lineHeight: 19 },
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  modeText: { fontSize: 12, fontWeight: "800", color: colors.textSecondary },
  modeTextActive: { color: "#fff" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 10 },
  searchAction: { color: colors.shipgenOrange, fontWeight: "800", fontSize: 12 },
  pipelineRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  pipelineChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  pipelineChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  pipelineText: { fontSize: 10, fontWeight: "800", color: colors.textSecondary },
  pipelineTextActive: { color: "#fff" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  kpiCard: {
    width: "31%",
    minWidth: 100,
    flexGrow: 1,
  },
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
  rowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowHint: { fontSize: 11, color: colors.textMuted },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  profileBtnText: { fontSize: 11, fontWeight: "800", color: colors.shipgenOrange },
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
