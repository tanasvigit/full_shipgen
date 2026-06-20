import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";

export default function YardProfileScreen() {
  const router = useRouter();
  const { user, logout, can } = useYardAuth();

  const handleLogout = () => {
    Alert.alert("Sign out of Yard", "Return to the Shipgen module picker?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void logout().then(() => router.replace("/"));
        },
      },
    ]);
  };

  const initials = (user?.displayName || user?.username || "Y")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.overline}>YARD · PROFILE</Text>
        <Text style={styles.title}>Operator account</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.displayName || user?.username}</Text>
            <Text style={styles.role}>{user?.role?.replace(/_/g, " ")}</Text>
            <Text style={styles.meta}>@{user?.username}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <PermissionRow label="Gate check-in" enabled={can("flow:check_in") || can("*")} />
          <PermissionRow label="Gate transitions" enabled={can("flow:vehicle_transition") || can("*")} />
          <PermissionRow label="Queue management" enabled={can("queue:write") || can("*")} />
          <PermissionRow label="Yard events" enabled={can("yard:event_write") || can("*")} />
        </View>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace("/")}>
          <Ionicons name="grid-outline" size={16} color={colors.text} />
          <Text style={styles.secondaryBtnText}>Switch module</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} testID="yard-logout-btn">
          <Ionicons name="log-out-outline" size={16} color="#fff" />
          <Text style={styles.logoutText}>Sign out of Yard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function PermissionRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <View style={styles.permRow}>
      <Ionicons name={enabled ? "checkmark-circle" : "close-circle"} size={16} color={enabled ? colors.success : colors.textMuted} />
      <Text style={styles.permText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.shipgenOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  name: { fontSize: 18, fontWeight: "800", color: colors.text },
  role: { fontSize: 13, color: colors.shipgenOrange, marginTop: 2, textTransform: "capitalize", fontWeight: "700" },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: { width: "100%", fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  permRow: { width: "100%", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  permText: { fontSize: 13, color: colors.textSecondary },
  secondaryBtn: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { fontWeight: "700", color: colors.text },
  logoutBtn: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "700" },
});
