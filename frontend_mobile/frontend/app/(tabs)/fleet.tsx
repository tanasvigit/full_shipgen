import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import EntityImage from "@/src/components/EntityImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";

const TYPES = ["all", "Truck", "Van", "Bike", "Car"] as const;

export default function Fleet() {
  const router = useRouter();
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const { vehicles, findDriver } = useFleetData();

  const filtered = useMemo(
    () => (type === "all" ? vehicles : vehicles.filter((v) => v.type === type)),
    [type]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>FLEET</Text>
          <Text style={styles.title}>Vehicles</Text>
        </View>
        <TouchableOpacity testID="add-vehicle-btn" style={styles.iconBtn}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Module navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moduleRow}
      >
        <ModuleChip icon="car-sport-outline" label="Vehicles" active />
        <ModuleChip icon="people-outline" label="Drivers" onPress={() => router.push("/drivers")} />
        <ModuleChip icon="map-outline" label="Routes" onPress={() => router.push("/routes")} />
        <ModuleChip icon="location-outline" label="Places" onPress={() => router.push("/places")} />
        <ModuleChip icon="alert-circle-outline" label="Issues" onPress={() => router.push("/issues")} />
        <ModuleChip icon="flame-outline" label="Fuel" onPress={() => router.push("/fuel")} />
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {TYPES.map((t) => (
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const d = findDriver(item.driverId);
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
                      {d?.name ?? "Unassigned"}
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
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
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: "600" },
  fuelRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  fuelBarTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
  fuelBar: { height: "100%", borderRadius: 2 },
  fuelText: { fontSize: 11, fontWeight: "800", marginLeft: 8, width: 36, textAlign: "right" },
});
