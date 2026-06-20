import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/src/theme";

type Props = {
  subtitle?: string;
  compact?: boolean;
};

export default function ShipgenBrand({ subtitle, compact = false }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.markRow}>
        <View style={styles.mark}>
          <Ionicons name="flash" size={compact ? 14 : 16} color="#fff" />
        </View>
        <Text style={[styles.name, compact && styles.nameCompact]}>SHIPGEN</Text>
      </View>
      {subtitle ? <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "flex-start" },
  markRow: { flexDirection: "row", alignItems: "center" },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.shipgenBlue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  name: {
    color: colors.text,
    fontWeight: "900",
    letterSpacing: 2.4,
    fontSize: 14,
  },
  nameCompact: { fontSize: 12, letterSpacing: 2 },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13,
    maxWidth: 280,
    lineHeight: 18,
  },
  subtitleCompact: { fontSize: 12 },
});
