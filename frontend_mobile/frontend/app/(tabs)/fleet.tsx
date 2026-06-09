import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import EntityImage from "@/src/components/EntityImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import StatusBadge from "@/src/components/StatusBadge";
import { useAuth } from "@/src/contexts/AuthContext";
import { useFleetData } from "@/src/hooks/useFleetData";
import {
  canListFleetDrivers,
  canListFleetFuel,
  canListFleetIssues,
  canListFleetPlaces,
  canListFleetRoutes,
  canManageFleetVehicles,
  showFleetTab,
} from "@/src/lib/fleetAccess";

export default function Fleet() {
  const router = useRouter();
  const { user, canFleetops } = useAuth();
  const fleetAllowed = showFleetTab(user, canFleetops);
  const [type, setType] = useState("all");
  const { vehicles, findDriver, loading, error, refresh } = useFleetData();

  const canAddVehicle = canManageFleetVehicles(canFleetops);
  const showDrivers = canListFleetDrivers(canFleetops);
  const showRoutes = canListFleetRoutes(canFleetops);
  const showPlaces = canListFleetPlaces(canFleetops);
  const showIssues = canListFleetIssues(canFleetops);
  const showFuel = canListFleetFuel(canFleetops);

  const typeFilters = useMemo(() => {
    const unique = Array.from(new Set(vehicles.map((v) => v.type).filter(Boolean)));
    return ["all", ...unique.sort()];
  }, [vehicles]);

  const filtered = useMemo(
    () => (type === "all" ? vehicles : vehicles.filter((v) => v.type === type)),
    [type, vehicles],
  );

  if (!fleetAllowed) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>FLEET</Text>
          <Text style={styles.title}>Vehicles</Text>
          {vehicles.length > 0 ? (
            <Text style={styles.count}>{vehicles.length} in fleet</Text>
          ) : null}
        </View>
        {canAddVehicle ? (
          <TouchableOpacity
            testID="add-vehicle-btn"
            style={styles.iconBtn}
            onPress={() => router.push("/vehicle/create")}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        ) : null}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moduleRow}
      >
        <ModuleChip icon="car-sport-outline" label="Vehicles" active />
        {showDrivers ? (
          <ModuleChip icon="people-outline" label="Drivers" onPress={() => router.push("/drivers")} />
        ) : null}
        {showRoutes ? (
          <ModuleChip icon="map-outline" label="Routes" onPress={() => router.push("/routes")} />
        ) : null}
        {showPlaces ? (
          <ModuleChip icon="location-outline" label="Places" onPress={() => router.push("/places")} />
        ) : null}
        {showIssues ? (
          <ModuleChip icon="alert-circle-outline" label="Issues" onPress={() => router.push("/issues")} />
        ) : null}
        {showFuel ? (
          <ModuleChip icon="flame-outline" label="Fuel" onPress={() => router.push("/fuel")} />
        ) : null}
      </ScrollView>

      {typeFilters.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {typeFilters.map((t) => (
            <TouchableOpacity
              key={t}
              testID={`type-${t}`}
              onPress={() => setType(t)}
              style={[styles.chip, type === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {loading && !filtered.length ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.loadingText}>Loading fleet vehicles...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading && filtered.length > 0} onRefresh={() => void refresh()} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {error ? "Could not load vehicles." : "No vehicles in this fleet yet."}
              </Text>
              {canAddVehicle && !error ? (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/vehicle/create")}>
                  <Text style={styles.emptyBtnText}>Add first vehicle</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const d = findDriver(item.driverId);
            const driverLabel = d?.name || item.driverName || "Unassigned";
            const fuelColor =
              item.fuel < 20 ? colors.error : item.fuel < 50 ? colors.warning : colors.success;
            return (
              <TouchableOpacity
                testID={`vehicle-row-${item.id}`}
                style={styles.row}
                onPress={() => router.push(`/vehicle/${item.id}`)}
              >
                <EntityImage uri={item.image} label={item.plate} style={styles.image} rounded={false} />
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <View>
                      <Text style={styles.plate}>{item.plate}</Text>
                      <Text style={styles.model}>{item.model}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>
                  <View style={styles.rowMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="cube-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.metaText}>{item.type}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {driverLabel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fuelRow}>
                    <View style={styles.fuelBarTrack}>
                      <View
                        style={[
                          styles.fuelBar,
                          { width: `${item.fuel}%`, backgroundColor: fuelColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.fuelText, { color: fuelColor }]}>{item.fuel}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function ModuleChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      testID={`module-${label}`}
      style={[styles.moduleChip, active && styles.moduleChipActive]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={14} color={active ? "#fff" : colors.text} />
      <Text style={[styles.moduleChipText, active && styles.moduleChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overline: { fontSize: 10, letterSpacing: 1.8, fontWeight: "700", color: colors.textMuted },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5, color: colors.text, marginTop: 2 },
  count: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
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
  moduleRow: { paddingHorizontal: spacing.lg, gap: 6, paddingBottom: spacing.sm },
  moduleChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  moduleChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  moduleChipText: { fontSize: 11, fontWeight: "700", color: colors.text },
  moduleChipTextActive: { color: "#fff" },
  filterRow: { paddingHorizontal: spacing.lg, gap: 6, paddingBottom: spacing.md, paddingTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontSize: 10, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.6 },
  chipTextActive: { color: "#fff" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: spacing.xxl, gap: 10 },
  loadingText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { paddingVertical: spacing.xxl, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: "600", textAlign: "center" },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  emptyBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  image: { width: 96, height: 110, backgroundColor: colors.surfaceAlt },
  rowBody: { flex: 1, padding: spacing.md, justifyContent: "space-between" },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  plate: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  model: { fontSize: 14, fontWeight: "800", color: colors.text, marginTop: 2 },
  rowMeta: { flexDirection: "row", gap: spacing.md, marginTop: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  metaText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: "600", flexShrink: 1 },
  fuelRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  fuelBarTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
  fuelBar: { height: "100%", borderRadius: 2 },
  fuelText: { fontSize: 11, fontWeight: "800", marginLeft: 8, width: 36, textAlign: "right" },
});
