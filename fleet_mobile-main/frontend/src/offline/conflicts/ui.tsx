import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius, spacing } from "@/src/theme";
import type { ConflictRecord } from "@/src/offline/conflicts/policies";
import { clearConflict } from "@/src/offline/conflicts/resolver";

type ConflictListProps = {
  conflicts: ConflictRecord[];
  onRefresh?: () => void;
  onDismiss?: () => void;
};

export function ConflictList({ conflicts, onRefresh, onDismiss }: ConflictListProps) {
  if (!conflicts.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sync conflicts</Text>
      {conflicts.map((conflict) => (
        <View key={conflict.id} style={styles.card}>
          <Text style={styles.message}>{conflict.message}</Text>
          {conflict.orderId ? <Text style={styles.meta}>Order: {conflict.orderId}</Text> : null}
          <View style={styles.actions}>
            {onRefresh ? (
              <TouchableOpacity style={styles.btn} onPress={onRefresh} accessibilityRole="button">
                <Text style={styles.btnText}>Refresh order</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.btn}
              onPress={async () => {
                await clearConflict(conflict.id);
                onDismiss?.();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: 12, fontWeight: "800", color: colors.text, letterSpacing: 1 },
  card: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  message: { fontSize: 12, fontWeight: "700", color: colors.text },
  meta: { fontSize: 11, color: colors.textSecondary },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  btn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  btnText: { fontSize: 11, fontWeight: "700", color: colors.text },
});
