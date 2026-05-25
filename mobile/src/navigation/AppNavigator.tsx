import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { LogoMark } from "../components/LogoMark";
import { LoadingScreen } from "../screens/LoadingScreen";
import { SetStoreScreen } from "../screens/SetStoreScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors } from "../theme";
import { MainTabs } from "./MainTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const hasHydrated = useRouteDraftStore((s) => s.hasHydrated);
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);

  if (!hasHydrated) {
    return (
      <View style={hydrationStyles.container}>
        <LogoMark size="lg" />
        <Text style={hydrationStyles.text}>RouteLite</Text>
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
          bold: {
            fontFamily: "System",
            fontWeight: "700",
          },
          heavy: {
            fontFamily: "System",
            fontWeight: "800",
          },
          medium: {
            fontFamily: "System",
            fontWeight: "500",
          },
          regular: {
            fontFamily: "System",
            fontWeight: "400",
          },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          animation: "fade",
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SetStore" component={SetStoreScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ presentation: "modal" }}
        />
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
  text: { color: colors.text, fontSize: 28, fontWeight: "800" },
});
