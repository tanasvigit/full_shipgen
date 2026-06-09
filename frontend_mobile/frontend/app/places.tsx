import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
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
  const { places, sectionLoading, sectionError, refresh } = useFleetData();
  const loading = sectionLoading.places;
  const error = sectionError.places;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Places" subtitle={`${places.length} locations`} back rightIcon="add" />
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {loading && !places.length ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading && places.length > 0} onRefresh={() => void refresh()} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No places found.</Text>
            </View>
          }
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
                  {item.ordersCount > 0 ? (
                    <>
                      <Text style={styles.dot}>·</Text>
                      <Ionicons name="cube-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.metaText}>{item.ordersCount} orders</Text>
                    </>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg },
  empty: { paddingVertical: spacing.xxl, alignItems: "center" },
  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
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
