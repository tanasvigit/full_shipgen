import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import FleetModuleNav from "@/src/components/fleet/FleetModuleNav";
import type { FleetModuleId } from "@/src/lib/fleetModules";

type Props = {
  active: FleetModuleId;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  onAddPress?: () => void;
  children: ReactNode;
};

export function FleetHeaderIconButton({
  icon,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={headerStyles.iconBtn}>
      <Ionicons name={icon} size={20} color={colors.text} />
    </TouchableOpacity>
  );
}

export default function FleetSubScreenLayout({
  active,
  title,
  subtitle,
  headerRight,
  onAddPress,
  children,
}: Props) {
  const right =
    headerRight ??
    (onAddPress ? <FleetHeaderIconButton icon="add" onPress={onAddPress} testID="fleet-header-add" /> : null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.overline}>FLEET HUB</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      <FleetModuleNav active={active} variant="bar" />
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerText: { flex: 1 },
  overline: { fontSize: 10, letterSpacing: 1.8, fontWeight: "700", color: colors.textMuted },
  title: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4, color: colors.text, marginTop: 2 },
  subtitle: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, marginTop: 2 },
  body: { flex: 1 },
});

const headerStyles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
