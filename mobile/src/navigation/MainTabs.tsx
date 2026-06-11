import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Map, Route, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlannerScreen } from "../screens/PlannerScreen";
import { SavedRoutesScreen } from "../screens/SavedRoutesScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors, font } from "../theme";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Planner"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.textOnPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarItemStyle: {
          borderRadius: 999,
          marginVertical: 8,
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontFamily: font.semibold,
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: 22,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconSize = focused ? size + 1 : size;

          if (route.name === "Planner") {
            return <Map color={color} size={iconSize} />;
          }

          if (route.name === "MyRoutes") {
            return <Route color={color} size={iconSize} />;
          }

          return <Settings color={color} size={iconSize} />;
        },
        tabBarActiveBackgroundColor: colors.primary,
      })}
    >
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen
        name="MyRoutes"
        component={SavedRoutesScreen}
        options={{ tabBarLabel: "My Routes" }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
