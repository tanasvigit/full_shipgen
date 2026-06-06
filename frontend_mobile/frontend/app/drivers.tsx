import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import EntityImage from "@/src/components/EntityImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { useFleetData } from "@/src/hooks/useFleetData";

export default function DriversList() {
  const router = useRouter();
  const { drivers } = useFleetData();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Drivers" subtitle={`${drivers.length} total`} back rightIcon="add" />
      <FlatList
        data={drivers}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`driver-row-${item.id}`}
            style={styles.row}
            onPress={() => router.push(`/driver/${item.id}`)}
          >
            <View>
              <EntityImage uri={item.avatar} label={item.name} style={styles.avatar} rounded />
              <View style={[
                styles.dot,
                { backgroundColor: item.status === "online" ? colors.success : item.status === "idle" ? colors.warning : colors.offline },
              ]} />
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.currentLocation}</Text>
              <View style={styles.meta}>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={11} color={colors.warning} />
                  <Text style={styles.metaText}>{item.rating}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="repeat-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.trips} trips</Text>
                </View>
              </View>
            </View>
            <StatusBadge status={item.status} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt },
  dot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.surface },
  body: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 14, fontWeight: "800", color: colors.text },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: "row", gap: spacing.md, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 10, color: colors.textSecondary, marginLeft: 3, fontWeight: "600" },
});
