import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function RoutesList() {
  const router = useRouter();
  const { routes, findDriver } = useFleetData();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Routes" subtitle={`${routes.length} routes`} back rightIcon="add" />
      <FlatList
        data={routes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const d = findDriver(item.driverId);
          return (
            <TouchableOpacity
              testID={`route-row-${item.id}`}
              style={styles.row}
              onPress={() => router.push(`/route/${item.id}`)}
            >
              <View style={styles.top}>
                <Text style={styles.name}>{item.name}</Text>
                <StatusBadge status={item.status} />
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.stops} stops</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.distance}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.duration}</Text>
                </View>
              </View>
              {d ? (
                <View style={styles.driverRow}>
                  <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.driverText}>{d.name}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "800", color: colors.text, flex: 1, marginRight: spacing.sm },
  metaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: "600" },
  driverRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  driverText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: "700" },
});
