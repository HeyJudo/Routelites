import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import { LogoMark } from "../components/LogoMark";
import { LoadingScreen } from "../screens/LoadingScreen";
import { OnboardingStopsScreen } from "../screens/OnboardingStopsScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { SetStoreScreen } from "../screens/SetStoreScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors } from "../theme";
import { MainTabs } from "./MainTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator for the app that gates rendering until route state is hydrated and then mounts the navigation stack.
 *
 * While the persisted route draft store is initializing, renders a compact brand view. After hydration, selects the initial stack route — `"MainTabs"` when a store location exists, otherwise `"Splash"` — and configures the app's NavigationContainer and stack screens.
 *
 * @returns The top-level React element containing the configured NavigationContainer and stack navigator
 */
export function AppNavigator() {
  const hasHydrated = useRouteDraftStore((s) => s.hasHydrated);
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);

  if (!hasHydrated) {
    return (
      <View style={hydrationStyles.container}>
        <LogoMark size="lg" />
      </View>
    );
  }

  const initialRoute: keyof RootStackParamList = storeLocation
    ? "MainTabs"
    : "Splash";

  return (
    <NavigationContainer
      theme={{
        colors: {
          background: colors.background,
          border: colors.border,
          card: colors.background,
          notification: colors.primary,
          primary: colors.primary,
          text: colors.text,
        },
        dark: false,
        fonts: {
          bold: { fontFamily: "System", fontWeight: "700" },
          heavy: { fontFamily: "System", fontWeight: "800" },
          medium: { fontFamily: "System", fontWeight: "500" },
          regular: { fontFamily: "System", fontWeight: "400" },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          animation: "fade",
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SetStore" component={SetStoreScreen} />
        <Stack.Screen name="OnboardingStops" component={OnboardingStopsScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const hydrationStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: 16,
    justifyContent: "center",
  },
});
