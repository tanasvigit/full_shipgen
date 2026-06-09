import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function FuelList() {
  const router = useRouter();
  const { fuelLogs, findVehicle, findDriver, sectionLoading, sectionError, refresh } = useFleetData();
  const loading = sectionLoading.fuel;
  const error = sectionError.fuel;
  const totalCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalVol = fuelLogs.reduce((s, f) => s + f.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Fuel reports"
        subtitle={`${fuelLogs.length} entries`}
        back
        rightIcon="add"
        onRightPress={() => router.push("/report-fuel")}
      />
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TOTAL COST</Text>
          <Text style={styles.statValue}>${totalCost.toFixed(2)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>VOLUME (L)</Text>
          <Text style={styles.statValue}>{totalVol.toFixed(1)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>ENTRIES</Text>
          <Text style={styles.statValue}>{fuelLogs.length}</Text>
        </View>
      </View>
      {loading && !fuelLogs.length ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={fuelLogs}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading && fuelLogs.length > 0} onRefresh={() => void refresh()} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No fuel reports yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const v = findVehicle(item.vehicleId);
            const d = findDriver(item.driverId);
            const vehicleLabel = v?.plate || item.vehicleName || "—";
            const driverLabel = d?.name || item.driverName || "—";
            return (
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Ionicons name="flame" size={16} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.headerRow}>
                    <Text style={styles.title}>{vehicleLabel}</Text>
                    <Text style={styles.cost}>${item.cost.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.sub}>{item.station}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="water-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.metaText}>{item.amount} L</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.metaText}>{driverLabel}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.metaText}>{item.date}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  statLabel: { fontSize: 9, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.text, marginTop: 4 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { paddingVertical: spacing.xxl, alignItems: "center" },
  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
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
    justifyContent: "space-between",
  },
  errorText: { flex: 1, fontSize: 12, color: colors.error, fontWeight: "600", marginRight: 8 },
  retryText: { fontSize: 12, fontWeight: "800", color: colors.brand },
  row: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.warningBg, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 13, fontWeight: "800", color: colors.text },
  cost: { fontSize: 13, fontWeight: "900", color: colors.text },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: spacing.md, marginTop: 6, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 10, color: colors.textSecondary, marginLeft: 3, fontWeight: "600" },
});
