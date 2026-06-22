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
import type { GateActionDef, GateActionId, GateScreenMode } from "@/src/lib/gateActions";
import { resolveGateActions } from "@/src/lib/gateActions";
import type { GateVehicleContext } from "@/src/services/gateService";

type Props = {
  visible: boolean;
  mode: GateScreenMode;
  context: GateVehicleContext | null;
  loading?: boolean;
  actionBusy?: boolean;
  error?: string | null;
  can: (permission: string) => boolean;
  onClose: () => void;
  onRefresh: () => void;
  onAction: (actionId: GateActionId) => void;
  onToggleExitCheck: (field: string, value: boolean) => void;
};

export default function GateVehicleSheet({
  visible,
  mode,
  context,
  loading,
  actionBusy,
  error,
  can,
  onClose,
  onRefresh,
  onAction,
  onToggleExitCheck,
}: Props) {
  const actions = resolveGateActions(context, can, mode);
  const badge = statusColor(context?.display.status || context?.activityTab || "pending");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.overline}>VEHICLE DETAIL</Text>
              <Text style={styles.title}>{context?.display.plate || "Lookup"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="gate-sheet-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.shipgenOrange} />
              <Text style={styles.muted}>Loading vehicle context…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>{error}</Text>
                  <TouchableOpacity onPress={onRefresh}>
                    <Text style={styles.retry}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {context ? (
                <>
                  <View style={styles.metaCard}>
                    <View style={styles.metaTop}>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.fg }]}>{context.display.status}</Text>
                      </View>
                      <Text style={styles.tab}>{context.activityTab || "—"}</Text>
                    </View>
                    <Text style={styles.metaLine}>{context.display.transporter} · {context.display.driver}</Text>
                    <Text style={styles.metaLine}>Appt {context.display.appointment} · Slot {context.display.slot}</Text>
                  </View>

                  {mode === "entry" ? (
                    <Checklist title="Entry checks" items={context.entryChecks} />
                  ) : (
                    <Checklist
                      title="Exit checklist — tap to confirm"
                      items={context.exitChecks}
                      onToggle={(item) => {
                        if (!item.field) return;
                        onToggleExitCheck(item.field, !item.passed);
                      }}
                    />
                  )}

                  <View style={styles.actions}>
                    {actions.map((action) => (
                      <GateActionButton
                        key={action.id}
                        action={action}
                        busy={actionBusy}
                        onPress={() => onAction(action.id)}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Checklist({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: { id: string; label: string; passed: boolean; hint?: string; field?: string }[];
  onToggle?: (item: { id: string; label: string; passed: boolean; hint?: string; field?: string }) => void;
}) {
  return (
    <View style={styles.checklist}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.checkRow}
          disabled={!onToggle || !item.field}
          onPress={() => onToggle?.(item)}
        >
          <Ionicons
            name={item.passed ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={item.passed ? colors.success : colors.textMuted}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.checkLabel}>{item.label}</Text>
            {item.hint ? <Text style={styles.checkHint}>{item.hint}</Text> : null}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function GateActionButton({
  action,
  busy,
  onPress,
}: {
  action: GateActionDef;
  busy?: boolean;
  onPress: () => void;
}) {
  const disabled = !action.enabled || busy;
  const palette =
    action.variant === "danger"
      ? { bg: colors.error, fg: "#fff", border: colors.error }
      : action.variant === "primary"
        ? { bg: colors.shipgenOrange, fg: "#fff", border: colors.shipgenOrange }
        : { bg: colors.surface, fg: colors.text, border: colors.border };

  return (
    <View style={styles.actionWrap}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.45 : 1 }]}
        disabled={disabled}
        onPress={onPress}
        testID={`gate-action-${action.id}`}
      >
        {busy ? (
          <ActivityIndicator color={palette.fg} />
        ) : (
          <Text style={[styles.actionText, { color: palette.fg }]}>{action.label}</Text>
        )}
      </TouchableOpacity>
      {action.reason && !action.enabled ? <Text style={styles.actionHint}>{action.reason}</Text> : null}
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
  centered: { alignItems: "center", justifyContent: "center", padding: spacing.xxxl, gap: spacing.sm },
  muted: { color: colors.textMuted, fontSize: 13 },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTitle: { color: colors.error, fontWeight: "700" },
  retry: { color: colors.shipgenBlue, marginTop: 6, fontWeight: "700" },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  metaTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  tab: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  metaLine: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  checklist: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  checkRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", marginBottom: spacing.sm },
  checkLabel: { fontSize: 13, color: colors.text, fontWeight: "600" },
  checkHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  actions: { gap: spacing.sm },
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
});
