import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/src/theme";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  toneColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export default function YardKpiStat({
  label,
  value,
  hint,
  toneColor,
  onPress,
  disabled = false,
  testID,
  style,
}: Props) {
  const content = (
    <>
      <Text style={[styles.value, toneColor ? { color: toneColor } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.72}
        style={[styles.card, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={[styles.card, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  value: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  hint: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
