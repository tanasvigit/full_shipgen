import { View, Text, StyleSheet, Image } from "react-native";
import { colors, spacing } from "@/src/theme";

type Props = {
  subtitle?: string;
  compact?: boolean;
  centered?: boolean;
  large?: boolean;
};

export default function ShipgenBrand({ subtitle, compact = false, centered = false, large = false }: Props) {
  const logoWidth = large ? 300 : compact ? 168 : 220;
  const logoHeight = large ? 92 : compact ? 52 : 68;

  return (
    <View style={[styles.wrap, centered && styles.wrapCentered]}>
      <Image
        source={require("@/assets/images/shipgen-logo-full.png")}
        style={{ width: logoWidth, height: logoHeight }}
        resizeMode="contain"
      />
      {subtitle ? (
        <Text style={[styles.subtitle, compact && styles.subtitleCompact, centered && styles.subtitleCentered]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "flex-start" },
  wrapCentered: { alignItems: "center" },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    maxWidth: 320,
    lineHeight: 18,
  },
  subtitleCentered: { textAlign: "center" },
  subtitleCompact: { fontSize: 12 },
});
