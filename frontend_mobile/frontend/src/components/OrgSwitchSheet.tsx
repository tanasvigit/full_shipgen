import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import type { MobileOrganization } from "@/src/services/authService";

type Props = {
  visible: boolean;
  organizations: MobileOrganization[];
  activeOrganization: MobileOrganization | null;
  onClose: () => void;
  onSelect: (organizationId: string) => Promise<void>;
};

export default function OrgSwitchSheet({
  visible,
  organizations,
  activeOrganization,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Switch organization</Text>
          <FlatList
            data={organizations}
            keyExtractor={(item) => item.uuid || item.id}
            renderItem={({ item }) => {
              const active = (activeOrganization?.uuid || activeOrganization?.id) === (item.uuid || item.id);
              return (
                <TouchableOpacity
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    void onSelect(item.uuid || item.id).then(onClose);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowMeta}>{item.role}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: "70%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginVertical: spacing.md,
  },
  title: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowActive: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: spacing.sm },
  rowTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
