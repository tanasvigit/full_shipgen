import { useEffect, useMemo, useState } from "react";
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
import { formatWeightKg } from "@/src/services/weighingService";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialValue?: string;
  tareWeightKg?: number | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (weightKg: number) => void;
};

export default function WeighWeightSheet({
  visible,
  title,
  subtitle,
  initialValue = "",
  tareWeightKg,
  busy,
  onClose,
  onSubmit,
}: Props) {
  const [weight, setWeight] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setWeight(initialValue);
    setError(null);
  }, [initialValue, visible]);

  const previewNet = useMemo(() => {
    if (tareWeightKg == null) return null;
    const gross = Number.parseFloat(weight);
    if (!Number.isFinite(gross) || gross <= tareWeightKg) return null;
    return gross - tareWeightKg;
  }, [tareWeightKg, weight]);

  const handleSubmit = () => {
    const value = Number.parseFloat(weight);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid weight in kg");
      return;
    }
    if (tareWeightKg != null && value <= tareWeightKg) {
      setError("Gross must be greater than tare");
      return;
    }
    setError(null);
    onSubmit(value);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {tareWeightKg != null ? (
              <View style={styles.previewRow}>
                <View style={styles.previewChip}>
                  <Text style={styles.previewLabel}>Tare (TW)</Text>
                  <Text style={styles.previewValue}>{formatWeightKg(tareWeightKg)}</Text>
                </View>
                <View style={[styles.previewChip, styles.previewNet]}>
                  <Text style={[styles.previewLabel, styles.previewNetLabel]}>Net (NW)</Text>
                  <Text style={[styles.previewValue, styles.previewNetValue]}>
                    {previewNet != null ? formatWeightKg(previewNet) : "—"}
                  </Text>
                </View>
              </View>
            ) : null}
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 4000"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              testID="weigh-weight-input"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={busy}
            testID="weigh-weight-submit"
          >
            <Text style={styles.submitText}>{busy ? "Saving…" : "Save weight"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "80%", backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { flex: 1, fontSize: 18, fontWeight: "900", color: colors.text },
  content: { padding: spacing.xl },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
  previewRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  previewChip: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bg },
  previewNet: { borderColor: "#86efac", backgroundColor: "#ecfdf5" },
  previewLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase" },
  previewNetLabel: { color: "#047857" },
  previewValue: { fontSize: 14, fontWeight: "800", color: colors.text, marginTop: 4 },
  previewNetValue: { color: "#047857" },
  label: { fontSize: 12, fontWeight: "800", color: colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.text, backgroundColor: colors.bg },
  error: { fontSize: 11, color: colors.error, marginTop: 4 },
  submitBtn: { margin: spacing.xl, marginTop: spacing.sm, height: 48, borderRadius: radius.md, backgroundColor: colors.shipgenOrange, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "800" },
});
