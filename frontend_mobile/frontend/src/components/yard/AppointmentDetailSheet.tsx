import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import {
  BOOKING_GATES,
  BOOKING_SLOTS,
  canCancelAppointment,
  canRescheduleAppointment,
  type AppointmentRow,
} from "@/src/lib/appointmentActions";

type Props = {
  visible: boolean;
  row: AppointmentRow | null;
  busy?: boolean;
  canWrite?: boolean;
  onClose: () => void;
  onOpenGate: () => void;
  onCancel: () => void;
  onReschedule: (patch: { slot: string; gate: string; date: string }) => void;
};

export default function AppointmentDetailSheet({
  visible,
  row,
  busy,
  canWrite,
  onClose,
  onOpenGate,
  onCancel,
  onReschedule,
}: Props) {
  const [slot, setSlot] = useState("AM");
  const [gate, setGate] = useState("G1");

  useEffect(() => {
    if (!row) return;
    setSlot(row.slot || "AM");
    setGate(row.gate || "G1");
  }, [row]);

  if (!row) return null;
  const badge = statusColor(row.status);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.overline}>APPOINTMENT</Text>
              <Text style={styles.title}>{row.bookingRef}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.metaCard}>
              <View style={styles.metaTop}>
                <Text style={styles.plate}>{row.plate}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                </View>
              </View>
              <Text style={styles.meta}>{row.type} · Slot {row.slot} · Gate {row.gate}</Text>
              <Text style={styles.meta}>{row.transporter}</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={onOpenGate} testID="appt-open-gate">
              <Text style={styles.primaryText}>Open at gate</Text>
            </TouchableOpacity>
            {canWrite && canRescheduleAppointment(row.status) ? (
              <>
                <Text style={styles.sectionTitle}>Reschedule</Text>
                <View style={styles.chipRow}>
                  {BOOKING_SLOTS.map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.chip, slot === value && styles.chipActive]}
                      onPress={() => setSlot(value)}
                    >
                      <Text style={[styles.chipText, slot === value && styles.chipTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.chipRow}>
                  {BOOKING_GATES.map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.chip, gate === value && styles.chipActive]}
                      onPress={() => setGate(value)}
                    >
                      <Text style={[styles.chipText, gate === value && styles.chipTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  disabled={busy}
                  onPress={() => onReschedule({ slot, gate, date: row.date })}
                  testID="appt-reschedule"
                >
                  <Text style={styles.secondaryText}>{busy ? "Saving…" : "Save reschedule"}</Text>
                </TouchableOpacity>
              </>
            ) : null}
            {canWrite && canCancelAppointment(row.status) ? (
              <TouchableOpacity style={styles.dangerBtn} disabled={busy} onPress={onCancel} testID="appt-cancel">
                <Text style={styles.dangerText}>Cancel appointment</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "88%", backgroundColor: colors.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  header: { flexDirection: "row", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 20, fontWeight: "900", color: colors.text, marginTop: 4 },
  content: { padding: spacing.xl, gap: spacing.md },
  metaCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  metaTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plate: { fontSize: 18, fontWeight: "900", color: colors.text },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  primaryBtn: { backgroundColor: colors.shipgenOrange, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "800" },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  chipTextActive: { color: "#fff" },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", backgroundColor: colors.surface },
  secondaryText: { fontWeight: "800", color: colors.text },
  dangerBtn: { borderRadius: radius.md, paddingVertical: 14, alignItems: "center", backgroundColor: colors.errorBg, borderWidth: 1, borderColor: "#FECACA" },
  dangerText: { fontWeight: "800", color: colors.error },
});
