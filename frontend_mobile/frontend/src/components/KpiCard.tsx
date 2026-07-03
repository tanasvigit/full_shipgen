import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing } from "../theme";

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
  const deltaColor = positive ? colors.success : colors.error;
  const deltaBg = positive ? colors.successBg : colors.errorBg;

  const content = (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {icon ? (
          <View style={styles.iconChip}>
            <Ionicons name={icon} size={15} color={colors.brand} />
          </View>
        ) : null}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {delta ? (
        <View style={[styles.deltaPill, { backgroundColor: deltaBg }]}>
          <Ionicons
            name={positive ? "arrow-up" : "arrow-down"}
            size={10}
            color={deltaColor}
          />
          <Text style={[styles.delta, { color: deltaColor }]} numberOfLines={1}>
            {delta}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        testID={`kpi-${label}`}
        onPress={onPress}
        activeOpacity={0.75}
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
    ...shadow.sm,
  },
  full: { flexBasis: "100%" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.sm,
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 27,
    fontWeight: "900",
    color: colors.text,
    marginTop: spacing.md,
    letterSpacing: -0.8,
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  delta: { fontSize: 11, fontWeight: "700" },
});
