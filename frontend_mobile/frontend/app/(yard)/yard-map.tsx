import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { useYardMap } from "@/src/hooks/useYardMap";
import { filterYardZones } from "@/src/lib/yardMapActions";

export default function YardMapScreen() {
  const { user, can, isYardAdmin } = useYardAuth();
  const { data, isLoading, isRefetching, refetch, error } = useYardMap();
  const [search, setSearch] = useState("");

  const allowed = canAccessYardScreen("yard-map", can, isYardAdmin, user?.role);

  const filteredZones = useMemo(
    () => filterYardZones(data?.zones ?? [], search),
    [data?.zones, search],
  );

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.overline}>YARD · MAP</Text>
        <Text style={styles.title}>Yard map</Text>
        <Text style={styles.subtitle}>Zone occupancy and yard utilization from live YMS data.</Text>

        {data?.summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Yard utilization</Text>
            <Text style={styles.summaryValue}>{data.summary.yardUtilizationPct}%</Text>
            <Text style={styles.meta}>
              {data.summary.currentOccupancy} / {data.summary.totalCapacity} slots occupied ·{" "}
              {data.summary.availableSlots} available
            </Text>
            <Text style={styles.meta}>
              {data.summary.totalZones} zones · {data.summary.fullZones} full · {data.summary.blockedZones} blocked
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.max(0, data.summary.yardUtilizationPct))}%` },
                ]}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search zone code or type"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            testID="yard-map-search-input"
          />
        </View>

        {isLoading ? (
          <Text style={styles.muted}>Loading yard zones…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load yard map</Text>
            <Text style={styles.muted}>{error instanceof Error ? error.message : "Check YMS service."}</Text>
          </View>
        ) : filteredZones.length ? (
          filteredZones.map((zone) => {
            const badge = statusColor(zone.status.toLowerCase());
            return (
              <View key={zone.id} style={styles.zoneCard} testID={`yard-zone-${zone.code}`}>
                <View style={styles.rowTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoneCode}>{zone.code}</Text>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>{zone.status}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{zone.zoneType || "Operational zone"}</Text>
                <Text style={styles.meta}>
                  {zone.occupied} / {zone.capacity} occupied · {zone.available} free
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.max(0, zone.utilizationPct))}%` },
                    ]}
                  />
                </View>
                <Text style={styles.utilLabel}>{zone.utilizationPct}% utilization</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.muted}>No zones match this search.</Text>
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
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: { fontSize: 12, fontWeight: "800", color: colors.textSecondary },
  summaryValue: { fontSize: 32, fontWeight: "900", color: colors.shipgenOrange, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
  },
  errorTitle: { fontSize: 14, fontWeight: "800", color: colors.error, marginBottom: 4 },
  zoneCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: spacing.xs },
  zoneCode: { fontSize: 18, fontWeight: "900", color: colors.shipgenOrange },
  zoneName: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.shipgenOrange, borderRadius: radius.pill },
  utilLabel: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});
