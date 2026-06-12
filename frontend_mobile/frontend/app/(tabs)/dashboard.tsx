import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import KpiCard from "@/src/components/KpiCard";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useDriverOrders } from "@/src/hooks/useDriverOrders";
import { useAuth } from "@/src/contexts/AuthContext";
import { isDriverUser } from "@/src/lib/driver";
import { isTerminalStatus, matchesDriverBucket } from "@/src/lib/orderStatus";
import { fleetTabHref } from "@/src/lib/fleetModules";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isOpenOrder(status: string) {
  return !isTerminalStatus(status);
}

export default function Dashboard() {
  const router = useRouter();
  const { user, activeOrganization } = useAuth();
  const driverMode = isDriverUser(user);
  const fleet = useFleetData();
  const driverOrders = useDriverOrders();

  const orders = driverMode ? driverOrders.orders : fleet.orders;
  const drivers = fleet.drivers;
  const notifications = fleet.notifications;
  const vehicles = fleet.vehicles;
  const findDriver = fleet.findDriver;
  const loading = driverMode ? driverOrders.loading : fleet.loading;
  const error = driverMode ? driverOrders.error : fleet.error;
  const refresh = driverMode ? driverOrders.refresh : fleet.refresh;

  const openOrders = useMemo(() => orders.filter((order) => isOpenOrder(order.status)), [orders]);
  const assignedOrders = useMemo(
    () => orders.filter((order) => matchesDriverBucket(order.status, "assigned")),
    [orders]
  );
  const activeTripOrders = useMemo(
    () => orders.filter((order) => matchesDriverBucket(order.status, "active")),
    [orders]
  );
  const onlineDrivers = drivers.filter((driver) => driver.status === "online");
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const firstName = (user?.name || "there").split(" ")[0];
  const orgLabel = activeOrganization?.name || "Fleetbase";
  const orderValue = openOrders.reduce((sum, item) => sum + (item.amount || 0), 0);

  const onRefresh = useCallback(() => {
    void refresh();
    if (driverMode) {
      void fleet.refresh();
    }
  }, [driverMode, fleet, refresh]);

  const kpis = driverMode
    ? {
        primary: {
          label: "Open orders",
          value: openOrders.length,
          delta: `${assignedOrders.length} assigned`,
          positive: true,
          icon: "cube-outline" as const,
          onPress: () => router.push("/(tabs)/orders"),
        },
        secondary: {
          label: "In progress",
          value: activeTripOrders.length,
          delta: "active trips",
          positive: true,
          icon: "navigate-outline" as const,
          onPress: () => router.push("/(tabs)/tracking"),
        },
        tertiary: {
          label: "Unread alerts",
          value: unreadNotifications,
          delta: `${notifications.length} total`,
          positive: unreadNotifications === 0,
          icon: "notifications-outline" as const,
          onPress: () => router.push("/notifications"),
        },
        quaternary: {
          label: "Issues logged",
          value: fleet.issues.length,
          delta: "from API",
          positive: true,
          icon: "alert-circle-outline" as const,
          onPress: () => router.push(fleetTabHref("issues")),
        },
      }
    : {
        primary: {
          label: "Order value (open)",
          value: orderValue > 0 ? `$${orderValue.toLocaleString()}` : "—",
          delta: `${openOrders.length} orders`,
          positive: true,
          icon: "trending-up" as const,
          onPress: () => router.push("/(tabs)/orders"),
        },
        secondary: {
          label: "Open orders",
          value: openOrders.length,
          delta: `${activeTripOrders.length} in progress`,
          positive: true,
          icon: "cube-outline" as const,
          onPress: () => router.push("/(tabs)/orders"),
        },
        tertiary: {
          label: "Drivers online",
          value: onlineDrivers.length,
          delta: `of ${drivers.length}`,
          positive: true,
          icon: "people-outline" as const,
          onPress: () => router.push(fleetTabHref("drivers")),
        },
        quaternary: {
          label: "Vehicles active",
          value: vehicles.filter((vehicle) => vehicle.status === "active").length,
          delta: `of ${vehicles.length}`,
          positive: true,
          icon: "car-sport-outline" as const,
          onPress: () => router.push(fleetTabHref("vehicles")),
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
          {unreadNotifications > 0 ? <View style={styles.bellDot} /> : null}
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        {loading && orders.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.text} />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        ) : null}

        <View style={styles.kpiRow}>
          <KpiCard
            label={kpis.primary.label}
            value={kpis.primary.value}
            delta={kpis.primary.delta}
            positive={kpis.primary.positive}
            icon={kpis.primary.icon}
            onPress={kpis.primary.onPress}
          />
          <KpiCard
            label={kpis.secondary.label}
            value={kpis.secondary.value}
            delta={kpis.secondary.delta}
            positive={kpis.secondary.positive}
            icon={kpis.secondary.icon}
            onPress={kpis.secondary.onPress}
          />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            label={kpis.tertiary.label}
            value={kpis.tertiary.value}
            delta={kpis.tertiary.delta}
            positive={kpis.tertiary.positive}
            icon={kpis.tertiary.icon}
            onPress={kpis.tertiary.onPress}
          />
          <KpiCard
            label={kpis.quaternary.label}
            value={kpis.quaternary.value}
            delta={kpis.quaternary.delta}
            positive={kpis.quaternary.positive}
            icon={kpis.quaternary.icon}
            onPress={kpis.quaternary.onPress}
          />
        </View>

        <Text style={styles.sectionTitle}>Quick access</Text>
        <View style={styles.quickGrid}>
          {!driverMode ? (
            <QuickItem icon="people-outline" label="Drivers" onPress={() => router.push(fleetTabHref("drivers"))} />
          ) : null}
          <QuickItem icon="cube-outline" label="Orders" onPress={() => router.push("/(tabs)/orders")} />
          <QuickItem icon="navigate-outline" label="Tracking" onPress={() => router.push("/(tabs)/tracking")} />
          {!driverMode ? (
            <QuickItem icon="map-outline" label="Routes" onPress={() => router.push(fleetTabHref("routes"))} />
          ) : null}
          {!driverMode ? (
            <QuickItem icon="location-outline" label="Places" onPress={() => router.push(fleetTabHref("places"))} />
          ) : null}
          <QuickItem icon="alert-circle-outline" label="Issues" onPress={() => router.push(fleetTabHref("issues"))} />
          <QuickItem icon="flame-outline" label="Fuel" onPress={() => router.push(fleetTabHref("fuel"))} />
          <QuickItem icon="notifications-outline" label="Alerts" onPress={() => router.push("/notifications")} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{driverMode ? "My open orders" : "Open orders"}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
            <Text style={styles.linkText}>View all →</Text>
          </TouchableOpacity>
        </View>
        {openOrders.length === 0 ? (
          <Text style={styles.emptyHint}>No open orders from the API right now.</Text>
        ) : (
          openOrders.slice(0, 3).map((order) => {
            const driver = findDriver(order.driverId);
            return (
              <TouchableOpacity
                key={order.id}
                testID={`dashboard-order-${order.id}`}
                style={styles.orderRow}
                onPress={() => router.push(`/order/${order.id}`)}
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderCode}>{order.code}</Text>
                  <Text style={styles.orderCustomer} numberOfLines={1}>
                    {order.customer}
                  </Text>
                  <Text style={styles.orderRoute} numberOfLines={1}>
                    {order.pickup} → {order.dropoff}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <StatusBadge status={order.status} />
                  <Text style={styles.orderDriver}>{driver?.name || order.driverName || "—"}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {!driverMode ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Drivers online</Text>
              <TouchableOpacity onPress={() => router.push(fleetTabHref("drivers"))}>
                <Text style={styles.linkText}>View all →</Text>
              </TouchableOpacity>
            </View>
            {onlineDrivers.length === 0 ? (
              <Text style={styles.emptyHint}>No drivers are online.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.driverStrip}>
                {onlineDrivers.map((driver) => (
                  <TouchableOpacity
                    key={driver.id}
                    style={styles.driverChip}
                    onPress={() => router.push(`/driver/${driver.id}`)}
                  >
                    <View style={styles.avatarWrap}>
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitials}>
                          {driver.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </Text>
                      </View>
                      <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.chipName} numberOfLines={1}>
                      {driver.name.split(" ")[0]}
                    </Text>
                    <Text style={styles.chipMeta}>★ {driver.rating || "—"}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Recent activity</Text>
        {notifications.length === 0 ? (
          <Text style={styles.emptyHint}>No notifications yet.</Text>
        ) : (
          notifications.slice(0, 4).map((notification) => (
            <View key={notification.id} style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons
                  name={
                    notification.type === "order"
                      ? "cube-outline"
                      : notification.type === "driver"
                      ? "person-outline"
                      : notification.type === "vehicle"
                      ? "car-sport-outline"
                      : "information-circle-outline"
                  }
                  size={16}
                  color={colors.text}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{notification.title}</Text>
                <Text style={styles.activityBody} numberOfLines={1}>
                  {notification.body}
                </Text>
              </View>
              <Text style={styles.activityTime}>{notification.time}</Text>
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
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { color: colors.error, fontSize: 12, fontWeight: "600" },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  loadingText: { marginTop: spacing.sm, fontSize: 13, color: colors.textSecondary },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  kpiRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
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
