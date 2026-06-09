import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import EntityImage from "@/src/components/EntityImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useAuth } from "@/src/contexts/AuthContext";
import { fleetService } from "@/src/services/fleetService";
import { queryKeys } from "@/src/query/keys";
import { idsMatch } from "@/src/lib/vehicleMapper";

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { authReady, isAuthenticated, activeOrganization } = useAuth();
  const companyUuid = activeOrganization?.uuid || null;
  const { findVehicle, findDriver, orders, issues, fuelLogs } = useFleetData();
  const cached = findVehicle(id);

  const vehicleQuery = useQuery({
    queryKey: queryKeys.vehicle(companyUuid, id),
    enabled: authReady && isAuthenticated && Boolean(id),
    queryFn: () => fleetService.getVehicle(id),
    initialData: cached,
    staleTime: cached ? 30_000 : 0,
  });

  const vehicle = vehicleQuery.data;
  const loading = vehicleQuery.isLoading && !vehicle;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Vehicle" back />
        <View style={styles.loader}>
          <ActivityIndicator color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Vehicle" back />
        <View style={styles.loader}>
          <Text style={styles.missingText}>Vehicle not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const driver = findDriver(vehicle.driverId);
  const driverName = driver?.name || vehicle.driverName;
  const vehicleOrders = orders.filter((o) => idsMatch(o.vehicleId, vehicle.id));
  const vehicleIssues = issues.filter((i) => idsMatch(i.vehicleId, vehicle.id));
  const fuel = fuelLogs.filter((f) => idsMatch(f.vehicleId, vehicle.id));
  const fuelColor =
    vehicle.fuel < 20 ? colors.error : vehicle.fuel < 50 ? colors.warning : colors.success;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={vehicle.plate} subtitle={vehicle.model} back rightIcon="ellipsis-horizontal" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <EntityImage uri={vehicle.image} label={vehicle.plate} style={styles.hero} rounded={false} />

        <View style={styles.headerCard}>
          <View>
            <Text style={styles.plate}>{vehicle.plate}</Text>
            <Text style={styles.model}>{vehicle.model}</Text>
          </View>
          <StatusBadge status={vehicle.status} />
        </View>

        <View style={styles.metaGrid}>
          <MetaCard label="Type" value={vehicle.type} icon="cube-outline" />
          <MetaCard
            label="Mileage"
            value={`${vehicle.mileage.toLocaleString()} mi`}
            icon="speedometer-outline"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>FUEL LEVEL</Text>
          <View style={styles.fuelRow}>
            <View style={styles.fuelTrack}>
              <View style={[styles.fuelBar, { width: `${vehicle.fuel}%`, backgroundColor: fuelColor }]} />
            </View>
            <Text style={[styles.fuelText, { color: fuelColor }]}>{vehicle.fuel}%</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>MAINTENANCE</Text>
          <InfoRow icon="construct-outline" label="Last service" value={vehicle.lastService} />
          <InfoRow icon="calendar-outline" label="Next service" value={vehicle.nextService} />
        </View>

        {driver || driverName ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>ASSIGNED DRIVER</Text>
            {driver ? (
              <TouchableOpacity
                style={styles.driverCard}
                onPress={() => router.push(`/driver/${driver.id}`)}
              >
                <EntityImage uri={driver.avatar} label={driver.name} style={styles.driverAvatar} rounded />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.driverSub}>★ {driver.rating} · {driver.trips} trips</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.driverName}>{driverName}</Text>
            )}
          </View>
        ) : null}

        <View style={styles.tripleGrid}>
          <MiniStat label="ORDERS" value={vehicleOrders.length} icon="cube-outline" />
          <MiniStat label="ISSUES" value={vehicleIssues.length} icon="alert-circle-outline" />
          <MiniStat label="REFUELS" value={fuel.length} icon="flame-outline" />
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaCard({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.metaCard}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={14} color={colors.text} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={16} color={colors.text} />
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  missingText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  scroll: { padding: spacing.lg, gap: spacing.md },
  hero: { width: "100%", height: 180, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  headerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plate: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  model: { fontSize: 18, fontWeight: "900", color: colors.text, marginTop: 2, letterSpacing: -0.2 },
  metaGrid: { flexDirection: "row", gap: spacing.md },
  metaCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  metaLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1, marginTop: spacing.sm },
  metaValue: { fontSize: 16, fontWeight: "900", color: colors.text, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.6, marginBottom: spacing.md },
  fuelRow: { flexDirection: "row", alignItems: "center" },
  fuelTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
  fuelBar: { height: "100%", borderRadius: 4 },
  fuelText: { fontSize: 14, fontWeight: "800", marginLeft: 12, width: 50, textAlign: "right" },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  infoIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  infoLabel: { fontSize: 12, color: colors.textSecondary, flex: 1, fontWeight: "600" },
  infoValue: { fontSize: 12, fontWeight: "700", color: colors.text },
  driverCard: { flexDirection: "row", alignItems: "center" },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt },
  driverName: { fontSize: 14, fontWeight: "800", color: colors.text },
  driverSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  tripleGrid: { flexDirection: "row", gap: spacing.md },
  miniStat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: "flex-start" },
  miniStatValue: { fontSize: 20, fontWeight: "900", color: colors.text, marginTop: 6 },
  miniStatLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1, marginTop: 2 },
});
