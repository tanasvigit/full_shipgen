import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { useEquipmentBundle } from "@/src/hooks/useEquipmentBundle";
import { filterEquipmentRows } from "@/src/services/equipmentService";

const STATUS_FILTERS = ["ALL", "IDLE", "ASSIGNED", "IN_USE", "MAINTENANCE", "CHARGING"] as const;

export default function YardEquipmentScreen() {
  const { user, can, isYardAdmin } = useYardAuth();
  const { data, isLoading, isRefetching, refetch, error } = useEquipmentBundle();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("ALL");

  const allowed = canAccessYardScreen("equipment", can, isYardAdmin, user?.role);
  const filtered = useMemo(() => filterEquipmentRows(data?.rows ?? [], search, status), [data?.rows, search, status]);

  if (!allowed) return <Redirect href="/(yard)/profile" />;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />}
      >
        <Text style={styles.overline}>YARD · EQUIPMENT</Text>
        <Text style={styles.title}>Equipment</Text>
        <Text style={styles.subtitle}>Forklifts, cranes, and yard equipment availability.</Text>

        {data?.summary ? (
          <View style={styles.summaryRow}>
            <Chip label="Total" value={data.summary.total} />
            <Chip label="Idle" value={data.summary.idle} />
            <Chip label="Assigned" value={data.summary.assigned} />
            <Chip label="In use" value={data.summary.inUse} />
          </View>
        ) : null}

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search code, type, operator"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, status === item && styles.filterChipActive]}
              onPress={() => setStatus(item)}
            >
              <Text style={[styles.filterChipText, status === item && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <Text style={styles.muted}>Loading equipment…</Text>
        ) : error ? (
          <Text style={styles.muted}>{error instanceof Error ? error.message : "Unable to load equipment."}</Text>
        ) : filtered.length ? (
          filtered.map((row) => {
            const badge = statusColor(row.status.toLowerCase());
            return (
              <View key={row.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.code}>{row.code}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{row.name} · {row.type}</Text>
                <Text style={styles.meta}>{row.operator} · {row.location}</Text>
                {row.battery !== null && row.battery !== undefined ? (
                  <Text style={styles.meta}>Battery {row.battery}%</Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.muted}>No equipment matches this filter.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.lg, lineHeight: 19 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    minWidth: 72,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipValue: { fontSize: 18, fontWeight: "900", color: colors.text },
  chipLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 14, color: colors.text },
  filterRow: { gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.shipgenOrange, borderColor: colors.shipgenOrange },
  filterChipText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  filterChipTextActive: { color: "#fff" },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  code: { fontSize: 18, fontWeight: "900", color: colors.shipgenOrange },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
