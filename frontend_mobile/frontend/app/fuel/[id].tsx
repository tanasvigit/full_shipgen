import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useAuth } from "@/src/contexts/AuthContext";
import { isDriverUser } from "@/src/lib/driver";

export default function FuelDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const driverMode = isDriverUser(user);
  const { fuelLogs, findVehicle, findDriver, sectionLoading } = useFleetData();
  const log = fuelLogs.find((item) => item.id === id);

  if (!log && sectionLoading.fuel) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Fuel report" back />
        <View style={styles.empty}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.emptyText}>Loading fuel report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!log) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Fuel report" back />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Fuel report not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const vehicle = findVehicle(log.vehicleId);
  const driver = findDriver(log.driverId);
  const vehicleLabel = vehicle?.plate || log.vehicleName || "—";
  const driverLabel = driver?.name || log.driverName || "—";
  const efficiency = log.amount > 0 ? log.cost / log.amount : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Fuel report"
        subtitle={log.station}
        back
        rightIcon={driverMode ? undefined : "create-outline"}
        onRightPress={
          driverMode
            ? undefined
            : () => router.push({ pathname: "/report-fuel", params: { id: log.id } })
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.iconBox}>
            <Ionicons name="flame" size={22} color={colors.warning} />
          </View>
          <Text style={styles.cost}>₹{log.cost.toFixed(2)}</Text>
          <Text style={styles.station}>{log.station}</Text>
        </View>

        <View style={styles.metaGrid}>
          <Meta label="Volume" value={`${log.amount} L`} />
          <Meta label="Cost / L" value={`₹${efficiency.toFixed(2)}`} />
          <Meta label="Date" value={log.date} />
        </View>

        {log.odometer != null ? (
          <View style={styles.metaGrid}>
            <Meta label="Odometer" value={String(log.odometer)} />
          </View>
        ) : null}

        {vehicle ? (
          <TouchableOpacity style={styles.assignCard} onPress={() => router.push(`/vehicle/${vehicle.id}`)}>
            <View style={styles.assignIcon}>
              <Ionicons name="car-sport-outline" size={16} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assignLabel}>Vehicle</Text>
              <Text style={styles.assignValue}>{vehicleLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.metaGrid}>
            <Meta label="Vehicle" value={vehicleLabel} />
          </View>
        )}

        {driver ? (
          <TouchableOpacity style={styles.assignCard} onPress={() => router.push(`/driver/${driver.id}`)}>
            <View style={styles.assignIcon}>
              <Ionicons name="person-outline" size={16} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assignLabel}>Driver</Text>
              <Text style={styles.assignValue}>{driverLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.metaGrid}>
            <Meta label="Driver" value={driverLabel} />
          </View>
        )}

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
  empty: { padding: spacing.xxxl, alignItems: "center", gap: spacing.sm },
  emptyText: { color: colors.textMuted },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cost: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5, color: colors.text },
  station: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginTop: 2 },
  metaGrid: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 9, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  metaValue: { fontSize: 14, fontWeight: "900", color: colors.text, marginTop: 4 },
  assignCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  assignIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  assignLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  assignValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
});
