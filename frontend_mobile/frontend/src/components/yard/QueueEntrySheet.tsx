import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { resolveQueueActions } from "@/src/lib/queueActions";
import type { DockOption, QueueEntryRow } from "@/src/services/queueService";

type Props = {
  visible: boolean;
  entry: QueueEntryRow | null;
  docks: DockOption[];
  docksLoading?: boolean;
  actionBusy?: boolean;
  can: (permission: string) => boolean;
  onClose: () => void;
  onCall: () => void;
  onAssignDock: (dockId: string) => void;
  onOverride: () => void;
};

export default function QueueEntrySheet({
  visible,
  entry,
  docks,
  docksLoading,
  actionBusy,
  can,
  onClose,
  onCall,
  onAssignDock,
  onOverride,
}: Props) {
  const actions = resolveQueueActions(entry, can);
  const badge = statusColor(entry?.displayStatus || entry?.status || "waiting");
  const recommended = entry?.recommendedDock;
  const assignAction = actions.find((action) => action.id === "assign_dock");
  const callAction = actions.find((action) => action.id === "call");
  const overrideAction = actions.find((action) => action.id === "override");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.overline}>QUEUE ENTRY</Text>
              <Text style={styles.title}>{entry?.plate || "Vehicle"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="queue-sheet-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {entry ? (
              <>
                <View style={styles.metaCard}>
                  <View style={styles.metaTop}>
                    <Text style={styles.rank}>#{entry.queueRank ?? "—"}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>
                        {entry.displayStatus || entry.status || "WAITING"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.metaLine}>{entry.transporter || "Transporter"}</Text>
                  <Text style={styles.metaLine}>
                    Wait {entry.waitingMin ?? 0} min · Priority {entry.priorityScore ?? 0}
                  </Text>
                  <Text style={styles.metaLine}>
                    Dock {entry.dockCode || "—"} · {entry.bookingRef || entry.queueNumber || "—"}
                  </Text>
                </View>

                {recommended?.dockCode ? (
                  <View style={styles.recCard}>
                    <Text style={styles.sectionTitle}>Recommended dock</Text>
                    <Text style={styles.recCode}>{recommended.dockCode}</Text>
                    {recommended.score != null ? (
                      <Text style={styles.recHint}>Score {recommended.score}</Text>
                    ) : null}
                    {recommended.reason ? <Text style={styles.recHint}>{recommended.reason}</Text> : null}
                    {assignAction?.enabled && recommended.dockId ? (
                      <TouchableOpacity
                        style={styles.recBtn}
                        disabled={actionBusy}
                        onPress={() => onAssignDock(recommended.dockId!)}
                        testID="queue-assign-recommended-dock"
                      >
                        {actionBusy ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.recBtnText}>Assign {recommended.dockCode}</Text>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.actions}>
                  <QueueActionButton
                    label={callAction?.label || "Call in"}
                    enabled={Boolean(callAction?.enabled)}
                    hint={callAction?.reason}
                    busy={actionBusy}
                    variant="primary"
                    onPress={onCall}
                    testID="queue-action-call"
                  />
                  {overrideAction ? (
                    <QueueActionButton
                      label={overrideAction.label}
                      enabled={Boolean(overrideAction.enabled)}
                      hint={overrideAction.reason}
                      busy={actionBusy}
                      variant="secondary"
                      onPress={onOverride}
                      testID="queue-action-override"
                    />
                  ) : null}
                </View>

                {assignAction?.enabled ? (
                  <View style={styles.dockSection}>
                    <Text style={styles.sectionTitle}>Choose dock</Text>
                    {docksLoading ? (
                      <ActivityIndicator color={colors.shipgenOrange} />
                    ) : docks.length ? (
                      docks.map((dock) => (
                        <TouchableOpacity
                          key={dock.id}
                          style={styles.dockRow}
                          disabled={actionBusy}
                          onPress={() => onAssignDock(dock.id)}
                          testID={`queue-dock-option-${dock.dockCode}`}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dockCode}>{dock.dockCode}</Text>
                            <Text style={styles.dockMeta}>
                              {dock.dockName || "Dock"} · {dock.zone || "Yard"} · {dock.status}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.recHint}>No available docks right now.</Text>
                    )}
                  </View>
                ) : assignAction?.reason ? (
                  <Text style={styles.actionHint}>{assignAction.reason}</Text>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function QueueActionButton({
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
  variant: "primary" | "secondary";
  onPress: () => void;
  testID: string;
}) {
  const palette =
    variant === "primary"
      ? { bg: colors.shipgenOrange, fg: "#fff", border: colors.shipgenOrange }
      : { bg: colors.surface, fg: colors.text, border: colors.border };

  return (
    <View style={styles.actionWrap}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: palette.bg, borderColor: palette.border, opacity: enabled ? 1 : 0.45 }]}
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
  rank: { fontSize: 14, fontWeight: "900", color: colors.shipgenOrange },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  metaLine: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  recCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  recCode: { fontSize: 20, fontWeight: "900", color: colors.text },
  recHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 17 },
  recBtn: {
    marginTop: spacing.md,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  recBtnText: { color: "#fff", fontWeight: "800" },
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
  dockSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  dockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dockCode: { fontSize: 15, fontWeight: "800", color: colors.text },
  dockMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
