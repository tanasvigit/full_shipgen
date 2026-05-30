import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import KpiCard from "@/src/components/KpiCard";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useAuth } from "@/src/contexts/AuthContext";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const router = useRouter();
  const { user, activeOrganization } = useAuth();
  const { orders, drivers, notifications, vehicles, findDriver } = useFleetData();
  const activeOrders = orders.filter((o) => ["in_transit", "assigned", "pending"].includes(o.status));
  const onlineDrivers = drivers.filter((d) => d.status === "online");
  const firstName = (user?.name || "there").split(" ")[0];
  const orgLabel = activeOrganization?.name || "Fleetbase";
  const todayRevenue = orders.reduce((sum, item) => sum + (item.amount || 0), 0);

  const kpis = {
    revenue: {
      label: "Order value (loaded)",
      value: todayRevenue,
      delta: `${orders.length} orders`,
      positive: true,
    },
    activeOrders: { label: "Active orders", value: activeOrders.length, delta: "live", positive: true },
    driversOnline: {
      label: "Drivers online",
      value: onlineDrivers.length,
      delta: `of ${drivers.length}`,
      positive: true,
    },
    vehiclesActive: {
      label: "Vehicles active",
      value: vehicles.filter((vehicle) => vehicle.status === "active").length,
      delta: `of ${vehicles.length}`,
      positive: true,
    },
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.overline}>{orgLabel.toUpperCase()}</Text>
          <Text style={styles.greeting}>
            {greetingForHour(new Date().getHours())}, {firstName}
          </Text>
        </View>
        <TouchableOpacity
          testID="notifications-btn"
          onPress={() => router.push("/notifications")}
          style={styles.bellBtn}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          {notifications.some((n) => !n.read) ? <View style={styles.bellDot} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiRow}>
          <KpiCard
            label={kpis.revenue.label}
            value={todayRevenue > 0 ? `$${todayRevenue.toLocaleString()}` : "—"}
            delta={kpis.revenue.delta}
            positive={kpis.revenue.positive}
            icon="trending-up"
          />
          <KpiCard
            label={kpis.activeOrders.label}
            value={kpis.activeOrders.value}
            delta={kpis.activeOrders.delta}
            positive={kpis.activeOrders.positive}
            icon="cube-outline"
          />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            label={kpis.driversOnline.label}
            value={kpis.driversOnline.value}
            delta={kpis.driversOnline.delta}
            icon="people-outline"
          />
          <KpiCard
            label={kpis.vehiclesActive.label}
            value={kpis.vehiclesActive.value}
            delta={kpis.vehiclesActive.delta}
            icon="car-sport-outline"
          />
        </View>

        <Text style={styles.sectionTitle}>Quick access</Text>
        <View style={styles.quickGrid}>
          <QuickItem icon="people-outline" label="Drivers" onPress={() => router.push("/drivers")} />
          <QuickItem icon="map-outline" label="Routes" onPress={() => router.push("/routes")} />
          <QuickItem icon="location-outline" label="Places" onPress={() => router.push("/places")} />
          <QuickItem icon="alert-circle-outline" label="Issues" onPress={() => router.push("/issues")} />
          <QuickItem icon="flame-outline" label="Fuel" onPress={() => router.push("/fuel")} />
          <QuickItem icon="notifications-outline" label="Alerts" onPress={() => router.push("/notifications")} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active orders</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
            <Text style={styles.linkText}>View all →</Text>
          </TouchableOpacity>
        </View>
        {activeOrders.length === 0 ? (
          <Text style={styles.emptyHint}>No active orders from the API right now.</Text>
        ) : (
          activeOrders.slice(0, 3).map((o) => {
            const d = findDriver(o.driverId);
            return (
              <TouchableOpacity
                key={o.id}
                testID={`dashboard-order-${o.id}`}
                style={styles.orderRow}
                onPress={() => router.push(`/order/${o.id}`)}
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderCode}>{o.code}</Text>
                  <Text style={styles.orderCustomer} numberOfLines={1}>
                    {o.customer}
                  </Text>
                  <Text style={styles.orderRoute} numberOfLines={1}>
                    {o.pickup} → {o.dropoff}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <StatusBadge status={o.status} />
                  <Text style={styles.orderDriver}>{d?.name || "—"}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Drivers online</Text>
          <TouchableOpacity onPress={() => router.push("/drivers")}>
            <Text style={styles.linkText}>View all →</Text>
          </TouchableOpacity>
        </View>
        {onlineDrivers.length === 0 ? (
          <Text style={styles.emptyHint}>No drivers are online.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.driverStrip}>
            {onlineDrivers.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.driverChip}
                onPress={() => router.push(`/driver/${d.id}`)}
              >
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {d.name.split(" ").map((p) => p[0]).join("")}
                    </Text>
                  </View>
                  <View style={styles.onlineDot} />
                </View>
                <Text style={styles.chipName} numberOfLines={1}>
                  {d.name.split(" ")[0]}
                </Text>
                <Text style={styles.chipMeta}>★ {d.rating || "—"}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>Recent activity</Text>
        {notifications.length === 0 ? (
          <Text style={styles.emptyHint}>No notifications yet.</Text>
        ) : (
          notifications.slice(0, 4).map((n) => (
            <View key={n.id} style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons
                  name={
                    n.type === "order"
                      ? "cube-outline"
                      : n.type === "driver"
                      ? "person-outline"
                      : n.type === "vehicle"
                      ? "car-sport-outline"
                      : "information-circle-outline"
                  }
                  size={16}
                  color={colors.text}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{n.title}</Text>
                <Text style={styles.activityBody} numberOfLines={1}>
                  {n.body}
                </Text>
              </View>
              <Text style={styles.activityTime}>{n.time}</Text>
            </View>
          ))
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity testID={`quick-${label}`} style={styles.quickItem} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overline: { fontSize: 10, letterSpacing: 1.8, fontWeight: "700", color: colors.textMuted },
  greeting: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5, color: colors.text, marginTop: 2 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  kpiRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: -0.2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.md },
  linkText: { fontSize: 12, fontWeight: "700", color: colors.accent },
  emptyHint: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  quickItem: {
    width: "30.5%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickLabel: { fontSize: 12, fontWeight: "700", color: colors.text },
  orderRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderLeft: { flex: 1, marginRight: spacing.sm },
  orderCode: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 0.8 },
  orderCustomer: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
  orderRoute: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  orderRight: { alignItems: "flex-end", justifyContent: "space-between" },
  orderDriver: { fontSize: 11, color: colors.textSecondary, marginTop: 6, fontWeight: "600" },
  driverStrip: { gap: spacing.sm, paddingRight: spacing.lg },
  driverChip: {
    width: 84,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: "center",
  },
  avatarWrap: { width: 48, height: 48, marginBottom: 6 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontWeight: "800", fontSize: 14 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  chipName: { fontSize: 12, fontWeight: "700", color: colors.text },
  chipMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  activityTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  activityBody: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  activityTime: { fontSize: 10, color: colors.textMuted, marginLeft: 8, fontWeight: "600" },
});
