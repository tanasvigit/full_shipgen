import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { colors, radius, spacing } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import { useFleetData } from "@/src/hooks/useFleetData";

const iconForType: Record<string, keyof typeof Ionicons.glyphMap> = {
  order: "cube-outline",
  driver: "person-outline",
  vehicle: "car-sport-outline",
  system: "information-circle-outline",
};

export default function Notifications() {
  const { notifications } = useFleetData();
  const [list, setList] = useState(notifications);

  useEffect(() => {
    setList(notifications);
  }, [notifications]);
  const unread = list.filter((n) => !n.read).length;

  const markAll = () => setList(list.map((n) => ({ ...n, read: true })));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Notifications" subtitle={`${unread} unread`} back />
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={markAll} testID="mark-all-read" style={styles.markBtn}>
          <Ionicons name="checkmark-done" size={14} color={colors.text} />
          <Text style={styles.markText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.read && styles.rowUnread]}>
            <View style={[styles.iconBox, !item.read && styles.iconBoxUnread]}>
              <Ionicons name={iconForType[item.type]} size={16} color={!item.read ? "#fff" : colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                <Text style={[styles.title, !item.read && { fontWeight: "900" }]}>{item.title}</Text>
                {!item.read ? <View style={styles.unreadDot} /> : null}
              </View>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  toolbar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: "row", justifyContent: "flex-end" },
  markBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surface, gap: 6 },
  markText: { fontSize: 11, fontWeight: "700", color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  rowUnread: { borderColor: colors.text },
  iconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  iconBoxUnread: { backgroundColor: colors.text },
  headerRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 13, fontWeight: "700", color: colors.text, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginLeft: 6 },
  body: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4, fontWeight: "600" },
});
