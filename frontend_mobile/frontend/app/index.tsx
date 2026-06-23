import { View, Text, StyleSheet } from "react-native";
import { useMinBootDuration } from "@/src/hooks/useMinBootDuration";
import { Redirect } from "expo-router";
import { colors, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import ShipgenLogoLoader from "@/src/components/shipgen/ShipgenLogoLoader";
import { defaultMobileHome, defaultYardHome } from "@/src/lib/moduleAccess";

export default function IndexScreen() {
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

  if (isYardAuthenticated && yardUser) {
    return <Redirect href={defaultYardHome(yardUser)} />;
  }

  if (isAuthenticated) {
    const home = defaultMobileHome(user);
    return <Redirect href={home ?? "/(tabs)/dashboard"} />;
  }

  return <Redirect href="/login" />;

  /*
  LANDING PAGE — temporarily disabled (unified login at /login)

  import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { useRouter } from "expo-router";
  import { Ionicons } from "@expo/vector-icons";
  import ShipgenBrand from "@/src/components/shipgen/ShipgenBrand";
  import { setActiveModule } from "@/src/lib/appModule";
  import { visibleMobileModules } from "@/src/lib/moduleAccess";
  ...
  */
}

const styles = StyleSheet.create({
  loaderRoot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  loaderText: { marginTop: spacing.lg, color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
});
