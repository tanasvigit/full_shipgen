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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import StatusBadge from "@/src/components/StatusBadge";
import { useAuth } from "@/src/contexts/AuthContext";
import { useFleetData } from "@/src/hooks/useFleetData";
import { canManageFleetVehicles } from "@/src/lib/fleetAccess";

export default function FleetVehiclesPanel() {
  const router = useRouter();
  const { canFleetops } = useAuth();
  const [type, setType] = useState("all");
  const { vehicles, findDriver, loading, error, refresh } = useFleetData();
  const canAddVehicle = canManageFleetVehicles(canFleetops);

  const typeFilters = useMemo(() => {
    const unique = Array.from(new Set(vehicles.map((v) => v.type).filter(Boolean)));
    return ["all", ...unique.sort()];
  }, [vehicles]);

  const filtered = useMemo(
    () => (type === "all" ? vehicles : vehicles.filter((v) => v.type === type)),
    [type, vehicles],
  );

  const listHeader = (
    <View style={styles.listHead}>
      <View style={styles.listHeadRow}>
        <View>
          <Text style={styles.sectionHint}>{filtered.length} shown</Text>
        </View>
        {canAddVehicle ? (
          <TouchableOpacity
            testID="add-vehicle-btn"
            style={styles.addBtn}
            onPress={() => router.push("/vehicle/create")}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {typeFilters.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {typeFilters.map((t) => (
            <TouchableOpacity
              key={t}
              testID={`type-${t}`}
              onPress={() => setType(t)}
              style={[styles.chip, type === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  if (loading && !filtered.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.text} />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={listHeader}
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
        const fuelColor = item.fuel < 20 ? colors.error : item.fuel < 50 ? colors.warning : colors.success;
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
                  <View style={[styles.fuelBar, { width: `${item.fuel}%`, backgroundColor: fuelColor }]} />
                </View>
                <Text style={[styles.fuelText, { color: fuelColor }]}>{item.fuel}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  listHead: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
  listHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  sectionHint: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  addBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  filterRow: { gap: 6 },
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
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
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
