import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { useFleetData } from "@/src/hooks/useFleetData";
import {
  logCurrentOrganization,
  logPermissionInspection,
  logQueryCacheSnapshot,
  logRuntimeDiagnostics,
} from "@/src/dev/diagnostics";

export default function Profile() {
  const router = useRouter();
  const { user, activeOrganization, logout } = useAuth();
  const { orders, drivers, vehicles } = useFleetData();
  const [notif, setNotif] = useState(true);
  const [tracking, setTracking] = useState(true);
  const [dark, setDark] = useState(false);
  const initials = (user?.name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.overline}>ACCOUNT</Text>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.name}>{user?.name || "Fleet user"}</Text>
            <Text style={styles.email}>{user?.email || "No email"}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={10} color={colors.success} />
              <Text style={styles.roleText}>{(user?.role || "MEMBER").toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity testID="edit-profile-btn" style={styles.editBtn}>
            <Ionicons name="create-outline" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Orders" value={String(orders.length)} />
          <Stat label="Vehicles" value={String(vehicles.length)} />
          <Stat label="Drivers" value={String(drivers.length)} />
        </View>

        <Section title="Workspace">
          <Row
            icon="business-outline"
            label="Organization"
            value={activeOrganization?.name || "Fleetbase"}
            onPress={() => {}}
          />
        </Section>

        <Section title="Modules">
          <Row icon="people-outline" label="Drivers" onPress={() => router.push("/drivers")} />
          <Row icon="map-outline" label="Routes" onPress={() => router.push("/routes")} />
          <Row icon="location-outline" label="Places" onPress={() => router.push("/places")} />
          <Row icon="alert-circle-outline" label="Issues" onPress={() => router.push("/issues")} />
          <Row icon="flame-outline" label="Fuel reports" onPress={() => router.push("/fuel")} />
          <Row
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push("/notifications")}
          />
        </Section>

        <Section title="Preferences">
          <ToggleRow
            icon="notifications-outline"
            label="Push notifications"
            value={notif}
            onChange={setNotif}
          />
          <ToggleRow
            icon="location-outline"
            label="Location tracking"
            value={tracking}
            onChange={setTracking}
          />
          <ToggleRow icon="moon-outline" label="Dark mode" value={dark} onChange={setDark} />
        </Section>

        {__DEV__ ? (
          <Section title="Developer diagnostics">
            <Row
              icon="bug-outline"
              label="Log current org"
              onPress={() => {
                void logCurrentOrganization();
              }}
            />
            <Row
              icon="key-outline"
              label="Log permissions"
              onPress={() => logPermissionInspection(user?.raw)}
            />
            <Row
              icon="server-outline"
              label="Log query cache"
              onPress={() => logQueryCacheSnapshot("profile")}
            />
            <Row
              icon="pulse-outline"
              label="Log runtime sync state"
              onPress={() => {
                void logRuntimeDiagnostics();
              }}
            />
          </Section>
        ) : null}

        <Section title="Support">
          <Row icon="help-circle-outline" label="Help center" onPress={() => {}} />
          <Row icon="document-text-outline" label="Privacy policy" onPress={() => {}} />
          <Row icon="information-circle-outline" label="About Fleetbase" value="v1.0.0" onPress={() => {}} />
        </Section>

        <TouchableOpacity
          testID="logout-btn"
          style={styles.logout}
          onPress={async () => {
            await logout();
            router.replace("/");
          }}
        >
          <Ionicons name="log-out-outline" size={16} color={colors.error} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.copyright}>© 2026 Fleetbase Mobile</Text>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity testID={`row-${label}`} style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={colors.text} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={colors.text} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderStrong, true: colors.text }}
        thumbColor="#fff"
        testID={`toggle-${label}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { marginBottom: spacing.lg },
  overline: { fontSize: 10, letterSpacing: 1.8, fontWeight: "700", color: colors.textMuted },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5, color: colors.text, marginTop: 2 },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  name: { fontSize: 16, fontWeight: "800", color: colors.text },
  email: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
    gap: 4,
  },
  roleText: { fontSize: 9, fontWeight: "800", color: colors.success, letterSpacing: 0.8 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.text },
  statLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, marginTop: 2, letterSpacing: 1 },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  rowLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  rowValue: { fontSize: 12, color: colors.textSecondary, fontWeight: "600", marginRight: 8 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: spacing.xl,
    gap: 8,
  },
  logoutText: { color: colors.error, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
  copyright: { textAlign: "center", color: colors.textMuted, fontSize: 11, marginTop: spacing.lg },
});
