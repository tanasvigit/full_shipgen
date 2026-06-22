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
import { DOCK_STATUS_OPTIONS } from "@/src/lib/dockManageActions";
import type {
  CallableQueueOption,
  DockBoardRow,
  EquipmentOption,
  LaborOption,
} from "@/src/services/dockService";
import type { ResourceReadiness } from "@/src/lib/resourceGating";

type Props = {
  visible: boolean;
  row: DockBoardRow | null;
  actionBusy?: boolean;
  can: (permission: string) => boolean;
  onClose: () => void;
  onStartLoading: () => void;
  onCompleteLoading: () => void;
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
  onReleaseResources: () => void;
  readiness?: ResourceReadiness | null;
  readinessLoading?: boolean;
};

export default function DockDetailSheet({
  visible,
  row,
  actionBusy,
  can,
  onClose,
  onStartLoading,
  onCompleteLoading,
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
  onReleaseResources,
  readiness,
  readinessLoading,
}: Props) {
  const [selectedQueueEntryId, setSelectedQueueEntryId] = useState<string | null>(null);
  useEffect(() => {
    setSelectedQueueEntryId(null);
  }, [row?.id, visible]);
  const actions = resolveDockActions(row, can, readiness);
  const badge = statusColor(row?.status || "available");
  const startAction = actions.find((action) => action.id === "start_loading");
  const completeAction = actions.find((action) => action.id === "complete_loading");
  const exceptionAction = actions.find((action) => action.id === "report_exception");
  const pauseAction = actions.find((action) => action.id === "pause_loading");
  const resumeAction = actions.find((action) => action.id === "resume_loading");
  const statusAction = actions.find((action) => action.id === "update_status");
  const showResourceAssign = Boolean(canAssignLabor || canAssignEquipment);
  const showVehicleAssign = Boolean(canAssignVehicle && !row?.hasActiveAssignment);

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
                  {pauseAction ? (
                    <DockActionButton
                      label={pauseAction.label}
                      enabled={Boolean(pauseAction.enabled)}
                      hint={pauseAction.reason}
                      busy={actionBusy}
                      variant="primary"
                      onPress={onPauseLoading}
                      testID="dock-action-pause-loading"
                    />
                  ) : null}
                  {resumeAction ? (
                    <DockActionButton
                      label={resumeAction.label}
                      enabled={Boolean(resumeAction.enabled)}
                      hint={resumeAction.reason}
                      busy={actionBusy}
                      variant="primary"
                      onPress={onResumeLoading}
                      testID="dock-action-resume-loading"
                    />
                  ) : null}
                </View>

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

                {showVehicleAssign ? (
                  <View style={styles.exceptionSection}>
                    <Text style={styles.sectionTitle}>Assign vehicle</Text>
                    {callableLoading ? (
                      <ActivityIndicator color={colors.shipgenOrange} style={{ marginVertical: spacing.sm }} />
                    ) : callableQueue.length ? (
                      <>
                        {callableQueue.map((entry) => {
                          const selected = selectedQueueEntryId === entry.id;
                          return (
                            <TouchableOpacity
                              key={entry.id}
                              style={[styles.exceptionRow, selected && styles.selectedRow]}
                              disabled={actionBusy}
                              onPress={() => setSelectedQueueEntryId(entry.id)}
                              testID={`dock-assign-vehicle-${entry.id}`}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.exceptionLabel}>{entry.plate}</Text>
                                <Text style={styles.resourceMeta}>
                                  Queue {entry.queueNumber} · {entry.status}
                                </Text>
                              </View>
                              {selected ? (
                                <Ionicons name="checkmark-circle" size={18} color={colors.shipgenOrange} />
                              ) : (
                                <Ionicons name="ellipse-outline" size={18} color={colors.textMuted} />
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
                              laborOptions.map((item) => (
                                <TouchableOpacity
                                  key={item.id}
                                  style={styles.exceptionRow}
                                  disabled={actionBusy}
                                  onPress={() => onAssignLabor(item.id)}
                                  testID={`dock-assign-labor-${item.id}`}
                                >
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.exceptionLabel}>{item.teamCode}</Text>
                                    <Text style={styles.resourceMeta}>
                                      {item.teamName} · {item.status}
                                      {item.assignedDockId === row?.id ? " · current" : ""}
                                    </Text>
                                  </View>
                                  <Ionicons name="add-circle-outline" size={18} color={colors.shipgenOrange} />
                                </TouchableOpacity>
                              ))
                            ) : (
                              <Text style={styles.resourceMeta}>No available labor teams</Text>
                            )}
                          </>
                        ) : null}
                        {canAssignEquipment ? (
                          <>
                            <Text style={styles.subsectionTitle}>Equipment</Text>
                            {equipmentOptions.length ? (
                              equipmentOptions.map((item) => (
                                <TouchableOpacity
                                  key={item.id}
                                  style={styles.exceptionRow}
                                  disabled={actionBusy}
                                  onPress={() => onAssignEquipment(item.id)}
                                  testID={`dock-assign-equipment-${item.id}`}
                                >
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.exceptionLabel}>{item.equipmentCode}</Text>
                                    <Text style={styles.resourceMeta}>
                                      {item.equipmentName} · {item.status}
                                      {item.assignedDockId === row?.id ? " · current" : ""}
                                    </Text>
                                  </View>
                                  <Ionicons name="add-circle-outline" size={18} color={colors.shipgenOrange} />
                                </TouchableOpacity>
                              ))
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
