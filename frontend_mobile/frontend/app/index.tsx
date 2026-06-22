import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMinBootDuration } from "@/src/hooks/useMinBootDuration";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import ShipgenBrand from "@/src/components/shipgen/ShipgenBrand";
import ShipgenLogoLoader from "@/src/components/shipgen/ShipgenLogoLoader";
import { setActiveModule } from "@/src/lib/appModule";
import { defaultMobileHome, defaultYardHome, visibleMobileModules } from "@/src/lib/moduleAccess";

const LANDING_HIGHLIGHTS = [
  {
    icon: "car-sport" as const,
    color: colors.shipgenBlue,
    label: "Fleetops",
    text: "Assigned orders, live route tracking, proof of delivery, and fleet workflows.",
  },
  {
    icon: "business" as const,
    color: colors.shipgenOrange,
    label: "Yard Management System",
    text: "Gate operations, virtual queue, dock orchestration, yard map, and loading control.",
  },
  {
    icon: "shield-checkmark" as const,
    color: "#1E3A5F",
    label: "Secure module access",
    text: "Fleetops uses Shipgen credentials; yard teams sign in with YMS operator accounts.",
  },
] as const;

type ModuleCardProps = {
  testID: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  cardBg: string;
  cardBorder: string;
  artBg: string;
  artIcon: keyof typeof Ionicons.glyphMap;
  artIconColor: string;
  buttonBg: string;
  onPress: () => void;
};

function LandingModuleCard({
  testID,
  title,
  description,
  icon,
  iconColor,
  iconBg,
  cardBg,
  cardBorder,
  artBg,
  artIcon,
  artIconColor,
  buttonBg,
  onPress,
}: ModuleCardProps) {
  return (
    <TouchableOpacity
      style={[styles.moduleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
      testID={testID}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <View style={[styles.moduleIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleBody}>{description}</Text>
      <View style={[styles.moduleArt, { backgroundColor: artBg }]}>
        <Ionicons name={artIcon} size={42} color={artIconColor} style={{ opacity: 0.35 }} />
      </View>
      <View style={[styles.moduleButton, { backgroundColor: buttonBg }]}>
        <Text style={styles.moduleButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={14} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { authReady, isAuthenticated, user } = useAuth();
  const { yardReady, isYardAuthenticated, user: yardUser } = useYardAuth();
  const bootMinElapsed = useMinBootDuration();

  const showBootLoader = !authReady || !yardReady || !bootMinElapsed;

  if (showBootLoader) {
    return (
      <View style={styles.loaderRoot}>
        <ShipgenLogoLoader size={96} />
        <Text style={styles.loaderText}>Loading Shipgen workspace…</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    const home = defaultMobileHome(user);
    if (home) return <Redirect href={home} />;
  }

  if (isYardAuthenticated && yardUser) {
    return <Redirect href={defaultYardHome(yardUser)} />;
  }

  const modules = visibleMobileModules(user, { isYardAuthenticated });
  const showDriver = modules.includes("driver");
  const showYard = modules.includes("yard");

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.hero}>
          <View style={styles.heroBrand}>
            <ShipgenBrand large centered />
            <Text style={styles.heroTaglineBold}>Unified logistics operations</Text>
            <Text style={styles.heroTagline}>for fleet drivers and yard teams.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.overlineRow}>
            <View style={styles.overlineBar} />
            <Text style={styles.overline}>SELECT MODULE</Text>
          </View>
          <Text style={styles.title}>Welcome to Shipgen</Text>
          <Text style={styles.copy}>
            Choose the operating module that matches your role. Fleetops handles driver operations; YMS controls gate,
            queue, and dock activity.
          </Text>

          <View style={[styles.moduleRow, !showDriver || !showYard ? styles.moduleRowSingle : null]}>
            {showDriver ? (
              <LandingModuleCard
                testID="module-driver"
                title="Fleetops"
                description="Assigned orders, live route tracking, proof of delivery, and fleet workflows."
                icon="speedometer"
                iconColor="#0051CC"
                iconBg="#D6E6FF"
                cardBg="#F3F7FF"
                cardBorder="#C5D9FF"
                artBg="#E3EEFF"
                artIcon="bus"
                artIconColor="#0066FF"
                buttonBg={colors.shipgenBlue}
                onPress={() => {
                  void setActiveModule("driver");
                  router.push("/login/driver");
                }}
              />
            ) : null}

            {showYard ? (
              <LandingModuleCard
                testID="module-yard"
                title="Yard Management System"
                description="Gate operations, virtual queue, dock orchestration, yard map, and loading control."
                icon="business"
                iconColor="#D85700"
                iconBg="#FFE5D2"
                cardBg="#FFF7EF"
                cardBorder="#FFD9BA"
                artBg="#FFECD9"
                artIcon="git-branch"
                artIconColor="#FF6600"
                buttonBg={colors.shipgenOrange}
                onPress={() => {
                  void setActiveModule("yard");
                  router.push("/login/yms");
                }}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Ionicons name="apps" size={18} color={colors.shipgenBlue} />
            <Text style={styles.activityTitle}>Platform capabilities</Text>
          </View>
          {LANDING_HIGHLIGHTS.map((item) => (
            <View key={item.label} style={styles.highlightRow}>
              <View style={[styles.highlightIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <View style={styles.highlightCopy}>
                <Text style={styles.highlightLabel}>{item.label}</Text>
                <Text style={styles.highlightText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <Ionicons name="shield-checkmark" size={14} color={colors.shipgenBlue} />
          <Text style={styles.footer}>Fleetops Mobile · Secure module access</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderRoot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  loaderText: { marginTop: spacing.lg, color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  root: { flex: 1, backgroundColor: "#F4F7FB" },
  content: { paddingBottom: spacing.xl },
  hero: {
    backgroundColor: "#FFFFFF",
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF4",
  },
  heroBrand: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  heroTaglineBold: {
    marginTop: spacing.md,
    fontSize: 15,
    fontWeight: "800",
    color: "#1E3A5F",
    textAlign: "center",
  },
  heroTagline: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  overlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overlineBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.shipgenBlue,
  },
  overline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.textMuted,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: "#0F2744",
    marginTop: 10,
  },
  copy: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  moduleRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  moduleRowSingle: {
    flexDirection: "column",
  },
  moduleCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 280,
    shadowColor: "#001133",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  moduleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
    color: "#0F2744",
    lineHeight: 19,
  },
  moduleBody: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  moduleArt: {
    height: 72,
    borderRadius: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  moduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
  },
  moduleButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  activityCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EBF4",
    padding: spacing.lg,
    shadowColor: "#001133",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F2744",
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  highlightIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightCopy: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F2744",
  },
  highlightText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  footer: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 11,
  },
});
