import { ActivityIndicator, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardTab } from "@/src/lib/moduleAccess";

export default function YardTabLayout() {
  const { yardReady, isYardAuthenticated, can, isYardAdmin } = useYardAuth();

  if (!yardReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.shipgenOrange} />
      </View>
    );
  }

  if (!isYardAuthenticated) {
    return <Redirect href="/login/yms" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.shipgenOrange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
        tabBarIcon: ({ color, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            gate: focused ? "shield-checkmark" : "shield-checkmark-outline",
            queue: focused ? "list" : "list-outline",
            profile: focused ? "person" : "person-outline",
          };
          return <Ionicons name={map[route.name] ?? "ellipse"} size={20} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="gate"
        options={{ title: "Gate", href: canAccessYardTab("gate", can, isYardAdmin) ? undefined : null }}
      />
      <Tabs.Screen
        name="queue"
        options={{ title: "Queue", href: canAccessYardTab("queue", can, isYardAdmin) ? undefined : null }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
