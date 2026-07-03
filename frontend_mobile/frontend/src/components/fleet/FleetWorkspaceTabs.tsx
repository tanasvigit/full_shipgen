import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { useFleetData } from "@/src/hooks/useFleetData";
import { useFleetModuleStats } from "@/src/hooks/useFleetModuleStats";
import {
  visibleFleetWorkspaceTabs,
  type FleetWorkspaceTab,
} from "@/src/lib/fleetModules";

type Props = {
  active: FleetWorkspaceTab;
  onChange: (tab: FleetWorkspaceTab) => void;
};

function badgeColor(tone?: "error" | "warning" | "info") {
  if (tone === "error") return colors.error;
  if (tone === "warning") return colors.warning;
  return colors.info;
}

export default function FleetWorkspaceTabs({ active, onChange }: Props) {
  const { canFleetops } = useAuth();
  const { vehicles, drivers, routes, places, issues, fuelLogs } = useFleetData();
  const { byModule } = useFleetModuleStats({ vehicles, drivers, routes, places, issues, fuelLogs });
  const tabs = visibleFleetWorkspaceTabs(canFleetops);
  const [open, setOpen] = useState(false);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === active) ?? tabs[0],
    [tabs, active],
  );

  const select = (tab: FleetWorkspaceTab) => {
    setOpen(false);
    onChange(tab);
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        testID="fleet-modules-trigger"
        style={styles.trigger}
        activeOpacity={0.75}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="menu" size={26} color={colors.text} />
        <View style={styles.triggerLabelWrap}>
          {activeTab ? (
            <Ionicons name={activeTab.icon} size={17} color={colors.brand} />
          ) : null}
          <Text style={styles.triggerLabel} numberOfLines={1}>
            {activeTab?.label ?? "Modules"}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Modules</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.list} bounces={false}>
              {tabs.map((tab) => {
                const isActive = tab.id === active;
                const stat = tab.id === "overview" ? null : byModule[tab.id];
                return (
                  <TouchableOpacity
                    key={tab.id}
                    testID={`fleet-tab-${tab.id}`}
                    style={[styles.item, isActive && styles.itemActive]}
                    activeOpacity={0.75}
                    onPress={() => select(tab.id)}
                  >
                    <View style={[styles.itemIcon, isActive && styles.itemIconActive]}>
                      <Ionicons
                        name={tab.icon}
                        size={17}
                        color={isActive ? "#fff" : colors.text}
                      />
                    </View>
                    <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                      {tab.label}
                    </Text>
                    {stat && stat.count > 0 ? (
                      <Text style={styles.itemCount}>{stat.count}</Text>
                    ) : null}
                    {stat?.badge ? (
                      <View style={[styles.badge, { backgroundColor: badgeColor(stat.badgeTone) }]}>
                        <Text style={styles.badgeText}>{stat.badge}</Text>
                      </View>
                    ) : null}
                    {isActive ? (
                      <Ionicons name="checkmark" size={18} color={colors.brand} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  triggerLabelWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  triggerLabel: { fontSize: 16, fontWeight: "800", color: colors.text },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: "70%",
    overflow: "hidden",
    ...shadow.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 1, color: colors.textMuted },
  list: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  itemActive: { backgroundColor: colors.brandSoft },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemIconActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  itemLabelActive: { color: colors.brand },
  itemCount: { fontSize: 12, fontWeight: "800", color: colors.textMuted },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
