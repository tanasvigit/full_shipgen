import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import { GATE_REJECT_REASONS } from "@/src/lib/gateActions";

export type GateRejectPayload = {
  reason: string;
  note?: string;
  photoUri?: string | null;
};

type Props = {
  visible: boolean;
  title: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (payload: GateRejectPayload) => void;
};

export default function GateRejectSheet({ visible, title, busy, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState(GATE_REJECT_REASONS[0]);
  const [note, setNote] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setReason(GATE_REJECT_REASONS[0]);
    setNote("");
    setPhotoUri(null);
  }, [visible]);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleConfirm = () => {
    onConfirm({ reason, note, photoUri });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} testID="gate-reject-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Reason</Text>
            <View style={styles.chipRow}>
              {GATE_REJECT_REASONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, reason === item && styles.chipActive]}
                  onPress={() => setReason(item)}
                  testID={`gate-reject-reason-${item}`}
                >
                  <Text style={[styles.chipText, reason === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Additional details for the gate log"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              testID="gate-reject-note"
            />

            <Text style={styles.label}>Photo (optional)</Text>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} testID="gate-reject-photo">
              <Ionicons name="camera-outline" size={18} color={colors.shipgenOrange} />
              <Text style={styles.photoBtnText}>{photoUri ? "Retake photo" : "Attach photo"}</Text>
            </TouchableOpacity>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.preview} accessibilityLabel="Reject evidence photo" />
            ) : (
              <Text style={styles.muted}>Photo is appended to the reason text until upload API is available.</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, busy && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={busy}
              testID="gate-reject-confirm"
            >
              <Text style={styles.confirmText}>{busy ? "Submitting…" : "Confirm reject"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "900", color: colors.text, flex: 1 },
  content: { padding: spacing.xl, gap: spacing.sm },
  label: { fontSize: 12, fontWeight: "800", color: colors.textSecondary, marginTop: spacing.sm },
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
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: "top",
    backgroundColor: colors.bg,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
  },
  photoBtnText: { fontSize: 13, fontWeight: "800", color: colors.shipgenOrange },
  preview: { width: "100%", height: 160, borderRadius: radius.md, marginTop: spacing.sm },
  muted: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontWeight: "800", color: colors.textSecondary },
  confirmBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { fontWeight: "800", color: "#fff" },
});
