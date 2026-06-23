import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { groupYardModuleLinks, visibleYardModuleLinks } from "@/src/lib/yardModules";
import { navigateYardModule } from "@/src/lib/yardModuleNavigation";
import { useYardMoreFlow } from "@/src/contexts/YardMoreFlowContext";

export default function YardMoreScreen() {
  const router = useRouter();
  const { startMoreFlow } = useYardMoreFlow();
  const { user, can, isYardAdmin } = useYardAuth();

  const allowed = canAccessYardScreen("more", can, isYardAdmin, user?.role);

  const links = visibleYardModuleLinks(can, isYardAdmin, user?.role, {
    excludeKeys: ["search", "profile", "more", "overview", "alerts"],
  });
  const grouped = groupYardModuleLinks(links);

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.overline}>YARD · MODULES</Text>
        <Text style={styles.title}>Module hub</Text>
        <Text style={styles.subtitle}>
          Open a module below to work inside it. A module bar appears at the top so you can switch between More modules and return here when you exit.
        </Text>

        {Object.entries(grouped).map(([section, sectionLinks]) => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section}</Text>
            {sectionLinks.map((link) => (
              <TouchableOpacity
                key={link.key}
                style={styles.linkCard}
                onPress={() => {
                  startMoreFlow();
                  navigateYardModule(router, link, "more");
                }}
                testID={`yard-more-link-${link.key}`}
              >
                <View style={styles.linkIcon}>
                  <Ionicons name={link.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.shipgenOrange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.linkBody}>{link.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.lg, lineHeight: 19 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1, marginBottom: spacing.sm },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: `${colors.shipgenOrange}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  linkBody: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
});
