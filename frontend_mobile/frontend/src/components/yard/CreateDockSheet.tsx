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
import {
  DOCK_TYPE_OPTIONS,
  DOCK_ZONE_OPTIONS,
  dockZoneLabel,
  validateCreateDockForm,
} from "@/src/lib/dockManageActions";
import type { CreateDockInput } from "@/src/services/dockService";

type Props = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateDockInput) => void;
};

export default function CreateDockSheet({ visible, busy, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<CreateDockInput>({
    dockName: "",
    dockType: "GENERAL",
    zone: "Zone A",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setForm({ dockName: "", dockType: "GENERAL", zone: "Zone A" });
    setErrors({});
  }, [visible]);

  const handleSubmit = () => {
    const nextErrors = validateCreateDockForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Create dock</Text>
            <TouchableOpacity onPress={onClose} testID="create-dock-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.label}>Dock name</Text>
            <TextInput
              value={form.dockName}
              onChangeText={(dockName) => setForm((prev) => ({ ...prev, dockName }))}
              placeholder="Loading Bay 5"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              testID="create-dock-name"
            />
            {errors.dockName ? <Text style={styles.error}>{errors.dockName}</Text> : null}
            <Text style={styles.label}>Dock type</Text>
            <View style={styles.chipRow}>
              {DOCK_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, form.dockType === option && styles.chipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, dockType: option }))}
                >
                  <Text style={[styles.chipText, form.dockType === option && styles.chipTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Zone</Text>
            <View style={styles.chipRow}>
              {DOCK_ZONE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, form.zone === option && styles.chipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, zone: option }))}
                >
                  <Text style={[styles.chipText, form.zone === option && styles.chipTextActive]}>
                    {dockZoneLabel(option)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={busy}
            testID="create-dock-submit"
          >
            <Text style={styles.submitText}>{busy ? "Creating…" : "Create dock"}</Text>
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
  label: { fontSize: 12, fontWeight: "800", color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.text, backgroundColor: colors.bg },
  error: { fontSize: 11, color: colors.error, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.bg },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  chipTextActive: { color: "#fff" },
  submitBtn: { margin: spacing.xl, marginTop: spacing.sm, height: 48, borderRadius: radius.md, backgroundColor: colors.shipgenOrange, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "800" },
});
