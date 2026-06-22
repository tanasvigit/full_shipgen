import { useEffect, useState, type ReactNode } from "react";
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
  BOOKING_GATES,
  BOOKING_MATERIALS,
  BOOKING_REQUEST_TYPES,
  BOOKING_SLOTS,
  todayIsoDate,
  validateBookingForm,
  type BookAppointmentForm,
} from "@/src/lib/appointmentActions";

type Props = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (form: BookAppointmentForm) => void;
};

const DEFAULT_FORM = (): BookAppointmentForm => ({
  plate: "",
  transporter: "",
  driverName: "",
  reqType: "Loading",
  material: BOOKING_MATERIALS[0],
  slot: "AM",
  gate: "G1",
  date: todayIsoDate(),
  notes: "",
});

export default function BookAppointmentSheet({ visible, busy, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<BookAppointmentForm>(DEFAULT_FORM());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setForm(DEFAULT_FORM());
      setErrors({});
    }
  }, [visible]);

  const patch = (key: keyof BookAppointmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const nextErrors = validateBookingForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Book appointment</Text>
            <TouchableOpacity onPress={onClose} testID="book-appt-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Field label="Plate" error={errors.plate}>
              <TextInput
                value={form.plate}
                onChangeText={(v) => patch("plate", v)}
                placeholder="MH12AB1234"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="characters"
                testID="book-appt-plate"
              />
            </Field>
            <Field label="Transporter" error={errors.transporter}>
              <TextInput
                value={form.transporter}
                onChangeText={(v) => patch("transporter", v)}
                placeholder="Carrier name"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                testID="book-appt-transporter"
              />
            </Field>
            <Field label="Driver (optional)">
              <TextInput
                value={form.driverName}
                onChangeText={(v) => patch("driverName", v)}
                placeholder="Driver name"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </Field>
            <Text style={styles.label}>Request type</Text>
            <ChipRow
              options={BOOKING_REQUEST_TYPES}
              value={form.reqType}
              onChange={(v) => patch("reqType", v)}
              testPrefix="book-appt-type"
            />
            <Text style={styles.label}>Material</Text>
            <ChipRow
              options={[...BOOKING_MATERIALS]}
              value={form.material}
              onChange={(v) => patch("material", v)}
              testPrefix="book-appt-material"
            />
            <Text style={styles.label}>Slot</Text>
            <ChipRow
              options={[...BOOKING_SLOTS]}
              value={form.slot}
              onChange={(v) => patch("slot", v)}
              testPrefix="book-appt-slot"
            />
            <Text style={styles.label}>Gate</Text>
            <ChipRow
              options={[...BOOKING_GATES]}
              value={form.gate}
              onChange={(v) => patch("gate", v)}
              testPrefix="book-appt-gate"
            />
            <Field label="Notes (optional)">
              <TextInput
                value={form.notes}
                onChangeText={(v) => patch("notes", v)}
                placeholder="Special instructions"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.multiline]}
                multiline
              />
            </Field>
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={busy}
            testID="book-appt-submit"
          >
            <Text style={styles.submitText}>{busy ? "Booking…" : "Create booking"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function ChipRow({
  options,
  value,
  onChange,
  testPrefix,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  testPrefix: string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.chip, value === option && styles.chipActive]}
          onPress={() => onChange(option)}
          testID={`${testPrefix}-${option}`}
        >
          <Text style={[styles.chipText, value === option && styles.chipTextActive]}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "92%", backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "900", color: colors.text, flex: 1 },
  content: { padding: spacing.xl, gap: spacing.sm },
  field: { marginBottom: spacing.sm },
  label: { fontSize: 12, fontWeight: "800", color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  error: { fontSize: 11, color: colors.error, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
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
  submitText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
