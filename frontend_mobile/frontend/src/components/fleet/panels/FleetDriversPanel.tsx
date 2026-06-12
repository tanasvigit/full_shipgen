import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import EntityImage from "@/src/components/EntityImage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function FleetDriversPanel() {
  const router = useRouter();
  const { drivers, sectionLoading, sectionError, refresh } = useFleetData();
  const loading = sectionLoading.drivers;
  const error = sectionError.drivers;

  if (loading && !drivers.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={drivers}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={loading && drivers.length > 0} onRefresh={() => void refresh()} />}
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
          <Text style={styles.emptyText}>No drivers found.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          testID={`driver-row-${item.id}`}
          style={styles.row}
          onPress={() => router.push(`/driver/${item.id}`)}
        >
          <View>
            <EntityImage uri={item.avatar} label={item.name} style={styles.avatar} rounded />
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    item.status === "online"
                      ? colors.success
                      : item.status === "idle"
                        ? colors.warning
                        : colors.offline,
                },
              ]}
            />
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>{item.currentLocation}</Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={11} color={colors.warning} />
                <Text style={styles.metaText}>{item.rating}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="repeat-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.trips} trips</Text>
              </View>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </TouchableOpacity>
      )}
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt },
  dot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.surface },
  body: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 14, fontWeight: "800", color: colors.text },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: "row", gap: spacing.md, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 10, color: colors.textSecondary, marginLeft: 3, fontWeight: "600" },
});
