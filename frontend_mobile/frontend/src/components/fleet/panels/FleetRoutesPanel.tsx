import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function FleetRoutesPanel() {
  const router = useRouter();
  const { routes, findDriver, sectionLoading, sectionError, refresh } = useFleetData();
  const loading = sectionLoading.routes;
  const error = sectionError.routes;

  if (loading && !routes.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={routes}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={loading && routes.length > 0} onRefresh={() => void refresh()} />}
      ListHeaderComponent={
        error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void refresh()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No routes yet.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const d = findDriver(item.driverId);
        const driverLabel = d?.name || item.driverName || "";
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
            {driverLabel ? (
              <View style={styles.driverRow}>
                <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                <Text style={styles.driverText}>{driverLabel}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  driverText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: "700" },
});
