import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import { validateQueueOverride } from "@/src/lib/queueOverrideActions";
import type { QueueEntryRow } from "@/src/services/queueService";

type Props = {
  visible: boolean;
  entry: QueueEntryRow | null;
  supervisorName: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (payload: { targetRank: number; reason: string; supervisor: string }) => void;
};

export default function QueueOverrideSheet({
  visible,
  entry,
  supervisorName,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const [targetRank, setTargetRank] = useState("1");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setTargetRank(String(entry?.queueRank ?? 1));
    setReason("");
    setErrors({});
  }, [entry?.queueRank, visible]);

  const handleConfirm = () => {
    const payload = {
      targetRank: Number(targetRank),
      reason,
      supervisor: supervisorName,
    };
    const nextErrors = validateQueueOverride(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onConfirm(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Override queue rank</Text>
            <TouchableOpacity onPress={onClose} testID="queue-override-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.meta}>
              {entry?.plate || "Vehicle"} · current rank #{entry?.queueRank ?? "—"}
            </Text>
            <Text style={styles.label}>New rank (1–500)</Text>
            <TextInput
              value={targetRank}
              onChangeText={setTargetRank}
              keyboardType="number-pad"
              style={styles.input}
              testID="queue-override-rank"
            />
            {errors.targetRank ? <Text style={styles.error}>{errors.targetRank}</Text> : null}
            <Text style={styles.label}>Reason</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Why is this override needed?"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.multiline]}
              multiline
              testID="queue-override-reason"
            />
            {errors.reason ? <Text style={styles.error}>{errors.reason}</Text> : null}
            <Text style={styles.label}>Supervisor</Text>
            <Text style={styles.supervisor}>{supervisorName}</Text>
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
            onPress={handleConfirm}
            disabled={busy}
            testID="queue-override-confirm"
          >
            <Text style={styles.submitText}>{busy ? "Saving…" : "Apply override"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "85%", backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { flex: 1, fontSize: 18, fontWeight: "900", color: colors.text },
  content: { padding: spacing.xl },
  meta: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: "800", color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.text, backgroundColor: colors.bg },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  supervisor: { fontSize: 14, fontWeight: "700", color: colors.text },
  error: { fontSize: 11, color: colors.error, marginTop: 4 },
  submitBtn: { margin: spacing.xl, marginTop: spacing.sm, height: 48, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "800" },
});
