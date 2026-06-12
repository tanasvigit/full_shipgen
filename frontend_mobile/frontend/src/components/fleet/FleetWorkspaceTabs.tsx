import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useFleetModuleStats } from "@/src/hooks/useFleetModuleStats";
import {
  visibleFleetWorkspaceTabs,
  type FleetWorkspaceTab,
} from "@/src/lib/fleetModules";

type Props = {
  active: FleetWorkspaceTab;
  onChange: (tab: FleetWorkspaceTab) => void;
};

function badgeColor(tone?: "error" | "warning" | "info") {
  if (tone === "error") return colors.error;
  if (tone === "warning") return colors.warning;
  return colors.info;
}

export default function FleetWorkspaceTabs({ active, onChange }: Props) {
  const { canFleetops } = useAuth();
  const { vehicles, drivers, routes, places, issues, fuelLogs } = useFleetData();
  const { byModule } = useFleetModuleStats({ vehicles, drivers, routes, places, issues, fuelLogs });
  const tabs = visibleFleetWorkspaceTabs(canFleetops);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const stat = tab.id === "overview" ? null : byModule[tab.id];
          return (
            <TouchableOpacity
              key={tab.id}
              testID={`fleet-tab-${tab.id}`}
              style={[styles.chip, isActive && styles.chipActive]}
              activeOpacity={0.75}
              onPress={() => onChange(tab.id)}
            >
              <Ionicons name={tab.icon} size={13} color={isActive ? "#fff" : colors.text} />
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
              {stat && stat.count > 0 ? (
                <Text style={[styles.count, isActive && styles.countActive]}>{stat.count}</Text>
              ) : null}
              {stat?.badge ? (
                <View style={[styles.badge, { backgroundColor: badgeColor(stat.badgeTone) }]}>
                  <Text style={styles.badgeText}>{stat.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    minHeight: 34,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  label: { fontSize: 11, fontWeight: "700", color: colors.text },
  labelActive: { color: "#fff" },
  count: { fontSize: 10, fontWeight: "800", color: colors.textMuted },
  countActive: { color: "rgba(255,255,255,0.85)" },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
