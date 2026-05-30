import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import EntityImage from "@/src/components/EntityImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function DriverDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findDriver, findVehicle, orders } = useFleetData();
  const driver = findDriver(id);

  if (!driver) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Driver" back />
      </SafeAreaView>
    );
  }

  const vehicle = findVehicle(driver.vehicleId);
  const driverOrders = orders.filter((o) => o.driverId === driver.id);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Driver" subtitle={driver.name} back rightIcon="ellipsis-horizontal" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <EntityImage uri={driver.avatar} label={driver.name} style={styles.avatar} rounded />
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.email}>{driver.email}</Text>
          <View style={{ marginTop: spacing.sm }}>
            <StatusBadge status={driver.status} />
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${driver.phone}`)}
              testID="driver-call-btn"
            >
              <Ionicons name="call" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnAlt} testID="driver-msg-btn">
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.text} />
              <Text style={styles.actionBtnAltText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Rating" value={`★ ${driver.rating}`} />
          <Stat label="Trips" value={String(driver.trips)} />
          <Stat label="Earnings" value={`$${(driver.earnings / 1000).toFixed(1)}K`} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DETAILS</Text>
          <InfoRow icon="card-outline" label="License" value={driver.licenseNo} />
          <InfoRow icon="call-outline" label="Phone" value={driver.phone} />
          <InfoRow icon="location-outline" label="Location" value={driver.currentLocation} />
          <InfoRow icon="calendar-outline" label="Joined" value={driver.joinedAt} />
        </View>

        {vehicle ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>ASSIGNED VEHICLE</Text>
            <TouchableOpacity
              style={styles.vehicleCard}
              onPress={() => router.push(`/vehicle/${vehicle.id}`)}
            >
              <EntityImage uri={vehicle.image} label={vehicle.plate} style={styles.vehicleImg} rounded={false} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
                <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                <View style={{ marginTop: 6 }}>
                  <StatusBadge status={vehicle.status} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>RECENT ORDERS ({driverOrders.length})</Text>
          {driverOrders.length === 0 ? (
            <Text style={styles.empty}>No orders yet.</Text>
          ) : (
            driverOrders.map((o, i) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.orderRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                onPress={() => router.push(`/order/${o.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderCode}>{o.code}</Text>
                  <Text style={styles.orderCustomer} numberOfLines={1}>
                    {o.customer}
                  </Text>
                </View>
                <StatusBadge status={o.status} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={14} color={colors.text} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceAlt },
  name: { fontSize: 20, fontWeight: "900", color: colors.text, marginTop: spacing.md, letterSpacing: -0.3 },
  email: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  heroActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, width: "100%" },
  actionBtn: { flex: 1, height: 42, borderRadius: radius.md, backgroundColor: colors.text, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  actionBtnAlt: { flex: 1, height: 42, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  actionBtnAltText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  statsRow: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.text },
  statLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, marginTop: 2, letterSpacing: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.6, marginBottom: spacing.md },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  infoIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  infoLabel: { fontSize: 12, color: colors.textSecondary, flex: 1, fontWeight: "600" },
  infoValue: { fontSize: 12, fontWeight: "700", color: colors.text },
  vehicleCard: { flexDirection: "row", alignItems: "center" },
  vehicleImg: { width: 64, height: 56, borderRadius: 6, backgroundColor: colors.surfaceAlt },
  vehiclePlate: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  vehicleModel: { fontSize: 14, fontWeight: "800", color: colors.text, marginTop: 2 },
  orderRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  orderCode: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  orderCustomer: { fontSize: 13, fontWeight: "700", color: colors.text, marginTop: 2 },
  empty: { color: colors.textMuted, textAlign: "center", padding: spacing.md, fontSize: 12 },
});
