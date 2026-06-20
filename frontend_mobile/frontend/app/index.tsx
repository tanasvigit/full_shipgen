import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { colors, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import ShipgenBrand from "@/src/components/shipgen/ShipgenBrand";
import ModulePickerCard from "@/src/components/shipgen/ModulePickerCard";
import { setActiveModule } from "@/src/lib/appModule";
import { defaultMobileHome, visibleMobileModules } from "@/src/lib/moduleAccess";

export default function LandingScreen() {
  const router = useRouter();
  const { authReady, isAuthenticated, user } = useAuth();
  const { yardReady, isYardAuthenticated } = useYardAuth();

  if (!authReady || !yardReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.shipgenBlue} />
      </View>
    );
  }

  if (isAuthenticated) {
    const home = defaultMobileHome(user);
    if (home) return <Redirect href={home} />;
  }

  if (isYardAuthenticated) {
    return <Redirect href="/(yard)/gate" />;
  }

  const modules = visibleMobileModules(user, { isYardAuthenticated });

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ShipgenBrand subtitle="Logistics operating system for drivers and yard teams." />
      </View>

      <View style={styles.section}>
        <Text style={styles.overline}>SELECT MODULE</Text>
        <Text style={styles.title}>Choose your workspace</Text>
        <Text style={styles.copy}>
          Sign in to the module that matches your role. Driver accounts use Shipgen credentials; yard teams use YMS
          operator accounts.
        </Text>

        {modules.includes("driver") ? (
        <ModulePickerCard
          testID="module-driver"
          title="Driver App"
          description="Assigned orders, live tracking, proof of delivery, and fleet workflows."
          icon="car-sport"
          accent={colors.shipgenBlue}
          onPress={() => {
            void setActiveModule("driver");
            router.push("/login/driver");
          }}
        />
        ) : null}

        {modules.includes("yard") ? (
        <ModulePickerCard
          testID="module-yard"
          title="Yard Management (YMS)"
          description="Gate entry and exit, virtual queue, dock coordination, and yard operations."
          icon="business"
          accent={colors.shipgenOrange}
          onPress={() => {
            void setActiveModule("yard");
            router.push("/login/yms");
          }}
        />
        ) : null}
      </View>

      <Text style={styles.footer}>Shipgen Mobile · Secure module access</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl },
  header: { paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  section: { flex: 1 },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5, color: colors.text, marginTop: 8 },
  copy: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 8, marginBottom: spacing.xl },
  footer: { textAlign: "center", color: colors.textMuted, fontSize: 11, paddingVertical: spacing.lg },
});
