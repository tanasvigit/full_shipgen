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
import { useQueryClient } from "@tanstack/react-query";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useDockBoard } from "@/src/hooks/useDockBoard";
import { useDockMutations } from "@/src/hooks/useDockMutations";
import { useQueueMutations } from "@/src/hooks/useQueueMutations";
import { useDockResources } from "@/src/hooks/useDockResources";
import { useDockCallableQueue } from "@/src/hooks/useDockCallableQueue";
import { useDockReadiness } from "@/src/hooks/useDockReadiness";
import { useDockPauseState } from "@/src/hooks/useDockPauseState";
import { useDockCompleteState } from "@/src/hooks/useDockCompleteState";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardVehicle360 } from "@/src/contexts/YardVehicle360Context";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import {
  canCompleteLoading,
  canStartLoading,
  filterDockRows,
  MOBILE_EXCEPTION_TYPES,
  type DockFilter,
} from "@/src/lib/dockActions";
import { dockSummaryFilter } from "@/src/lib/kpiNavigation";
import { DEFAULT_PAUSE_REASON_CODE } from "@/src/lib/dockManageActions";
import YardKpiStat from "@/src/components/yard/YardKpiStat";
import DockDetailSheet from "@/src/components/yard/DockDetailSheet";
import CreateDockSheet from "@/src/components/yard/CreateDockSheet";
import WeighWeightSheet from "@/src/components/yard/WeighWeightSheet";
import { formatWeightKg } from "@/src/services/weighingService";
import type { AssignVehicleResult, DockBoardRow } from "@/src/services/dockService";
import { resolveActiveQueueEntryId } from "@/src/services/dockService";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";
import { formatYmsAlertMessage } from "@/src/lib/ymsErrors";
import { useYardMoreBackHandler } from "@/src/components/yard/YardMoreBackHandler";

const FILTER_OPTIONS: { key: DockFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "available", label: "Available" },
];

function applyVehicleAssignment(
  row: DockBoardRow,
  input: {
    queueEntryId: string;
    vehicleId?: string;
    queueNumber?: string;
    plate?: string | null;
    status?: string;
  },
): DockBoardRow {
  return {
    ...row,
    hasActiveAssignment: true,
    queueEntryId: input.queueEntryId,
    vehicleId: input.vehicleId ?? row.vehicleId ?? null,
    plate: input.plate ?? row.plate ?? null,
    queueNumber: input.queueNumber ?? row.queueNumber ?? null,
    loadingStatus: input.status ?? "DOCK_ASSIGNED",
    vehicleStatus: input.status ?? "DOCK_ASSIGNED",
    status: row.status === "AVAILABLE" ? "OCCUPIED" : row.status,
  };
}

function clearVehicleAssignment(row: DockBoardRow): DockBoardRow {
  return {
    ...row,
    hasActiveAssignment: false,
    vehicleId: null,
    queueEntryId: null,
    appointmentId: null,
    plate: null,
    transporter: null,
    queueNumber: null,
    loadingStatus: null,
    vehicleStatus: null,
    progressPct: 0,
    tareWeightKg: null,
    grossWeightKg: null,
    netWeightKg: null,
    status: row.backendStatus === "OCCUPIED" || row.backendStatus === "LOADING" ? "AVAILABLE" : row.status,
  };
}

