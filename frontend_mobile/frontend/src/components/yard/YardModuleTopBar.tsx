import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardMoreFlow } from "@/src/contexts/YardMoreFlowContext";
import { visibleYardModuleLinks, type YardModuleLink } from "@/src/lib/yardModules";
import {
  activeYardModuleKey,
  navigateYardModule,
  shouldShowYardModuleTopBar,
} from "@/src/lib/yardModuleNavigation";

const MORE_HUB_LINK: YardModuleLink = {
  key: "more",
  title: "More",
  description: "All yard modules",
  icon: "grid-outline",
  href: "/(yard)/more",
  section: "Control",
  modulePermission: null,
};

export default function YardModuleTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, can, isYardAdmin } = useYardAuth();
  const { inMoreFlow } = useYardMoreFlow();
  const [open, setOpen] = useState(false);

  const activeKey = activeYardModuleKey(pathname);
  const visible = shouldShowYardModuleTopBar(pathname, inMoreFlow);

  const modules = useMemo(() => {
    const links = visibleYardModuleLinks(can, isYardAdmin, user?.role, {
      excludeKeys: ["profile", "overview", "search", "alerts", "more"],
    });
    return [MORE_HUB_LINK, ...links];
  }, [can, isYardAdmin, user?.role]);

  const activeLink = useMemo(
    () => modules.find((link) => link.key === activeKey) ?? modules[1] ?? modules[0],
    [modules, activeKey],
  );

  const openModule = useCallback(
    (link: YardModuleLink) => {
      navigateYardModule(router, link, "more");
    },
    [router],
  );

  const select = useCallback(
    (link: YardModuleLink) => {
      setOpen(false);
      openModule(link);
    },
    [openModule],
  );

  if (!visible || !modules.length) return null;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        testID="yard-modules-trigger"
        style={styles.trigger}
        activeOpacity={0.75}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="menu" size={26} color={colors.text} />
        <View style={styles.triggerLabelWrap}>
          {activeLink ? (
            <Ionicons
              name={activeLink.icon as keyof typeof Ionicons.glyphMap}
              size={17}
              color={colors.brand}
            />
          ) : null}
          <Text style={styles.triggerLabel} numberOfLines={1}>
            {activeLink?.title ?? "Modules"}
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
              {modules.map((link) => {
                const isActive = link.key === activeKey;
                return (
                  <TouchableOpacity
                    key={link.key}
                    testID={`yard-module-item-${link.key}`}
                    style={[styles.item, isActive && styles.itemActive]}
                    activeOpacity={0.75}
                    onPress={() => select(link)}
                  >
                    <View style={[styles.itemIcon, isActive && styles.itemIconActive]}>
                      <Ionicons
                        name={link.icon as keyof typeof Ionicons.glyphMap}
                        size={17}
                        color={isActive ? "#fff" : colors.text}
                      />
                    </View>
                    <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                      {link.title}
                    </Text>
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
});
