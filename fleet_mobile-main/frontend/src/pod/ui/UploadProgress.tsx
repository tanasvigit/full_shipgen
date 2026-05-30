import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius } from "@/src/theme";

export function UploadProgress({ state, label }: { state: "staged" | "queued" | "uploading" | "uploaded" | "failed"; label?: string }) {
  const text =
    label ||
    ({
      staged: "Staged locally",
      queued: "Queued for upload",
      uploading: "Uploading...",
      uploaded: "Uploaded",
      failed: "Upload failed",
    }[state] || state);

  return (
    <View style={styles.wrap} accessibilityLabel={`Upload status ${text}`}>
      {state === "uploading" ? <ActivityIndicator size="small" color={colors.text} /> : null}
      <Text style={[styles.text, state === "failed" && styles.failed]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
  },
  text: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  failed: { color: colors.error },
});
