import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import StylizedMap from "@/src/components/StylizedMap";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function RouteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findRoute, findDriver, findVehicle } = useFleetData();
  const route = findRoute(id);

  if (!route) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Route" back />
      </SafeAreaView>
    );
  }

  const driver = findDriver(route.driverId);
  const vehicle = findVehicle(route.vehicleId);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={route.name} subtitle={`${route.stops} stops · ${route.distance}`} back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <StylizedMap height={200} markers={route.waypoints.map((w, i) => ({
          id: `wp-${i}`,
          x: 0.15 + (i * (0.7 / Math.max(route.waypoints.length - 1, 1))),
          y: 0.3 + ((i % 2) * 0.3),
          color: w.done ? colors.success : i === 0 ? colors.text : colors.accent,
          icon: "location" as const,
        }))} />

        <View style={styles.metaGrid}>
          <Meta label="Distance" value={route.distance} />
          <Meta label="Duration" value={route.duration} />
          <Meta label="Stops" value={String(route.stops)} />
        </View>

        <View style={styles.statusRow}>
          <StatusBadge status={route.status} />
        </View>

        {driver ? (
          <TouchableOpacity style={styles.assignCard} onPress={() => router.push(`/driver/${driver.id}`)}>
            <View style={styles.assignIcon}>
              <Ionicons name="person-outline" size={16} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assignLabel}>Driver</Text>
              <Text style={styles.assignValue}>{driver.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        {vehicle ? (
          <TouchableOpacity style={styles.assignCard} onPress={() => router.push(`/vehicle/${vehicle.id}`)}>
            <View style={styles.assignIcon}>
              <Ionicons name="car-sport-outline" size={16} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assignLabel}>Vehicle</Text>
              <Text style={styles.assignValue}>{vehicle.plate} · {vehicle.model}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>WAYPOINTS</Text>
          {route.waypoints.map((w, i) => (
            <View key={i} style={styles.wpRow}>
              <View style={styles.wpLeft}>
                <View style={[styles.wpDot, w.done && styles.wpDotDone]}>
                  {w.done ? <Ionicons name="checkmark" size={10} color="#fff" /> : <Text style={styles.wpNum}>{i + 1}</Text>}
                </View>
                {i < route.waypoints.length - 1 ? <View style={[styles.wpLine, w.done && styles.wpLineDone]} /> : null}
              </View>
              <View style={styles.wpBody}>
                <View style={styles.wpHeader}>
                  <Text style={styles.wpName}>{w.name}</Text>
                  <Text style={styles.wpEta}>{w.eta}</Text>
                </View>
                <Text style={styles.wpAddress}>{w.address}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  metaGrid: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 9, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  metaValue: { fontSize: 14, fontWeight: "900", color: colors.text, marginTop: 4 },
  statusRow: { alignItems: "flex-start" },
  assignCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  assignIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  assignLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  assignValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.6, marginBottom: spacing.md },
  wpRow: { flexDirection: "row" },
  wpLeft: { width: 28, alignItems: "center" },
  wpDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  wpDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  wpNum: { fontSize: 10, fontWeight: "800", color: colors.text },
  wpLine: { width: 2, flex: 1, backgroundColor: colors.borderStrong, marginTop: 2, minHeight: 28 },
  wpLineDone: { backgroundColor: colors.success },
  wpBody: { flex: 1, paddingBottom: spacing.md, marginLeft: spacing.sm },
  wpHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  wpName: { fontSize: 13, fontWeight: "800", color: colors.text },
  wpEta: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  wpAddress: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
