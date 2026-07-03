import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function FleetFuelPanel() {
  const router = useRouter();
  const { fuelLogs, findVehicle, findDriver, sectionLoading, sectionError, refresh } = useFleetData();
  const loading = sectionLoading.fuel;
  const error = sectionError.fuel;
  const totalCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalVol = fuelLogs.reduce((s, f) => s + f.amount, 0);

  if (loading && !fuelLogs.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={fuelLogs}
      keyExtractor={(f) => f.id}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={loading && fuelLogs.length > 0} onRefresh={() => void refresh()} />}
      ListHeaderComponent={
        <View>
          <View style={styles.toolbar}>
            <Text style={styles.toolbarHint}>{fuelLogs.length} entries</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/report-fuel")}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Report</Text>
            </TouchableOpacity>
          </View>
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
              <Text style={styles.statValue}>₹{totalCost.toFixed(2)}</Text>
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
        </View>
      }
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
          <TouchableOpacity
            testID={`fuel-${item.id}`}
            style={styles.row}
            activeOpacity={0.75}
            onPress={() => router.push(`/fuel/${item.id}`)}
          >
            <View style={styles.iconBox}>
              <Ionicons name="flame" size={16} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{vehicleLabel}</Text>
                <Text style={styles.cost}>₹{item.cost.toFixed(2)}</Text>
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
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  toolbarHint: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
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
  statsRow: { flexDirection: "row", paddingBottom: spacing.md, gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statLabel: { fontSize: 9, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.text, marginTop: 4 },
  empty: { paddingVertical: spacing.xxl, alignItems: "center" },
  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  errorBanner: {
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
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.warningBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 13, fontWeight: "800", color: colors.text },
  cost: { fontSize: 13, fontWeight: "900", color: colors.text },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: spacing.md, marginTop: 6, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 10, color: colors.textSecondary, marginLeft: 3, fontWeight: "600" },
});
