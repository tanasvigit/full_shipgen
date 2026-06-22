import { ActivityIndicator, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { YardVehicle360Provider } from "@/src/contexts/YardVehicle360Context";
import { canAccessYardTab } from "@/src/lib/moduleAccess";
import { useYardAlerts } from "@/src/hooks/useYardAlerts";
import { alertBadgeCount } from "@/src/services/alertsService";

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; default: keyof typeof Ionicons.glyphMap }> = {
  overview: { focused: "pulse", default: "pulse-outline" },
  ops: { focused: "grid", default: "grid-outline" },
  gate: { focused: "shield-checkmark", default: "shield-checkmark-outline" },
  appointments: { focused: "calendar", default: "calendar-outline" },
  queue: { focused: "list", default: "list-outline" },
  docks: { focused: "git-branch", default: "git-branch-outline" },
  search: { focused: "search", default: "search-outline" },
  alerts: { focused: "notifications", default: "notifications-outline" },
  more: { focused: "menu", default: "menu-outline" },
  profile: { focused: "person", default: "person-outline" },
};

function YardTabs() {
  const { isYardAuthenticated, user, can, isYardAdmin } = useYardAuth();
  const role = user?.role;
  const { data: alertsData } = useYardAlerts();
  const alertCount = canAccessYardTab("alerts", can, isYardAdmin, role) ? alertBadgeCount(alertsData) : 0;

  const tabVisible = (tabName: string) => canAccessYardTab(tabName, can, isYardAdmin, role);

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
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.profile;
          return <Ionicons name={focused ? icons.focused : icons.default} size={20} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="overview"
        options={{ title: "Overview", href: tabVisible("overview") ? undefined : null }}
      />
      <Tabs.Screen name="ops" options={{ title: "Ops", href: tabVisible("ops") ? undefined : null }} />
      <Tabs.Screen name="gate" options={{ title: "Gate", href: tabVisible("gate") ? undefined : null }} />
      <Tabs.Screen
        name="appointments"
        options={{ title: "Appts", href: tabVisible("appointments") ? undefined : null }}
      />
      <Tabs.Screen name="queue" options={{ title: "Queue", href: tabVisible("queue") ? undefined : null }} />
      <Tabs.Screen name="docks" options={{ title: "Docks", href: tabVisible("docks") ? undefined : null }} />
      <Tabs.Screen name="search" options={{ title: "Search", href: tabVisible("search") ? undefined : null }} />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          href: tabVisible("alerts") ? undefined : null,
          tabBarBadge: alertCount > 0 ? (alertCount > 99 ? "99+" : alertCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="more" options={{ title: "More", href: tabVisible("more") ? undefined : null }} />
      <Tabs.Screen name="detention" options={{ href: null }} />
      <Tabs.Screen name="vehicles" options={{ href: null }} />
      <Tabs.Screen name="yard-map" options={{ href: null }} />
      <Tabs.Screen name="loading-ops" options={{ href: null }} />
      <Tabs.Screen name="labor" options={{ href: null }} />
      <Tabs.Screen name="equipment" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

export default function YardTabLayout() {
  const { yardReady, isYardAuthenticated } = useYardAuth();

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
    <YardVehicle360Provider>
      <YardTabs />
    </YardVehicle360Provider>
  );
}
