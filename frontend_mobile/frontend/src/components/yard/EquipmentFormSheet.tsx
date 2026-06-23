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
import {
  DEFAULT_EQUIPMENT_FORM,
  EQUIPMENT_CREATE_STATUSES,
  EQUIPMENT_STATUSES,
  EQUIPMENT_TYPES,
  validateEquipmentForm,
  type EquipmentFormInput,
} from "@/src/lib/equipmentActions";
import type { EquipmentRow } from "@/src/services/equipmentService";

type Props = {
  visible: boolean;
  busy?: boolean;
  row?: EquipmentRow | null;
  canDelete?: boolean;
  onClose: () => void;
  onSubmit: (input: EquipmentFormInput) => void;
  onDelete?: () => void;
};

function equipmentRowToForm(row: EquipmentRow): EquipmentFormInput {
  return {
    equipmentName: row.name,
    equipmentType: row.type === "—" ? "FORKLIFT" : row.type,
    status: row.status || "IDLE",
    model: row.model === "—" ? "" : row.model,
    assetNumber: row.assetNumber || "",
    operatorName: row.operator === "—" ? "" : row.operator,
    currentLocation: row.location === "—" ? "" : row.location,
    batteryLevel: row.battery !== null && row.battery !== undefined ? String(row.battery) : "",
    notes: row.notes || "",
  };
}

function formatOptionLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function EquipmentFormSheet({ visible, busy, row, canDelete, onClose, onSubmit, onDelete }: Props) {
  const isEdit = Boolean(row);
  const [form, setForm] = useState<EquipmentFormInput>(DEFAULT_EQUIPMENT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = useMemo(
    () => (isEdit ? [...EQUIPMENT_STATUSES] : [...EQUIPMENT_CREATE_STATUSES]),
    [isEdit],
  );

  useEffect(() => {
    if (!visible) return;
    setForm(row ? equipmentRowToForm(row) : DEFAULT_EQUIPMENT_FORM);
    setErrors({});
  }, [row, visible]);

  const setField = <K extends keyof EquipmentFormInput>(key: K, value: EquipmentFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const nextErrors = validateEquipmentForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{isEdit ? "Edit equipment" : "Add equipment"}</Text>
              {isEdit && row ? <Text style={styles.subtitle}>{row.code} · code cannot be changed</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} testID="equipment-form-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Equipment name</Text>
            <TextInput
              value={form.equipmentName}
              onChangeText={(equipmentName) => setField("equipmentName", equipmentName)}
              placeholder="Forklift 1"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              testID="equipment-name"
            />
            {errors.equipmentName ? <Text style={styles.error}>{errors.equipmentName}</Text> : null}

            <Text style={styles.label}>Equipment type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {EQUIPMENT_TYPES.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, form.equipmentType === option && styles.chipActive]}
                  onPress={() => setField("equipmentType", option)}
                >
                  <Text style={[styles.chipText, form.equipmentType === option && styles.chipTextActive]}>
                    {formatOptionLabel(option)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, form.status === option && styles.chipActive]}
                  onPress={() => setField("status", option)}
                >
                  <Text style={[styles.chipText, form.status === option && styles.chipTextActive]}>
                    {formatOptionLabel(option)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  value={form.model}
                  onChangeText={(model) => setField("model", model)}
                  placeholder="Toyota 8FGU25"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Asset number</Text>
                <TextInput
                  value={form.assetNumber}
                  onChangeText={(assetNumber) => setField("assetNumber", assetNumber)}
                  placeholder="REG-12345"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Operator</Text>
                <TextInput
                  value={form.operatorName}
                  onChangeText={(operatorName) => setField("operatorName", operatorName)}
                  style={styles.input}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Battery %</Text>
                <TextInput
                  value={form.batteryLevel}
                  onChangeText={(batteryLevel) => setField("batteryLevel", batteryLevel)}
                  keyboardType="number-pad"
                  placeholder="Optional"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  testID="equipment-battery"
                />
                {errors.batteryLevel ? <Text style={styles.error}>{errors.batteryLevel}</Text> : null}
              </View>
            </View>

            <Text style={styles.label}>Location</Text>
            <TextInput
              value={form.currentLocation}
              onChangeText={(currentLocation) => setField("currentLocation", currentLocation)}
              placeholder="Zone A · Bay 3"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Remarks</Text>
            <TextInput
              value={form.notes}
              onChangeText={(notes) => setField("notes", notes)}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
            />
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={busy}
            testID="equipment-form-submit"
          >
            <Text style={styles.submitText}>
              {busy ? "Saving…" : isEdit ? "Save changes" : "Add equipment"}
            </Text>
          </TouchableOpacity>
          {isEdit && onDelete ? (
            <TouchableOpacity
              style={[styles.deleteBtn, (!canDelete || busy) && styles.deleteBtnDisabled]}
              onPress={onDelete}
              disabled={!canDelete || busy}
              testID="equipment-form-delete"
            >
              <Text style={styles.deleteText}>
                {canDelete ? "Delete equipment" : "Release or idle equipment before deleting"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "92%", backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  header: { flexDirection: "row", alignItems: "flex-start", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontWeight: "900", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  content: { padding: spacing.xl, paddingBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: "800", color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  error: { fontSize: 11, color: colors.error, marginTop: 4 },
  row: { flexDirection: "row", gap: spacing.sm },
  col: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.shipgenOrange, borderColor: colors.shipgenOrange },
  chipText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  chipTextActive: { color: "#fff" },
  submitBtn: {
    margin: spacing.xl,
    marginTop: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.shipgenOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "800" },
  deleteBtn: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnDisabled: { opacity: 0.45 },
  deleteText: { color: colors.error, fontWeight: "800", fontSize: 13, textAlign: "center", paddingHorizontal: spacing.md },
});
