import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { showFleetTab } from "@/src/lib/fleetAccess";
import SwipeTabsHost from "@/src/components/navigation/SwipeTabsHost";

export default function TabLayout() {
  const { authReady, isAuthenticated, user, canFleetops } = useAuth();
  const fleetTabVisible = showFleetTab(user, canFleetops);
  const swipeTabs = [
    "dashboard",
    "orders",
    "tracking",
    ...(fleetTabVisible ? ["fleet"] : []),
    "profile",
  ];

  if (!authReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <SwipeTabsHost group="(tabs)" routes={swipeTabs}>
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: "shift",
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
          ...shadow.lg,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
        tabBarIcon: ({ color, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            dashboard: focused ? "grid" : "grid-outline",
            orders: focused ? "cube" : "cube-outline",
            tracking: focused ? "navigate" : "navigate-outline",
            fleet: focused ? "car-sport" : "car-sport-outline",
            profile: focused ? "person" : "person-outline",
          };
          return <Ionicons name={map[route.name] ?? "ellipse"} size={20} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="tracking" options={{ title: "Tracking" }} />
      <Tabs.Screen
        name="fleet"
        options={{ title: "Fleet", href: fleetTabVisible ? undefined : null }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
    </SwipeTabsHost>
  );
}
