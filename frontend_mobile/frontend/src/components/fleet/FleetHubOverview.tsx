import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import KpiCard from "@/src/components/KpiCard";
import FleetModuleNav from "@/src/components/fleet/FleetModuleNav";
import { colors, spacing } from "@/src/theme";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useFleetModuleStats } from "@/src/hooks/useFleetModuleStats";

export default function FleetHubOverview() {
  const router = useRouter();
  const { vehicles, drivers, routes, places, issues, fuelLogs } = useFleetData();
  const { kpis } = useFleetModuleStats({ vehicles, drivers, routes, places, issues, fuelLogs });

  return (
    <View style={styles.wrap}>
      <View style={styles.kpiRow}>
        <View style={styles.kpiHalf}>
          <KpiCard
            label="VEHICLES"
            value={kpis.vehicles}
            delta="in fleet"
            positive
            icon="car-sport-outline"
            onPress={() => router.push("/(tabs)/fleet")}
          />
        </View>
        <View style={styles.kpiHalf}>
          <KpiCard
            label="DRIVERS"
            value={kpis.driversOnline}
            delta="online now"
            positive={kpis.driversOnline > 0}
            icon="people-outline"
            onPress={() => router.push("/drivers")}
          />
        </View>
      </View>
      <View style={styles.kpiRow}>
        <View style={styles.kpiHalf}>
          <KpiCard
            label="OPEN ISSUES"
            value={kpis.openIssues}
            delta={kpis.openIssues === 0 ? "all clear" : "need attention"}
            positive={kpis.openIssues === 0}
            icon="alert-circle-outline"
            onPress={() => router.push("/issues")}
          />
        </View>
        <View style={styles.kpiHalf}>
          <KpiCard
            label="ACTIVE ROUTES"
            value={kpis.activeRoutes}
            delta="in progress"
            positive={kpis.activeRoutes > 0}
            icon="map-outline"
            onPress={() => router.push("/routes")}
          />
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Ionicons name="grid-outline" size={14} color={colors.textMuted} />
        <Text style={styles.sectionTitle}>Fleet modules</Text>
      </View>
      <FleetModuleNav active="vehicles" variant="grid" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  kpiRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  kpiHalf: { flex: 1, minWidth: 0 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
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
