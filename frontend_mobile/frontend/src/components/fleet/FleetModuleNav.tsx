import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useFleetModuleStats } from "@/src/hooks/useFleetModuleStats";
import { visibleFleetModules, type FleetModuleId } from "@/src/lib/fleetModules";

type Props = {
  active: FleetModuleId;
  variant?: "bar" | "grid";
};

function badgeColor(tone?: "error" | "warning" | "info") {
  if (tone === "error") return colors.error;
  if (tone === "warning") return colors.warning;
  return colors.info;
}

export default function FleetModuleNav({ active, variant = "bar" }: Props) {
  const router = useRouter();
  const { canFleetops } = useAuth();
  const { vehicles, drivers, routes, places, issues, fuelLogs } = useFleetData();
  const { byModule } = useFleetModuleStats({ vehicles, drivers, routes, places, issues, fuelLogs });
  const modules = visibleFleetModules(canFleetops);

  const onPress = (route: string, id: FleetModuleId) => {
    if (id === active) return;
    router.push(route as never);
  };

  if (variant === "grid") {
    const rows: (typeof modules)[] = [];
    for (let i = 0; i < modules.length; i += 2) {
      rows.push(modules.slice(i, i + 2));
    }
    return (
      <View style={styles.gridWrap}>
        {rows.map((row) => (
          <View key={row.map((m) => m.id).join("-")} style={styles.gridRow}>
            {row.map((module) => {
              const stat = byModule[module.id];
              const isActive = module.id === active;
              return (
                <TouchableOpacity
                  key={module.id}
                  testID={`fleet-module-${module.id}`}
                  style={[styles.gridTile, isActive && styles.gridTileActive]}
                  activeOpacity={0.75}
                  onPress={() => onPress(module.route, module.id)}
                >
                  <View style={styles.gridTop}>
                    <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                      <Ionicons name={module.icon} size={18} color={isActive ? "#fff" : colors.text} />
                    </View>
                    {stat.badge ? (
                      <View style={[styles.badge, { backgroundColor: badgeColor(stat.badgeTone) }]}>
                        <Text style={styles.badgeText}>{stat.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.gridLabel, isActive && styles.gridLabelActive]}>{module.label}</Text>
                  <Text style={styles.gridCount}>{stat.count}</Text>
                  <Text style={styles.gridHint} numberOfLines={1}>
                    {stat.hint}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {row.length === 1 ? <View style={styles.gridTileSpacer} /> : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.barRow}
    >
      {modules.map((module) => {
        const stat = byModule[module.id];
        const isActive = module.id === active;
        return (
          <TouchableOpacity
            key={module.id}
            testID={`fleet-module-${module.id}`}
            style={[styles.barChip, isActive && styles.barChipActive]}
            activeOpacity={0.75}
            onPress={() => onPress(module.route, module.id)}
          >
            <Ionicons name={module.icon} size={12} color={isActive ? "#fff" : colors.text} />
            <Text style={[styles.barLabel, isActive && styles.barLabelActive]}>{module.label}</Text>
            <Text style={[styles.barCount, isActive && styles.barCountActive]}>{stat.count}</Text>
            {stat.badge ? (
              <View style={[styles.barBadge, { backgroundColor: badgeColor(stat.badgeTone) }]}>
                <Text style={styles.barBadgeText}>{stat.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gridWrap: { gap: spacing.sm },
  gridRow: { flexDirection: "row", gap: spacing.sm },
  gridTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 108,
  },
  gridTileActive: {
    borderColor: colors.brand,
    backgroundColor: colors.surfaceAlt,
  },
  gridTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.brand,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  gridLabel: { fontSize: 12, fontWeight: "800", color: colors.text },
  gridLabelActive: { color: colors.brand },
  gridCount: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  gridHint: { fontSize: 10, fontWeight: "600", color: colors.textMuted, marginTop: 2 },
  gridTileSpacer: { flex: 1 },
  barRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  barChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 28,
  },
  barChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  barLabel: { fontSize: 10, fontWeight: "700", color: colors.text },
  barLabelActive: { color: "#fff" },
  barCount: { fontSize: 10, fontWeight: "800", color: colors.textMuted },
  barCountActive: { color: "rgba(255,255,255,0.85)" },
  barBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  barBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
