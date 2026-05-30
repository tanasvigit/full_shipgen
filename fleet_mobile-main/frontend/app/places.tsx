import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import { useFleetData } from "@/src/hooks/useFleetData";

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Warehouse: "cube-outline",
  Hub: "business-outline",
  Customer: "person-outline",
};

export default function PlacesList() {
  const { places } = useFleetData();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Places" subtitle={`${places.length} locations`} back rightIcon="add" />
      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity testID={`place-${item.id}`} style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name={typeIcons[item.type] ?? "location-outline"} size={16} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.address}>{item.address}</Text>
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.city}</Text>
                <Text style={styles.dot}>·</Text>
                <Ionicons name="cube-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.ordersCount} orders</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  row: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 14, fontWeight: "800", color: colors.text, flex: 1, marginRight: 8 },
  typeBadge: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 9, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.8 },
  address: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  metaText: { fontSize: 11, color: colors.textMuted, marginLeft: 3, fontWeight: "600" },
  dot: { fontSize: 11, color: colors.textMuted, marginHorizontal: 6 },
});
