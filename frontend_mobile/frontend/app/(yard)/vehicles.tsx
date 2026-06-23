import { useCallback, useMemo, useState, useEffect } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardVehicle360 } from "@/src/contexts/YardVehicle360Context";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { useVehicleMonitor } from "@/src/hooks/useVehicleMonitor";
import {
  filterVehicleMonitorRows,
  VEHICLE_MONITOR_CATEGORIES,
  type VehicleMonitorCategory,
} from "@/src/lib/vehicleMonitorActions";
import { vehicleSummaryCategory } from "@/src/lib/kpiNavigation";
import YardKpiStat from "@/src/components/yard/YardKpiStat";
import { useYardMoreBackHandler } from "@/src/components/yard/YardMoreBackHandler";

export default function YardVehiclesScreen() {
  useYardMoreBackHandler();
  const params = useLocalSearchParams<{ category?: string }>();
  const { user, can, isYardAdmin } = useYardAuth();
  const { openVehicle360 } = useYardVehicle360();
  const { data, isLoading, isRefetching, refetch, error } = useVehicleMonitor();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VehicleMonitorCategory>("inYard");

  useEffect(() => {
    const next = params.category;
    if (VEHICLE_MONITOR_CATEGORIES.some((item) => item.key === next)) {
      setCategory(next as VehicleMonitorCategory);
    }
  }, [params.category]);

  const allowed = canAccessYardScreen("vehicles", can, isYardAdmin, user?.role);

  const filteredRows = useMemo(
    () => filterVehicleMonitorRows(data?.rows ?? [], category, search),
    [category, data?.rows, search],
  );

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.overline}>YARD · VEHICLES</Text>
        <Text style={styles.title}>Vehicle monitor</Text>
        <Text style={styles.subtitle}>Live yard visibility by status, zone, and dock.</Text>

        {data?.counts ? (
          <View style={styles.summaryRow}>
            {(
              [
                ["inYard", "In yard", data.counts.inYard],
                ["waiting", "Waiting", data.counts.waiting],
                ["loading", "Loading", data.counts.loading],
                ["exitHolding", "Exit hold", data.counts.exitHolding],
              ] as const
            ).map(([key, label, value]) => (
              <YardKpiStat
                key={key}
                label={label}
                value={value}
                onPress={() => setCategory(vehicleSummaryCategory(key))}
                testID={`vehicles-kpi-${key}`}
                style={[styles.summaryChip, category === vehicleSummaryCategory(key) && styles.summaryChipActive]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search plate, transporter, zone"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            testID="vehicles-search-input"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {VEHICLE_MONITOR_CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, category === item.key && styles.filterChipActive]}
              onPress={() => setCategory(item.key)}
              testID={`vehicles-filter-${item.key}`}
            >
              <Text style={[styles.filterChipText, category === item.key && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <Text style={styles.muted}>Loading vehicles…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load vehicles</Text>
            <Text style={styles.muted}>{error instanceof Error ? error.message : "Check YMS service."}</Text>
          </View>
        ) : filteredRows.length ? (
          filteredRows.map((row) => {
            const badge = statusColor(row.status.toLowerCase());
            return (
              <View key={row.id} style={styles.rowCard}>
                <TouchableOpacity
                  onPress={() => openVehicle360({ vehicleId: row.id, query: row.plate })}
                  testID={`vehicle-row-${row.plate}`}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.plate}>{row.plate}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>{row.transporter}</Text>
                  <Text style={styles.meta}>
                    {row.zone} · {row.dockCode !== "—" ? `Dock ${row.dockCode}` : "No dock"}
                  </Text>
                  <Text style={styles.meta}>
                    {row.vehicleType} · {row.category}
                    {row.driver !== "—" ? ` · ${row.driver}` : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <Text style={styles.muted}>No vehicles match this filter.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.lg, lineHeight: 19 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  summaryChip: { minWidth: 72, flexGrow: 1 },
  summaryChipActive: { borderColor: colors.shipgenOrange },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 14, color: colors.text },
  filterRow: { gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.shipgenOrange, borderColor: colors.shipgenOrange },
  filterChipText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  filterChipTextActive: { color: "#fff" },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
  },
  errorTitle: { fontSize: 14, fontWeight: "800", color: colors.error, marginBottom: 4 },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  plate: { fontSize: 18, fontWeight: "900", color: colors.shipgenOrange },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