export default function YardDocksScreen() {
  useYardMoreBackHandler();
  const queryClient = useQueryClient();
  const { user, can, isYardAdmin } = useYardAuth();
  const { openVehicle360 } = useYardVehicle360();
  const params = useLocalSearchParams<{ q?: string; filter?: string }>();
  const { data, isLoading, isRefetching, refetch, error, isError } = useDockBoard();
  const mutations = useDockMutations();
  const queueMutations = useQueueMutations();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DockFilter>("all");
  const [grossOpen, setGrossOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DockBoardRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const allowed = canAccessYardScreen("docks", can, isYardAdmin, user?.role);
  const canWriteDock = can("*") || can(YMS_PERMISSIONS.DOCK_WRITE);
  const canAssignVehicle =
    can("*") || can(YMS_PERMISSIONS.FLOW_ASSIGN_DOCK) || can(YMS_PERMISSIONS.QUEUE_WRITE);
  const canAssignLabor = can("*") || can(YMS_PERMISSIONS.LABOR_WRITE) || can(YMS_PERMISSIONS.DOCK_WRITE);
  const canAssignEquipment =
    can("*") || can(YMS_PERMISSIONS.EQUIPMENT_WRITE) || can(YMS_PERMISSIONS.DOCK_WRITE);

  const resourcesEnabled =
    sheetOpen && Boolean(selectedRow) && (canAssignLabor || canAssignEquipment);
  const readinessEnabled = sheetOpen && Boolean(selectedRow?.vehicleId);
  const pauseStateEnabled =
    sheetOpen && Boolean(selectedRow?.vehicleId || selectedRow?.queueEntryId);
  const completeStateEnabled = pauseStateEnabled;
  const callableEnabled = sheetOpen && canAssignVehicle && !selectedRow?.hasActiveAssignment;

  const { data: resourceData, isLoading: resourcesLoading, refetch: refetchResources } = useDockResources(
    resourcesEnabled,
    selectedRow?.id,
  );
  const { data: callableQueue = [], isLoading: callableLoading, refetch: refetchCallable } = useDockCallableQueue(
    callableEnabled,
  );
  const {
    data: readiness,
    isLoading: readinessLoading,
    refetch: refetchReadiness,
  } = useDockReadiness(selectedRow?.vehicleId, readinessEnabled);
  const {
    data: pauseState,
    isLoading: pauseStateLoading,
    refetch: refetchPauseState,
  } = useDockPauseState(selectedRow?.vehicleId, selectedRow?.queueEntryId, pauseStateEnabled);
  const {
    data: completeState,
    isLoading: completeStateLoading,
    refetch: refetchCompleteState,
  } = useDockCompleteState(selectedRow?.vehicleId, selectedRow?.queueEntryId, completeStateEnabled);

  useEffect(() => {
    const q = typeof params.q === "string" ? params.q.trim() : "";
    if (q) setSearch(q);
  }, [params.q]);

  useEffect(() => {
    const next = params.filter;
    if (next === "all" || next === "active" || next === "available" || next === "loading" || next === "delayed") {
      setFilter(next);
    }
  }, [params.filter]);

  useEffect(() => {
    if (!sheetOpen || !selectedRow?.id || !data?.rows?.length) return;
    const fresh = data.rows.find((row) => row.id === selectedRow.id);
    if (!fresh) return;
    if (
      fresh.vehicleId !== selectedRow.vehicleId ||
      fresh.status !== selectedRow.status ||
      fresh.hasActiveAssignment !== selectedRow.hasActiveAssignment ||
      fresh.labor?.id !== selectedRow.labor?.id ||
      fresh.equipment?.id !== selectedRow.equipment?.id
    ) {
      setSelectedRow(fresh);
    }
  }, [data?.rows, selectedRow, sheetOpen]);

  const refreshSelectedDock = useCallback(
    async (dockId: string) => {
      await queryClient.invalidateQueries({ queryKey: ["yard", "docks"] });
      const result = await refetch();
      const fresh = result.data?.rows.find((row) => row.id === dockId);
      if (fresh) setSelectedRow(fresh);
      return fresh;
    },
    [queryClient, refetch],
  );

  const filteredRows = useMemo(
    () => filterDockRows(data?.rows || [], filter, search),
    [data?.rows, filter, search],
  );

  const openRow = useCallback((row: DockBoardRow) => {
    setSelectedRow(row);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setSelectedRow(null);
  }, []);

  const refreshAll = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleStartLoading = useCallback(async () => {
    if (!selectedRow?.vehicleId) return;
    try {
      await mutations.startLoading.mutateAsync(selectedRow.vehicleId);
      Alert.alert("Loading started", `Dock ${selectedRow.code} is now loading.`);
      await refreshAll();
      await refetchReadiness();
    } catch (err) {
      Alert.alert("Action failed", formatYmsAlertMessage(err));
    }
  }, [mutations.startLoading, refetchReadiness, refreshAll, selectedRow]);

  const handleCompleteLoading = useCallback(async () => {
    if (!selectedRow?.vehicleId) return;
    try {
      await mutations.completeLoading.mutateAsync({
        vehicleId: selectedRow.vehicleId,
        appointmentId: selectedRow.appointmentId,
        dockId: selectedRow.id,
        queueEntryId: selectedRow.queueEntryId,
        note: "Loading completed from mobile dock board",
      });
      Alert.alert(
        "Loading complete",
        `Dock ${selectedRow.code} is still occupied. Record gross weight, then release the dock.`,
      );
      await refetchCompleteState();
      await refreshAll();
    } catch (err) {
      Alert.alert("Action failed", formatYmsAlertMessage(err));
    }
  }, [mutations.completeLoading, refetchCompleteState, refreshAll, selectedRow]);

  const handleReleaseDock = useCallback(async () => {
    if (!selectedRow?.vehicleId) return;
    if (selectedRow.grossWeightKg == null) {
      Alert.alert("Gross weight required", "Record gross weight before releasing the dock.");
      setGrossOpen(true);
      return;
    }
    try {
      await mutations.releaseDockEntry.mutateAsync({
        dockId: selectedRow.id,
        row: {
          vehicleId: selectedRow.vehicleId,
          code: selectedRow.code,
          grossWeightKg: selectedRow.grossWeightKg,
        },
      });
      Alert.alert("Dock released", `${selectedRow.code} is ready for the next truck.`);
      closeSheet();
      await refreshAll();
    } catch (err) {
      Alert.alert("Release failed", formatYmsAlertMessage(err));
    }
  }, [closeSheet, mutations.releaseDockEntry, refreshAll, selectedRow]);

  const handleReportException = useCallback(
    async (exceptionType: string) => {
      if (!selectedRow) return;
      const label = MOBILE_EXCEPTION_TYPES.find((item) => item.value === exceptionType)?.label || exceptionType;
      try {
        await mutations.reportException.mutateAsync({
          vehicleId: selectedRow.vehicleId,
          appointmentId: selectedRow.appointmentId,
          queueEntryId: selectedRow.queueEntryId,
          dockId: selectedRow.id,
          exceptionType,
          description: `${label} reported from mobile dock board`,
        });
        Alert.alert("Exception reported", `${label} logged for dock ${selectedRow.code}.`);
        await refreshAll();
      } catch (err) {
        Alert.alert("Action failed", formatYmsAlertMessage(err));
      }
    },
    [mutations.reportException, refreshAll, selectedRow],
  );

  const handleCreateDock = useCallback(
    async (input: { dockName: string; dockType: string; zone: string }) => {
      try {
        await mutations.createDockEntry.mutateAsync(input);
        Alert.alert("Dock created", input.dockName);
        setCreateOpen(false);
        await refreshAll();
      } catch (err) {
        Alert.alert("Create failed", formatYmsAlertMessage(err));
      }
    },
    [mutations.createDockEntry, refreshAll],
  );

  const handlePauseLoading = useCallback(async () => {
    if (!selectedRow) return;
    try {
      await mutations.pauseLoading.mutateAsync({
        vehicleId: selectedRow.vehicleId,
        appointmentId: selectedRow.appointmentId,
        dockId: selectedRow.id,
        queueEntryId: selectedRow.queueEntryId,
        reasonCode: DEFAULT_PAUSE_REASON_CODE,
        note: "Paused from mobile dock board",
      });
      Alert.alert("Loading paused", `Dock ${selectedRow.code}`);
      await refetchPauseState();
      await refreshAll();
    } catch (err) {
      Alert.alert("Pause failed", formatYmsAlertMessage(err));
    }
  }, [mutations.pauseLoading, refetchPauseState, refreshAll, selectedRow]);

  const handleResumeLoading = useCallback(async () => {
    if (!selectedRow) return;
    try {
      await mutations.resumeLoading.mutateAsync({
        vehicleId: selectedRow.vehicleId,
        appointmentId: selectedRow.appointmentId,
        dockId: selectedRow.id,
        queueEntryId: selectedRow.queueEntryId,
      });
      Alert.alert("Loading resumed", `Dock ${selectedRow.code}`);
      await refetchPauseState();
      await refreshAll();
    } catch (err) {
      Alert.alert("Resume failed", formatYmsAlertMessage(err));
    }
  }, [mutations.resumeLoading, refetchPauseState, refreshAll, selectedRow]);

  const handleUpdateStatus = useCallback(
    async (status: string) => {
      if (!selectedRow) return;
      try {
        if (status === "AVAILABLE" && selectedRow.vehicleId) {
          await mutations.releaseDockEntry.mutateAsync({
            dockId: selectedRow.id,
            row: {
              vehicleId: selectedRow.vehicleId,
              code: selectedRow.code,
              grossWeightKg: selectedRow.grossWeightKg,
            },
          });
        } else {
          await mutations.patchDockStatus.mutateAsync({
            dockId: selectedRow.id,
            status,
            notes: `Updated from mobile dock board`,
          });
        }
        Alert.alert("Dock updated", `${selectedRow.code} → ${status}`);
        closeSheet();
        await refreshAll();
      } catch (err) {
        Alert.alert("Update failed", formatYmsAlertMessage(err));
      }
    },
    [closeSheet, mutations.patchDockStatus, mutations.releaseDockEntry, refreshAll, selectedRow],
  );

  const handleAssignLabor = useCallback(
    async (laborId: string) => {
      if (!selectedRow) return;
      const dockId = selectedRow.id;
      try {
        await mutations.assignLabor.mutateAsync({ dockId, laborId });
        Alert.alert("Labor assigned", `Team assigned to dock ${selectedRow.code}`);
        await refreshSelectedDock(dockId);
        await refetchResources();
        const fresh = data?.rows.find((row) => row.id === dockId);
        if (fresh?.vehicleId) await refetchReadiness();
      } catch (err) {
        Alert.alert("Assign failed", formatYmsAlertMessage(err));
      }
    },
    [data?.rows, mutations.assignLabor, refetchReadiness, refetchResources, refreshSelectedDock, selectedRow],
  );

  const handleUnassignLabor = useCallback(
    async (laborId: string) => {
      if (!selectedRow) return;
      const dockId = selectedRow.id;
      try {
        await mutations.releaseLabor.mutateAsync(laborId);
        Alert.alert("Labor unassigned", `Team removed from dock ${selectedRow.code}`);
        await refreshSelectedDock(dockId);
        await refetchResources();
        const fresh = data?.rows.find((row) => row.id === dockId);
        if (fresh?.vehicleId) await refetchReadiness();
      } catch (err) {
        Alert.alert("Unassign failed", formatYmsAlertMessage(err));
      }
    },
    [data?.rows, mutations.releaseLabor, refetchReadiness, refetchResources, refreshSelectedDock, selectedRow],
  );

  const handleAssignEquipment = useCallback(
    async (equipmentId: string) => {
      if (!selectedRow) return;
      const dockId = selectedRow.id;
      try {
        await mutations.assignEquipment.mutateAsync({ dockId, equipmentId });
        Alert.alert("Equipment assigned", `Equipment assigned to dock ${selectedRow.code}`);
        await refreshSelectedDock(dockId);
        await refetchResources();
        const fresh = data?.rows.find((row) => row.id === dockId);
        if (fresh?.vehicleId) await refetchReadiness();
      } catch (err) {
        Alert.alert("Assign failed", formatYmsAlertMessage(err));
      }
    },
    [data?.rows, mutations.assignEquipment, refetchReadiness, refetchResources, refreshSelectedDock, selectedRow],
  );

  const handleUnassignEquipment = useCallback(
    async (equipmentId: string) => {
      if (!selectedRow) return;
      const dockId = selectedRow.id;
      try {
        await mutations.releaseEquipment.mutateAsync(equipmentId);
        Alert.alert("Equipment unassigned", `Equipment removed from dock ${selectedRow.code}`);
        await refreshSelectedDock(dockId);
        await refetchResources();
        const fresh = data?.rows.find((row) => row.id === dockId);
        if (fresh?.vehicleId) await refetchReadiness();
      } catch (err) {
        Alert.alert("Unassign failed", formatYmsAlertMessage(err));
      }
    },
    [data?.rows, mutations.releaseEquipment, refetchReadiness, refetchResources, refreshSelectedDock, selectedRow],
  );

  const handleReleaseResources = useCallback(async () => {
    if (!selectedRow) return;
    const dockId = selectedRow.id;
    try {
      await mutations.releaseResources.mutateAsync(dockId);
      Alert.alert("Resources released", `Labor and equipment cleared from ${selectedRow.code}`);
      await refreshSelectedDock(dockId);
      await refetchResources();
    } catch (err) {
      Alert.alert("Release failed", formatYmsAlertMessage(err));
    }
  }, [mutations.releaseResources, refetchResources, refreshSelectedDock, selectedRow]);

  const handleUnassignVehicle = useCallback(async () => {
    if (!selectedRow?.hasActiveAssignment) return;
    const dockId = selectedRow.id;
    try {
      let queueEntryId = selectedRow.queueEntryId;
      if (!queueEntryId) {
        queueEntryId = await resolveActiveQueueEntryId(dockId, selectedRow.vehicleId);
      }
      if (!queueEntryId) {
        Alert.alert(
          "Unassign failed",
          "Could not find the queue entry for this dock assignment. Pull to refresh and try again.",
        );
        return;
      }
      await mutations.unassignVehicle.mutateAsync(queueEntryId);
      setSelectedRow((prev) => (prev && prev.id === dockId ? clearVehicleAssignment(prev) : prev));
      Alert.alert("Vehicle unassigned", `${selectedRow.plate || "Vehicle"} removed from dock ${selectedRow.code}`);
      await refreshSelectedDock(dockId);
      await refetchCallable();
      await refetchResources();
    } catch (err) {
      Alert.alert("Unassign failed", formatYmsAlertMessage(err));
    }
  }, [
    mutations.unassignVehicle,
    refetchCallable,
    refetchResources,
    refreshSelectedDock,
    selectedRow,
  ]);

  const handleGross = useCallback(
    async (weightKg: number) => {
      if (!selectedRow?.queueEntryId) return;
      try {
        const result = await queueMutations.recordGross.mutateAsync({
          queueEntryId: selectedRow.queueEntryId,
          weightKg,
        });
        Alert.alert(
          "Gross recorded",
          `Net weight ${Number(result.netWeightKg).toLocaleString("en-IN")} kg`,
        );
        setGrossOpen(false);
        await refreshAll();
        await refetchCompleteState();
        const fresh = (await refetch()).data?.rows.find((row) => row.id === selectedRow.id);
        if (fresh) setSelectedRow(fresh);
      } catch (err) {
        Alert.alert("Gross failed", formatYmsAlertMessage(err));
      }
    },
    [queueMutations.recordGross, refetch, refetchCompleteState, refreshAll, selectedRow],
  );

  const handleAssignVehicle = useCallback(
    async (queueEntryId: string) => {
      if (!selectedRow) return;
      const dockId = selectedRow.id;
      const picked = callableQueue.find((entry) => entry.id === queueEntryId);
      try {
        const assigned = await mutations.assignVehicle.mutateAsync({ dockId, queueEntryId });
        setSelectedRow((prev) =>
          prev && prev.id === dockId
            ? applyVehicleAssignment(prev, {
                queueEntryId: assigned.queueEntryId,
                vehicleId: assigned.vehicleId ?? picked?.vehicleId,
                queueNumber: assigned.queueNumber,
                plate: picked?.plate,
                status: assigned.status,
              })
            : prev,
        );
        Alert.alert("Vehicle assigned", `Queue entry assigned to dock ${selectedRow.code}`);
        await refreshSelectedDock(dockId);
        await refetchCallable();
        await refetchResources();
        const fresh = data?.rows.find((row) => row.id === dockId);
        if (fresh?.vehicleId) await refetchReadiness();
      } catch (err) {
        Alert.alert("Assign failed", formatYmsAlertMessage(err));
      }
    },
    [
      callableQueue,
      data?.rows,
      mutations.assignVehicle,
      refetchCallable,
      refetchResources,
      refetchReadiness,
      refreshSelectedDock,
      selectedRow,
    ],
  );

  const handleQuickStart = useCallback(
    async (row: DockBoardRow) => {
      if (!row.vehicleId) return;
      try {
        await mutations.startLoading.mutateAsync(row.vehicleId);
        Alert.alert("Loading started", `Dock ${row.code} is now loading.`);
        await refreshAll();
      } catch (err) {
        Alert.alert("Action failed", formatYmsAlertMessage(err));
      }
    },
    [mutations.startLoading, refreshAll],
  );

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refreshAll()} tintColor={colors.shipgenOrange} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>YARD · DOCKS</Text>
            <Text style={styles.title}>Dock board</Text>
            <Text style={styles.subtitle}>Tap a dock for loading ops, status, and exceptions.</Text>
          </View>
          {canWriteDock ? (
            <TouchableOpacity style={styles.createBtn} onPress={() => setCreateOpen(true)} testID="docks-create-open">
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createBtnText}>New</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search dock, plate, transporter"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            testID="dock-search-input"
          />
        </View>

        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.filterChip, filter === option.key && styles.filterChipActive]}
              onPress={() => setFilter(option.key)}
              testID={`dock-filter-${option.key}`}
            >
              <Text style={[styles.filterChipText, filter === option.key && styles.filterChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {data?.summary ? (
          <View style={styles.summaryRow}>
            {(
              [
                ["available", "Available", data.summary.available],
                ["occupied", "Occupied", data.summary.occupied],
                ["loading", "Loading", data.summary.loading],
                ["delayed", "Delayed", data.summary.delayed],
              ] as const
            ).map(([key, label, value]) => {
              const nextFilter = dockSummaryFilter(key);
              return (
                <YardKpiStat
                  key={key}
                  label={label}
                  value={value}
                  onPress={() => setFilter(nextFilter)}
                  testID={`docks-kpi-${key}`}
                  style={[styles.summaryChip, filter === nextFilter && styles.summaryChipActive]}
                />
              );
            })}
          </View>
        ) : null}

        {isLoading && !data ? (
          <Text style={styles.muted}>Loading dock board…</Text>
        ) : isError && !data ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load docks</Text>
            <Text style={styles.muted}>{error instanceof Error ? error.message : "Check YMS service."}</Text>
          </View>
        ) : (
          <>
            {filteredRows.map((row) => {
              const badge = statusColor(row.status || "available");
              const showQuickStart = canStartLoading(row);
              return (
                <View key={row.id} style={styles.rowCard}>
                  <TouchableOpacity onPress={() => openRow(row)} testID={`dock-row-${row.code}`}>
                    <View style={styles.rowTop}>
                      <Text style={styles.dockCode}>{row.code}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>{row.name}{row.zone ? ` · ${row.zone}` : ""}</Text>
                    {row.hasActiveAssignment ? (
                      <>
                        <Text style={styles.plate}>{row.plate || "Vehicle"}</Text>
                        <Text style={styles.meta}>
                          {row.transporter || "Transporter"}
                          {row.loadingStatus ? ` · ${row.loadingStatus}` : ""}
                        </Text>
                        {row.labor ? (
                          <Text style={styles.meta}>Labor · {row.labor.code} · {row.labor.name}</Text>
                        ) : null}
                        {row.equipment ? (
                          <Text style={styles.meta}>Equipment · {row.equipment.code} · {row.equipment.name}</Text>
                        ) : null}
                        <View style={styles.weighRow}>
                          <Text style={styles.weighChip}>TW {formatWeightKg(row.tareWeightKg)}</Text>
                          <Text style={styles.weighChip}>GW {formatWeightKg(row.grossWeightKg)}</Text>
                          <Text style={[styles.weighChip, styles.weighNet]}>NW {formatWeightKg(row.netWeightKg)}</Text>
                        </View>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${row.progressPct}%` }]} />
                        </View>
                      </>
                    ) : (
                      <Text style={styles.meta}>No active assignment</Text>
                    )}
                  </TouchableOpacity>
                  <View style={styles.rowFooter}>
                    <Text style={styles.rowHint}>Tap row for full actions</Text>
                    <View style={styles.rowActions}>
                      {row.vehicleId ? (
                        <TouchableOpacity
                          style={styles.profileBtn}
                          onPress={() => openVehicle360({ vehicleId: row.vehicleId, query: row.plate || undefined })}
                          testID={`dock-360-${row.code}`}
                        >
                          <Text style={styles.profileBtnText}>360</Text>
                        </TouchableOpacity>
                      ) : null}
                      {showQuickStart && !canCompleteLoading(row) ? (
                        <TouchableOpacity
                          style={styles.quickBtn}
                          onPress={() => void handleQuickStart(row)}
                          testID={`dock-quick-start-${row.code}`}
                        >
                          <Text style={styles.quickBtnText}>Start loading</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
            {!filteredRows.length ? <Text style={styles.muted}>No docks match this filter.</Text> : null}
          </>
        )}
      </ScrollView>

      <DockDetailSheet
        visible={sheetOpen}
        row={selectedRow}
        actionBusy={mutations.busy}
        can={can}
        onClose={closeSheet}
        onStartLoading={() => void handleStartLoading()}
        onCompleteLoading={() => void handleCompleteLoading()}
        onReleaseDock={() => void handleReleaseDock()}
        onReportException={(type) => void handleReportException(type)}
        onPauseLoading={() => void handlePauseLoading()}
        onResumeLoading={() => void handleResumeLoading()}
        onUpdateStatus={(status) => void handleUpdateStatus(status)}
        canAssignVehicle={canAssignVehicle}
        canAssignLabor={canAssignLabor}
        canAssignEquipment={canAssignEquipment}
        callableQueue={callableQueue}
        callableLoading={callableLoading}
        onAssignVehicle={(queueEntryId) => void handleAssignVehicle(queueEntryId)}
        laborOptions={resourceData?.labor}
        equipmentOptions={resourceData?.equipment}
        resourcesLoading={resourcesLoading}
        onAssignLabor={(laborId) => void handleAssignLabor(laborId)}
        onAssignEquipment={(equipmentId) => void handleAssignEquipment(equipmentId)}
        onUnassignLabor={(laborId) => void handleUnassignLabor(laborId)}
        onUnassignEquipment={(equipmentId) => void handleUnassignEquipment(equipmentId)}
        onUnassignVehicle={() => void handleUnassignVehicle()}
        onReleaseResources={() => void handleReleaseResources()}
        onGrossWeight={() => setGrossOpen(true)}
        readiness={readiness}
        readinessLoading={readinessLoading}
        pauseState={pauseState}
        pauseStateLoading={pauseStateLoading}
        completeState={completeState}
        completeStateLoading={completeStateLoading}
      />

      <WeighWeightSheet
        visible={grossOpen}
        title="Gross weight"
        subtitle="Weigh the loaded truck before releasing the dock."
        unitLabel="kg"
        busy={queueMutations.busy}
        tareWeightKg={selectedRow?.tareWeightKg}
        initialValue={selectedRow?.grossWeightKg != null ? String(selectedRow.grossWeightKg) : ""}
        onClose={() => setGrossOpen(false)}
        onSubmit={(weightKg) => void handleGross(weightKg)}
      />

      <CreateDockSheet
        visible={createOpen}
        busy={mutations.busy}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => {
          void handleCreateDock(input);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.lg },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.shipgenOrange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.lg,
  },
  createBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.lg, lineHeight: 19 },
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
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 14, color: colors.text },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.shipgenOrange, borderColor: colors.shipgenOrange },
  filterChipText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  filterChipTextActive: { color: "#fff" },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  summaryChip: { minWidth: 72, flexGrow: 1 },
  summaryChipActive: { borderColor: colors.shipgenOrange },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
  },
  errorTitle: { fontSize: 14, fontWeight: "800", color: colors.error, marginBottom: 4 },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  dockCode: { fontSize: 18, fontWeight: "900", color: colors.shipgenOrange },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  plate: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.shipgenOrange, borderRadius: radius.pill },
  weighRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  weighChip: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  weighNet: { color: "#047857", backgroundColor: "#ecfdf5" },
  rowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  profileBtn: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  profileBtnText: { fontSize: 11, fontWeight: "800", color: colors.shipgenOrange },
  rowHint: { fontSize: 11, color: colors.textMuted },
  quickBtn: {
    borderRadius: radius.pill,
    backgroundColor: colors.shipgenOrange,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  quickBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
});
