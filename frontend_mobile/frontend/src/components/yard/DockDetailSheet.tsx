import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { MOBILE_EXCEPTION_TYPES, resolveDockActions } from "@/src/lib/dockActions";
import { DOCK_STATUS_OPTIONS, canUnassignVehicleFromDock, isResourceAssignedToDock } from "@/src/lib/dockManageActions";
import type {
  CallableQueueOption,
  DockBoardRow,
  EquipmentOption,
  LaborOption,
} from "@/src/services/dockService";
import type { ResourceReadiness } from "@/src/lib/resourceGating";
import type { LoadingPauseState, LoadingCompleteState } from "@/src/services/dockService";
import { formatWeightKg } from "@/src/services/weighingService";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";

type Props = {
  visible: boolean;
  row: DockBoardRow | null;
  actionBusy?: boolean;
  can: (permission: string) => boolean;
  onClose: () => void;
  onStartLoading: () => void;
  onCompleteLoading: () => void;
  onReleaseDock: () => void;
  onReportException: (exceptionType: string) => void;
  onPauseLoading: () => void;
  onResumeLoading: () => void;
  onUpdateStatus: (status: string) => void;
  canAssignVehicle?: boolean;
  canAssignLabor?: boolean;
  canAssignEquipment?: boolean;
  callableQueue?: CallableQueueOption[];
  callableLoading?: boolean;
  onAssignVehicle: (queueEntryId: string) => void;
  laborOptions?: LaborOption[];
  equipmentOptions?: EquipmentOption[];
  resourcesLoading?: boolean;
  onAssignLabor: (laborId: string) => void;
  onAssignEquipment: (equipmentId: string) => void;
  onUnassignLabor: (laborId: string) => void;
  onUnassignEquipment: (equipmentId: string) => void;
  onUnassignVehicle: () => void;
  onReleaseResources: () => void;
  onGrossWeight?: () => void;
  readiness?: ResourceReadiness | null;
  readinessLoading?: boolean;
  pauseState?: LoadingPauseState | null;
  pauseStateLoading?: boolean;
  completeState?: LoadingCompleteState | null;
  completeStateLoading?: boolean;
};

