import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius, spacing } from "@/src/theme";
import type { SyncSnapshot } from "@/src/sync/statusMachine";

type SyncBannerProps = {
  snapshot: SyncSnapshot | null;
  onRetry?: () => void;
  compact?: boolean;
};

export function SyncBanner({ snapshot, onRetry, compact = false }: SyncBannerProps) {
  if (!snapshot || snapshot.severity === "ok") return null;

  const background =
    snapshot.severity === "error"
      ? colors.errorBg
      : snapshot.connectivity === "offline"
        ? "#FEF3C7"
        : "#EFF6FF";

  const border =
    snapshot.severity === "error" ? colors.error : snapshot.connectivity === "offline" ? "#F59E0B" : "#3B82F6";

  return (
    <View
      style={[styles.wrap, compact && styles.compact, { backgroundColor: background, borderColor: border }]}
      accessibilityRole="summary"
      accessibilityLabel={`Sync status: ${snapshot.label}`}
    >
      <Text style={styles.label}>{snapshot.label}</Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryBtn}
          accessibilityRole="button"
          accessibilityLabel="Retry sync"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function SyncChip({ label }: { label: string }) {
  return (
    <View style={styles.chip} accessibilityLabel={label}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  compact: { marginHorizontal: 0 },
  label: { flex: 1, fontSize: 12, fontWeight: "700", color: colors.text },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  retryText: { fontSize: 11, fontWeight: "800", color: colors.text },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 10, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.4 },
});
