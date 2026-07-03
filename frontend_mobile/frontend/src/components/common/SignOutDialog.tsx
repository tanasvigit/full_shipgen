import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function SignOutDialog({
  visible,
  title = "Sign out?",
  message = "You'll need to sign in again to access your workspace.",
  confirmLabel = "Sign out",
  cancelLabel = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="log-out-outline" size={28} color={colors.error} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              testID="signout-cancel"
              style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.pressed]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              testID="signout-confirm"
              style={({ pressed }) => [
                styles.btn,
                styles.confirmBtn,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Ionicons name="log-out-outline" size={16} color="#fff" />
              <Text style={styles.confirmText}>{loading ? "Signing out…" : confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
    color: colors.text,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.error,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  cancelText: { fontSize: 14, fontWeight: "800", color: colors.text },
  confirmText: { fontSize: 14, fontWeight: "800", color: "#fff" },
});
