import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import FleetWorkspaceTabs from "@/src/components/fleet/FleetWorkspaceTabs";
import FleetOverviewPanel from "@/src/components/fleet/panels/FleetOverviewPanel";
import FleetVehiclesPanel from "@/src/components/fleet/panels/FleetVehiclesPanel";
import FleetDriversPanel from "@/src/components/fleet/panels/FleetDriversPanel";
import FleetRoutesPanel from "@/src/components/fleet/panels/FleetRoutesPanel";
import FleetPlacesPanel from "@/src/components/fleet/panels/FleetPlacesPanel";
import FleetIssuesPanel from "@/src/components/fleet/panels/FleetIssuesPanel";
import FleetFuelPanel from "@/src/components/fleet/panels/FleetFuelPanel";
import { useAuth } from "@/src/contexts/AuthContext";
import { useFleetData } from "@/src/hooks/useFleetData";
import { canAccessFleetWorkspace } from "@/src/lib/fleetAccess";
import {
  parseFleetWorkspaceTab,
  visibleFleetWorkspaceTabs,
  type FleetWorkspaceTab,
} from "@/src/lib/fleetModules";

function FleetWorkspacePanel({ tab }: { tab: FleetWorkspaceTab }) {
  switch (tab) {
    case "overview":
      return null;
    case "vehicles":
      return <FleetVehiclesPanel />;
    case "drivers":
      return <FleetDriversPanel />;
    case "routes":
      return <FleetRoutesPanel />;
    case "places":
      return <FleetPlacesPanel />;
    case "issues":
      return <FleetIssuesPanel />;
    case "fuel":
      return <FleetFuelPanel />;
    default:
      return null;
  }
}

export default function Fleet() {
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const { user, canFleetops, activeOrganization } = useAuth();
  const fleetAllowed = canAccessFleetWorkspace(user, canFleetops);
  const { error, refresh } = useFleetData();

  const visibleTabs = useMemo(() => visibleFleetWorkspaceTabs(canFleetops), [canFleetops]);
  const [activeTab, setActiveTab] = useState<FleetWorkspaceTab>("overview");

  useEffect(() => {
    const parsed = parseFleetWorkspaceTab(tabParam);
    if (visibleTabs.some((tab) => tab.id === parsed)) {
      setActiveTab(parsed);
    }
  }, [tabParam, visibleTabs]);

  const selectTab = useCallback(
    (tab: FleetWorkspaceTab) => {
      if (!visibleTabs.some((item) => item.id === tab)) return;
      setActiveTab(tab);
      router.setParams({ tab: tab === "overview" ? undefined : tab });
    },
    [router, visibleTabs],
  );

  if (!fleetAllowed) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.overline}>WORKSPACE</Text>
          <Text style={styles.title}>Fleet</Text>
          {activeOrganization?.name ? <Text style={styles.org}>{activeOrganization.name}</Text> : null}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FleetWorkspaceTabs active={activeTab} onChange={selectTab} />

      <View style={styles.body}>
        {activeTab === "overview" ? <FleetOverviewPanel onSelectTab={selectTab} /> : null}
        {activeTab !== "overview" ? <FleetWorkspacePanel tab={activeTab} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  headerText: { flex: 1 },
  overline: { fontSize: 10, letterSpacing: 1.8, fontWeight: "700", color: colors.textMuted },
  title: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5, color: colors.text, marginTop: 2 },
  org: { fontSize: 11, fontWeight: "600", color: colors.textMuted, marginTop: 4 },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 12, color: colors.error, fontWeight: "600" },
  retryText: { fontSize: 12, fontWeight: "800", color: colors.brand },
  body: { flex: 1 },
});
