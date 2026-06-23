import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardMoreFlow } from "@/src/contexts/YardMoreFlowContext";
import { visibleYardModuleLinks, type YardModuleLink } from "@/src/lib/yardModules";
import {
  activeYardModuleKey,
  navigateYardModule,
  returnToMoreHub,
  shouldReturnToMoreHub,
  shouldShowYardModuleTopBar,
  yardModuleShortLabel,
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

  const activeKey = activeYardModuleKey(pathname);
  const visible = shouldShowYardModuleTopBar(pathname, inMoreFlow);
  const showMoreBack = shouldReturnToMoreHub(pathname, inMoreFlow);

  const modules = useMemo(() => {
    const links = visibleYardModuleLinks(can, isYardAdmin, user?.role, {
      excludeKeys: ["profile", "overview", "search", "alerts", "more"],
    });
    return [MORE_HUB_LINK, ...links];
  }, [can, isYardAdmin, user?.role]);

  const openModule = useCallback(
    (link: YardModuleLink) => {
      navigateYardModule(router, link, "more");
    },
    [router],
  );

  if (!visible || !modules.length) return null;

  return (
    <View style={styles.root}>
      {showMoreBack ? (
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => returnToMoreHub(router)}
          testID="yard-module-back-more"
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={18} color={colors.shipgenOrange} />
          <Text style={styles.backText}>Modules</Text>
        </TouchableOpacity>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        keyboardShouldPersistTaps="handled"
      >
        {modules.map((link) => {
          const active = link.key === activeKey;
          const label = yardModuleShortLabel(link.key, link.title);
          return (
            <TouchableOpacity
              key={link.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => openModule(link)}
              testID={`yard-module-chip-${link.key}`}
              activeOpacity={0.75}
            >
              <Ionicons
                name={link.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={active ? colors.shipgenOrange : colors.textMuted}
              />
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  backText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.shipgenOrange,
  },
  strip: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    maxWidth: 132,
  },
  chipActive: {
    borderColor: colors.shipgenOrange,
    backgroundColor: `${colors.shipgenOrange}14`,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    flexShrink: 1,
  },
  chipLabelActive: {
    color: colors.shipgenOrange,
  },
});
