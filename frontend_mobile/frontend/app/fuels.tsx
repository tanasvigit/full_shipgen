import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/ScreenHeader";
import FleetFuelPanel from "@/src/components/fleet/panels/FleetFuelPanel";
import { colors } from "@/src/theme";

export default function FuelReportsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Fuel reports" back />
      <View style={styles.body}>
        <FleetFuelPanel />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
