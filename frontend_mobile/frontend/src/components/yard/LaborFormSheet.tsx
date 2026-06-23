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
  DEFAULT_LABOR_FORM,
  LABOR_CREATE_STATUSES,
  LABOR_MATERIAL_TYPES,
  LABOR_STATUSES,
  validateLaborForm,
  type LaborFormInput,
} from "@/src/lib/laborActions";
import type { LaborRow } from "@/src/services/laborService";

type Props = {
  visible: boolean;
  busy?: boolean;
  row?: LaborRow | null;
  canDelete?: boolean;
  onClose: () => void;
  onSubmit: (input: LaborFormInput) => void;
  onDelete?: () => void;
};

function laborRowToForm(row: LaborRow): LaborFormInput {
  return {
    teamName: row.name === "Team" ? "" : row.name,
    supervisorName: row.supervisor === "—" ? "" : row.supervisor,
    supervisorPhone: row.supervisorPhone || "",
    shiftStart: row.shiftStart || "06:00",
    shiftEnd: row.shiftEnd || "14:00",
    membersCount: String(row.members || 1),
    materialType: row.materialType || "GENERAL",
    status: row.status || "ON_DUTY",
    notes: row.notes || "",
  };
}

function formatOptionLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function LaborFormSheet({ visible, busy, row, canDelete, onClose, onSubmit, onDelete }: Props) {
  const isEdit = Boolean(row);
  const [form, setForm] = useState<LaborFormInput>(DEFAULT_LABOR_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = useMemo(
    () => (isEdit ? [...LABOR_STATUSES] : [...LABOR_CREATE_STATUSES]),
    [isEdit],
  );

  useEffect(() => {
    if (!visible) return;
    setForm(row ? laborRowToForm(row) : DEFAULT_LABOR_FORM);
    setErrors({});
  }, [row, visible]);

  const setField = <K extends keyof LaborFormInput>(key: K, value: LaborFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const nextErrors = validateLaborForm(form);
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
              <Text style={styles.title}>{isEdit ? "Edit labor team" : "Create labor team"}</Text>
              {isEdit && row ? <Text style={styles.subtitle}>{row.code} · code cannot be changed</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} testID="labor-form-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Team name</Text>
            <TextInput
              value={form.teamName}
              onChangeText={(teamName) => setField("teamName", teamName)}
              placeholder="Loading Team A"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              testID="labor-team-name"
            />
            {errors.teamName ? <Text style={styles.error}>{errors.teamName}</Text> : null}

            <Text style={styles.label}>Supervisor name</Text>
            <TextInput
              value={form.supervisorName}
              onChangeText={(supervisorName) => setField("supervisorName", supervisorName)}
              style={styles.input}
              testID="labor-supervisor-name"
            />
            {errors.supervisorName ? <Text style={styles.error}>{errors.supervisorName}</Text> : null}

            <Text style={styles.label}>Supervisor phone</Text>
            <TextInput
              value={form.supervisorPhone}
              onChangeText={(supervisorPhone) => setField("supervisorPhone", supervisorPhone)}
              keyboardType="phone-pad"
              placeholder="+91 …"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              testID="labor-supervisor-phone"
            />
            {errors.supervisorPhone ? <Text style={styles.error}>{errors.supervisorPhone}</Text> : null}

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Shift start</Text>
                <TextInput
                  value={form.shiftStart}
                  onChangeText={(shiftStart) => setField("shiftStart", shiftStart)}
                  placeholder="06:00"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  testID="labor-shift-start"
                />
                {errors.shiftStart ? <Text style={styles.error}>{errors.shiftStart}</Text> : null}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Shift end</Text>
                <TextInput
                  value={form.shiftEnd}
                  onChangeText={(shiftEnd) => setField("shiftEnd", shiftEnd)}
                  placeholder="14:00"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  testID="labor-shift-end"
                />
                {errors.shiftEnd ? <Text style={styles.error}>{errors.shiftEnd}</Text> : null}
              </View>
            </View>

            <Text style={styles.label}>Member count</Text>
            <TextInput
              value={form.membersCount}
              onChangeText={(membersCount) => setField("membersCount", membersCount)}
              keyboardType="number-pad"
              style={styles.input}
              testID="labor-members-count"
            />
            {errors.membersCount ? <Text style={styles.error}>{errors.membersCount}</Text> : null}

            <Text style={styles.label}>Material type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {LABOR_MATERIAL_TYPES.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, form.materialType === option && styles.chipActive]}
                  onPress={() => setField("materialType", option)}
                >
                  <Text style={[styles.chipText, form.materialType === option && styles.chipTextActive]}>
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

            <Text style={styles.label}>Remarks</Text>
            <TextInput
              value={form.notes}
              onChangeText={(notes) => setField("notes", notes)}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
              testID="labor-notes"
            />
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={busy}
            testID="labor-form-submit"
          >
            <Text style={styles.submitText}>
              {busy ? "Saving…" : isEdit ? "Save changes" : "Create team"}
            </Text>
          </TouchableOpacity>
          {isEdit && onDelete ? (
            <TouchableOpacity
              style={[styles.deleteBtn, (!canDelete || busy) && styles.deleteBtnDisabled]}
              onPress={onDelete}
              disabled={!canDelete || busy}
              testID="labor-form-delete"
            >
              <Text style={styles.deleteText}>
                {canDelete ? "Delete team" : "Release assignment before deleting"}
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
