import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";

type Props = {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  full?: boolean;
  onPress?: () => void;
};

export default function KpiCard({ label, value, delta, positive, icon, full, onPress }: Props) {
  const content = (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {icon ? <Ionicons name={icon} size={16} color={colors.textMuted} /> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      {delta ? (
        <Text style={[styles.delta, { color: positive ? colors.success : colors.error }]}>
          {delta}
        </Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        testID={`kpi-${label}`}
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.card, full && styles.full]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={`kpi-${label}`} style={[styles.card, full && styles.full]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: 0,
  },
  full: { flexBasis: "100%" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  value: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  delta: { fontSize: 12, fontWeight: "600", marginTop: 4 },
});