export default function DockDetailSheet({
  visible,
  row,
  actionBusy,
  can,
  onClose,
  onStartLoading,
  onCompleteLoading,
  onReleaseDock,
  onReportException,
  onPauseLoading,
  onResumeLoading,
  onUpdateStatus,
  canAssignVehicle,
  canAssignLabor,
  canAssignEquipment,
  callableQueue = [],
  callableLoading,
  onAssignVehicle,
  laborOptions = [],
  equipmentOptions = [],
  resourcesLoading,
  onAssignLabor,
  onAssignEquipment,
  onUnassignLabor,
  onUnassignEquipment,
  onUnassignVehicle,
  onReleaseResources,
  onGrossWeight,
  readiness,
  readinessLoading,
  pauseState,
  pauseStateLoading,
  completeState,
  completeStateLoading,
}: Props) {
  const [selectedQueueEntryId, setSelectedQueueEntryId] = useState<string | null>(null);
  useEffect(() => {
    setSelectedQueueEntryId(null);
  }, [row?.id, row?.hasActiveAssignment, visible]);
  const actions = resolveDockActions(row, can, readiness, pauseState, completeState);
  const badge = statusColor(row?.status || "available");
  const startAction = actions.find((action) => action.id === "start_loading");
  const completeAction = actions.find((action) => action.id === "complete_loading");
  const releaseAction = actions.find((action) => action.id === "release_dock");
  const exceptionAction = actions.find((action) => action.id === "report_exception");
  const pauseAction = actions.find((action) => action.id === "pause_loading");
  const resumeAction = actions.find((action) => action.id === "resume_loading");
  const statusAction = actions.find((action) => action.id === "update_status");
  const showResourceAssign = Boolean(canAssignLabor || canAssignEquipment);
  const showVehicleUnassign = Boolean(
    canAssignVehicle && row?.hasActiveAssignment && canUnassignVehicleFromDock(row),
  );
  const showVehicleAssign = Boolean(canAssignVehicle && !showVehicleUnassign);
  const selectableCallableQueue = callableQueue.filter((entry) => entry.id !== row?.queueEntryId);
  const canWriteDock = can("*") || can(YMS_PERMISSIONS.DOCK_WRITE);
  const showGrossWeight = Boolean(
    canWriteDock && row?.hasActiveAssignment && onGrossWeight && row?.queueEntryId && row?.tareWeightKg != null,
  );
  const awaitingRelease = Boolean(completeState?.awaitingRelease);
  const needsGrossBeforeRelease = awaitingRelease && row?.grossWeightKg == null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.overline}>DOCK</Text>
              <Text style={styles.title}>{row?.code || "—"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="dock-sheet-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {row ? (
              <>
                <View style={styles.metaCard}>
                  <View style={styles.metaTop}>
                    <Text style={styles.dockName}>{row.name}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.metaLine}>{row.zone ? `Zone ${row.zone}` : "Yard dock"}</Text>
                  {row.hasActiveAssignment ? (
                    <>
                      <Text style={styles.plate}>{row.plate || "Vehicle assigned"}</Text>
                      <Text style={styles.metaLine}>{row.transporter || "Transporter"}</Text>
                      {row.queueNumber ? <Text style={styles.metaLine}>Queue {row.queueNumber}</Text> : null}
                      {row.loadingStatus ? (
                        <Text style={styles.metaLine}>Loading status · {row.loadingStatus}</Text>
                      ) : null}
                      {row.labor ? (
                        <Text style={styles.metaLine}>
                          Labor · {row.labor.code} ({row.labor.name}) · {row.labor.status}
                        </Text>
                      ) : (
                        <Text style={styles.metaLineMuted}>Labor · not assigned</Text>
                      )}
                      {row.equipment ? (
                        <Text style={styles.metaLine}>
                          Equipment · {row.equipment.code} ({row.equipment.name}) · {row.equipment.status}
                        </Text>
                      ) : (
                        <Text style={styles.metaLineMuted}>Equipment · not assigned (optional)</Text>
                      )}
                      {row.vehicleId ? (
                        <View style={styles.readinessCard}>
                          <Text style={styles.readinessTitle}>Loading readiness</Text>
                          {readinessLoading ? (
                            <ActivityIndicator color={colors.shipgenOrange} size="small" />
                          ) : readiness ? (
                            <>
                              <Text style={styles.metaLine}>
                                Vehicle · {row.vehicleStatus || row.loadingStatus || "—"}
                              </Text>
                              <Text style={styles.metaLine}>
                                Dock {readiness.dockAssigned ? "✓" : "—"} · Labor{" "}
                                {readiness.laborAssigned ? "✓" : "—"} · Equipment{" "}
                                {readiness.equipmentAssigned ? "✓" : "optional"}
                              </Text>
                              <Text
                                style={[
                                  styles.readinessState,
                                  { color: readiness.ready ? colors.success : colors.shipgenOrange },
                                ]}
                              >
                                {readiness.ready
                                  ? "Ready to start loading"
                                  : `Waiting: ${readiness.missing?.join(", ") || "resources"}`}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.metaLineMuted}>Readiness not loaded</Text>
                          )}
                        </View>
                      ) : null}
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${row.progressPct}%` }]} />
                      </View>
                      <Text style={styles.progressLabel}>{row.progressPct}% estimated progress</Text>
                      {row.queueEntryId ? (
                        <>
                          <Text style={styles.weighTitle}>Weighing</Text>
                          <View style={styles.weighRow}>
                            <Text style={styles.weighChip}>TW {formatWeightKg(row.tareWeightKg)}</Text>
                            <Text style={styles.weighChip}>GW {formatWeightKg(row.grossWeightKg)}</Text>
                            <Text style={[styles.weighChip, styles.weighNet]}>NW {formatWeightKg(row.netWeightKg)}</Text>
                          </View>
                          {row.tareWeightKg == null && canWriteDock ? (
                            <Text style={styles.weighHint}>
                              Record tare weight in Virtual Queue before gross weighing.
                            </Text>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.metaLine}>No active assignment</Text>
                  )}
                </View>

                <View style={styles.actions}>
                  <DockActionButton
                    label={startAction?.label || "Start loading"}
                    enabled={Boolean(startAction?.enabled)}
                    hint={startAction?.reason}
                    busy={actionBusy}
                    variant="primary"
                    onPress={onStartLoading}
                    testID="dock-action-start-loading"
                  />
                  <DockActionButton
                    label={completeAction?.label || "Complete loading"}
                    enabled={Boolean(completeAction?.enabled)}
                    hint={completeAction?.reason}
                    busy={actionBusy}
                    variant="primary"
                    onPress={onCompleteLoading}
                    testID="dock-action-complete-loading"
                  />
                  {releaseAction?.enabled || awaitingRelease ? (
                    <DockActionButton
                      label={releaseAction?.label || "Release dock"}
                      enabled={Boolean(releaseAction?.enabled)}
                      hint={releaseAction?.reason}
                      busy={actionBusy}
                      variant="primary"
                      onPress={onReleaseDock}
                      testID="dock-action-release-dock"
                    />
                  ) : null}
                  {pauseAction?.enabled ? (
                    <DockActionButton
                      label={pauseAction.label}
                      enabled
                      hint={pauseAction.reason}
                      busy={actionBusy}
                      variant="primary"
                      onPress={onPauseLoading}
                      testID="dock-action-pause-loading"
                    />
                  ) : null}
                  {resumeAction?.enabled ? (
                    <DockActionButton
                      label={resumeAction.label}
                      enabled
                      hint={resumeAction.reason}
                      busy={actionBusy}
                      variant="primary"
                      onPress={onResumeLoading}
                      testID="dock-action-resume-loading"
                    />
                  ) : null}
                </View>

                {pauseState?.paused ? (
                  <View style={styles.pauseBanner}>
                    <Text style={styles.pauseBannerTitle}>Loading paused</Text>
                    <Text style={styles.pauseBannerMeta}>
                      {pauseState.pauseReason || "Operation paused"}
                      {pauseState.pausedDurationMin ? ` · ${pauseState.pausedDurationMin} min` : ""}
                    </Text>
                  </View>
                ) : pauseStateLoading || completeStateLoading ? (
                  <ActivityIndicator color={colors.shipgenOrange} style={{ marginBottom: spacing.sm }} />
                ) : null}

                {awaitingRelease ? (
                  <View style={styles.completeBanner}>
                    <Text style={styles.completeBannerTitle}>Loading complete</Text>
                    <Text style={styles.completeBannerMeta}>
                      {needsGrossBeforeRelease
                        ? "Record gross weight, then release the dock."
                        : "Gross weight recorded — release the dock when ready."}
                    </Text>
                  </View>
                ) : null}

                {showGrossWeight ? (
                  <TouchableOpacity
                    style={styles.grossBtn}
                    disabled={actionBusy}
                    onPress={onGrossWeight}
                    testID="dock-gross-weight-open"
                  >
                    <Text style={styles.grossBtnText}>Gross weight</Text>
                  </TouchableOpacity>
                ) : null}

                {statusAction?.enabled ? (
                  <View style={styles.exceptionSection}>
                    <Text style={styles.sectionTitle}>Dock status</Text>
                    {DOCK_STATUS_OPTIONS.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={styles.exceptionRow}
                        disabled={actionBusy}
                        onPress={() => onUpdateStatus(status)}
                        testID={`dock-status-${status}`}
                      >
                        <Text style={styles.exceptionLabel}>{status}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {showVehicleUnassign ? (
                  <View style={styles.exceptionSection}>
                    <Text style={styles.sectionTitle}>Assigned vehicle</Text>
                    <TouchableOpacity
                      style={[styles.exceptionRow, styles.selectedRow]}
                      disabled={actionBusy}
                      onPress={onUnassignVehicle}
                      testID="dock-unassign-vehicle-row"
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exceptionLabel}>{row.plate || "Vehicle"}</Text>
                        <Text style={styles.resourceMeta}>
                          {row.queueNumber ? `Queue ${row.queueNumber}` : "Assigned to this dock"}
                          {" · tap to unassign"}
                        </Text>
                      </View>
                      <Ionicons name="remove-circle" size={18} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.releaseBtn}
                      disabled={actionBusy}
                      onPress={onUnassignVehicle}
                      testID="dock-unassign-vehicle"
                    >
                      <Text style={styles.releaseBtnText}>Unassign vehicle</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {showVehicleAssign ? (
                  <View style={styles.exceptionSection}>
                    <Text style={styles.sectionTitle}>Assign vehicle</Text>
                    {callableLoading ? (
                      <ActivityIndicator color={colors.shipgenOrange} style={{ marginVertical: spacing.sm }} />
                    ) : selectableCallableQueue.length ? (
                      <>
                        {selectableCallableQueue.map((entry) => {
                          const selected = selectedQueueEntryId === entry.id;
                          return (
                            <TouchableOpacity
                              key={entry.id}
                              style={[styles.exceptionRow, selected && styles.selectedRow]}
                              disabled={actionBusy}
                              onPress={() =>
                                setSelectedQueueEntryId((current) =>
                                  current === entry.id ? null : entry.id,
                                )
                              }
                              testID={`dock-assign-vehicle-${entry.id}`}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.exceptionLabel}>{entry.plate}</Text>
                                <Text style={styles.resourceMeta}>
                                  Queue {entry.queueNumber} · {entry.status}
                                  {selected ? " · tap to deselect" : ""}
                                </Text>
                              </View>
                              {selected ? (
                                <Ionicons name="remove-circle" size={18} color={colors.error} />
                              ) : (
                                <Ionicons name="add-circle-outline" size={18} color={colors.shipgenOrange} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                        <TouchableOpacity
                          style={styles.primaryAssignBtn}
                          disabled={actionBusy || !selectedQueueEntryId}
                          onPress={() => selectedQueueEntryId && onAssignVehicle(selectedQueueEntryId)}
                          testID="dock-assign-vehicle-submit"
                        >
                          <Text style={styles.primaryAssignBtnText}>Assign vehicle to dock</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.resourceMeta}>No callable queue entries right now.</Text>
                    )}
                  </View>
                ) : null}

                {showResourceAssign ? (
                  <View style={styles.exceptionSection}>
                    <Text style={styles.sectionTitle}>Assign resources</Text>
                    {resourcesLoading ? (
                      <ActivityIndicator color={colors.shipgenOrange} style={{ marginVertical: spacing.sm }} />
                    ) : (
                      <>
                        {canAssignLabor ? (
                          <>
                            <Text style={styles.subsectionTitle}>Labor teams</Text>
                            {laborOptions.length ? (
                              laborOptions.map((item) => {
                                const isCurrent = isResourceAssignedToDock(item.assignedDockId, row?.id);
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    style={[styles.exceptionRow, isCurrent && styles.selectedRow]}
                                    disabled={actionBusy}
                                    onPress={() =>
                                      isCurrent ? onUnassignLabor(item.id) : onAssignLabor(item.id)
                                    }
                                    testID={`dock-assign-labor-${item.id}`}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.exceptionLabel}>{item.teamCode}</Text>
                                      <Text style={styles.resourceMeta}>
                                        {item.teamName} · {item.status}
                                        {isCurrent ? " · assigned" : ""}
                                      </Text>
                                    </View>
                                    <Ionicons
                                      name={isCurrent ? "remove-circle" : "add-circle-outline"}
                                      size={18}
                                      color={isCurrent ? colors.error : colors.shipgenOrange}
                                    />
                                  </TouchableOpacity>
                                );
                              })
                            ) : (
                              <Text style={styles.resourceMeta}>No available labor teams</Text>
                            )}
                          </>
                        ) : null}
                        {canAssignEquipment ? (
                          <>
                            <Text style={styles.subsectionTitle}>Equipment</Text>
                            {equipmentOptions.length ? (
                              equipmentOptions.map((item) => {
                                const isCurrent = isResourceAssignedToDock(item.assignedDockId, row?.id);
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    style={[styles.exceptionRow, isCurrent && styles.selectedRow]}
                                    disabled={actionBusy}
                                    onPress={() =>
                                      isCurrent ? onUnassignEquipment(item.id) : onAssignEquipment(item.id)
                                    }
                                    testID={`dock-assign-equipment-${item.id}`}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.exceptionLabel}>{item.equipmentCode}</Text>
                                      <Text style={styles.resourceMeta}>
                                        {item.equipmentName} · {item.status}
                                        {isCurrent ? " · assigned" : ""}
                                      </Text>
                                    </View>
                                    <Ionicons
                                      name={isCurrent ? "remove-circle" : "add-circle-outline"}
                                      size={18}
                                      color={isCurrent ? colors.error : colors.shipgenOrange}
                                    />
                                  </TouchableOpacity>
                                );
                              })
                            ) : (
                              <Text style={styles.resourceMeta}>No available equipment</Text>
                            )}
                          </>
                        ) : null}
                        <TouchableOpacity
                          style={styles.releaseBtn}
                          disabled={actionBusy}
                          onPress={onReleaseResources}
                          testID="dock-release-resources"
                        >
                          <Text style={styles.releaseBtnText}>Release dock resources</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ) : null}

                {exceptionAction?.enabled ? (
                  <View style={styles.exceptionSection}>
                    <Text style={styles.sectionTitle}>Report exception</Text>
                    {MOBILE_EXCEPTION_TYPES.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={styles.exceptionRow}
                        disabled={actionBusy}
                        onPress={() => onReportException(item.value)}
                        testID={`dock-exception-${item.value}`}
                      >
                        <Text style={styles.exceptionLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : exceptionAction?.reason ? (
                  <Text style={styles.actionHint}>{exceptionAction.reason}</Text>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DockActionButton({
  label,
  enabled,
  hint,
  busy,
  variant,
  onPress,
  testID,
}: {
  label: string;
  enabled: boolean;
  hint?: string;
  busy?: boolean;
  variant: "primary" | "danger";
  onPress: () => void;
  testID: string;
}) {
  const palette =
    variant === "primary"
      ? { bg: colors.shipgenOrange, fg: "#fff", border: colors.shipgenOrange }
      : { bg: colors.errorBg, fg: colors.error, border: colors.error };

  return (
    <View style={styles.actionWrap}>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          { backgroundColor: palette.bg, borderColor: palette.border, opacity: enabled ? 1 : 0.45 },
        ]}
        disabled={!enabled || busy}
        onPress={onPress}
        testID={testID}
      >
        {busy ? (
          <ActivityIndicator color={palette.fg} />
        ) : (
          <Text style={[styles.actionText, { color: palette.fg }]}>{label}</Text>
        )}
      </TouchableOpacity>
      {hint && !enabled ? <Text style={styles.actionHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10,10,10,0.45)" },
  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 24, fontWeight: "900", color: colors.text, marginTop: 4 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  metaTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  dockName: { fontSize: 16, fontWeight: "800", color: colors.text, flex: 1, marginRight: spacing.sm },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  plate: { fontSize: 20, fontWeight: "900", color: colors.text, marginTop: spacing.sm },
  metaLine: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  metaLineMuted: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: "italic" },
  readinessCard: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  readinessTitle: { fontSize: 11, fontWeight: "800", color: colors.textSecondary, marginBottom: 4 },
  readinessState: { fontSize: 12, fontWeight: "800", marginTop: 4 },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.shipgenOrange, borderRadius: radius.pill },
  progressLabel: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  weighTitle: { fontSize: 10, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase", marginTop: spacing.sm, letterSpacing: 1 },
  weighRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
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
  weighHint: { fontSize: 11, color: "#b45309", marginTop: spacing.xs, lineHeight: 16 },
  grossBtn: {
    borderWidth: 1,
    borderColor: "#7dd3fc",
    backgroundColor: "#f0f9ff",
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  grossBtnText: { fontSize: 12, fontWeight: "800", color: "#0369a1" },
  actions: { gap: spacing.sm, marginBottom: spacing.md },
  actionWrap: { gap: 4 },
  actionBtn: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  actionText: { fontSize: 14, fontWeight: "800" },
  actionHint: { fontSize: 11, color: colors.textMuted, paddingHorizontal: 4 },
  pauseBanner: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pauseBannerTitle: { fontSize: 13, fontWeight: "800", color: "#9a3412" },
  pauseBannerMeta: { fontSize: 12, color: "#c2410c", marginTop: 4 },
  completeBanner: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  completeBannerTitle: { fontSize: 13, fontWeight: "800", color: "#065f46" },
  completeBannerMeta: { fontSize: 12, color: "#047857", marginTop: 4 },
  exceptionSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  subsectionTitle: { fontSize: 12, fontWeight: "800", color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 4 },
  resourceMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  selectedRow: { backgroundColor: colors.bg },
  primaryAssignBtn: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.shipgenOrange,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryAssignBtnText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  releaseBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  releaseBtnText: { fontSize: 12, fontWeight: "800", color: colors.textSecondary },
  exceptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exceptionLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text },
});
