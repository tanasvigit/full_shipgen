import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/ScreenHeader";
import FleetIssuesPanel from "@/src/components/fleet/panels/FleetIssuesPanel";
import { colors } from "@/src/theme";

export default function IssuesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Issues" back />
      <View style={styles.body}>
        <FleetIssuesPanel />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
