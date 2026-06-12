import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FleetModuleNav from "@/src/components/fleet/FleetModuleNav";
import { colors, spacing } from "@/src/theme";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useFleetModuleStats } from "@/src/hooks/useFleetModuleStats";
import type { FleetWorkspaceTab } from "@/src/lib/fleetModules";

type Props = {
  onSelectTab: (tab: FleetWorkspaceTab) => void;
};

export default function FleetOverviewPanel({ onSelectTab }: Props) {
  const { vehicles, drivers, routes, places, issues, fuelLogs } = useFleetData();
  const { summary } = useFleetModuleStats({ vehicles, drivers, routes, places, issues, fuelLogs });

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}

      <View style={styles.sectionHead}>
        <Ionicons name="grid-outline" size={14} color={colors.textMuted} />
        <Text style={styles.sectionTitle}>Quick access</Text>
      </View>
      <FleetModuleNav variant="grid" onSelectTab={onSelectTab} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  summary: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
