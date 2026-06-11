import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Map, Route, Settings } from "lucide-react-native";

import { PlannerScreen } from "../screens/PlannerScreen";
import { SavedRoutesScreen } from "../screens/SavedRoutesScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors } from "../theme";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Planner"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.card,
        tabBarInactiveTintColor: colors.text,
        tabBarItemStyle: {
          borderRadius: 999,
          marginVertical: 8,
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 74,
          paddingBottom: 10,
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
