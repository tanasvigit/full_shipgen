import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import StatusBadge from "@/src/components/StatusBadge";
import { useDriverOrders } from "@/src/hooks/useDriverOrders";
import { matchesDriverBucket, type DriverOrderBucket } from "@/src/lib/orderStatus";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useSyncStatus } from "@/src/hooks/useSyncStatus";
import { SyncBanner } from "@/src/sync/indicators";

const FILTERS: DriverOrderBucket[] = ["assigned", "active", "completed"];

export default function Orders() {
  const router = useRouter();
  const [filter, setFilter] = useState<DriverOrderBucket>("assigned");
  const [query, setQuery] = useState("");
  const { orders, loading, error, refresh } = useDriverOrders();
  const permissions = usePermissions();
  const { snapshot: syncSnapshot, retrySync } = useSyncStatus();

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchFilter = matchesDriverBucket(o.status, filter);
      const q = query.toLowerCase().trim();
      const matchQuery =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.pickup.toLowerCase().includes(q) ||
        o.dropoff.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [filter, query, orders]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>MY ORDERS</Text>
          <Text style={styles.title}>Orders</Text>
        </View>
        <TouchableOpacity
          testID="new-order-btn"
          style={[styles.iconBtn, !permissions.canCreateOrder && styles.iconBtnDisabled]}
          disabled={!permissions.canCreateOrder}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      {!permissions.canCreateOrder ? (
        <Text style={styles.permissionHint}>{permissions.permissionReason("create", "order")}</Text>
      ) : null}
      <SyncBanner snapshot={syncSnapshot} onRetry={retrySync} />

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          testID="orders-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by code, customer, address"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            testID={`filter-${f}`}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.replace("_", " ").toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <>
                <ActivityIndicator color={colors.text} />
                <Text style={styles.emptyText}>Loading orders...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  {error ? "Unable to load orders. Pull to refresh." : "No orders match this state."}
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`order-row-${item.id}`}
            style={styles.row}
            onPress={() => router.push(`/order/${item.id}`)}
          >
            <View style={styles.rowTop}>
              <Text style={styles.code}>{item.code}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.customer}>{item.customer}</Text>
            <View style={styles.routeRow}>
              <View style={styles.routeDotA} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.pickup}
              </Text>
            </View>
            <View style={styles.routeRow}>
              <View style={styles.routeDotB} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.dropoff}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.scheduledAt}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>${item.amount}</Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overline: { fontSize: 10, letterSpacing: 1.8, fontWeight: "700", color: colors.textMuted },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5, color: colors.text, marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDisabled: { backgroundColor: colors.offline },
  permissionHint: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    fontSize: 11,
    color: colors.textMuted,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 },
  filterRow: { paddingHorizontal: spacing.lg, gap: 6, paddingBottom: spacing.md },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 10, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.6 },
  chipTextActive: { color: "#fff" },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  code: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  customer: { fontSize: 15, fontWeight: "800", color: colors.text, marginTop: 6, marginBottom: spacing.sm },
  routeRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  routeDotA: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text, marginRight: 8 },
  routeDotB: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginRight: 8 },
  routeText: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  metaRow: { flexDirection: "row", marginTop: spacing.md, gap: spacing.lg, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: "600" },
  empty: { padding: spacing.xxxl, alignItems: "center" },
  emptyText: { color: colors.textMuted, marginTop: spacing.md, fontSize: 13 },
});
