import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function FuelList() {
  const { fuelLogs, findVehicle, findDriver } = useFleetData();
  const totalCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalGal = fuelLogs.reduce((s, f) => s + f.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Fuel reports" subtitle={`${fuelLogs.length} entries`} back />
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TOTAL COST</Text>
          <Text style={styles.statValue}>${totalCost}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>GALLONS</Text>
          <Text style={styles.statValue}>{totalGal}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>ENTRIES</Text>
          <Text style={styles.statValue}>{fuelLogs.length}</Text>
        </View>
      </View>
      <FlatList
        data={fuelLogs}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const v = findVehicle(item.vehicleId);
          const d = findDriver(item.driverId);
          return (
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Ionicons name="flame" size={16} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{v?.plate ?? "—"}</Text>
                  <Text style={styles.cost}>${item.cost}</Text>
                </View>
                <Text style={styles.sub}>{item.station}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="water-outline" size={11} color={colors.textMuted} />
                    <Text style={styles.metaText}>{item.amount} gal</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                    <Text style={styles.metaText}>{d?.name ?? "—"}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  statsRow: { flexDirection: "row", padding: spacing.lg, gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  statLabel: { fontSize: 9, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.text, marginTop: 4 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
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
