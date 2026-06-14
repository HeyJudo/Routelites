import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";

import { AppLaunchSplash } from "../components/AppLaunchSplash";
import { ActiveDeliveryScreen } from "../screens/ActiveDeliveryScreen";
import { LoadingScreen } from "../screens/LoadingScreen";
import { OnboardingStopsScreen } from "../screens/OnboardingStopsScreen";
import { PersonalizeProfileScreen } from "../screens/PersonalizeProfileScreen";
import { PersonalizeRiderScreen } from "../screens/PersonalizeRiderScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { SetStoreScreen } from "../screens/SetStoreScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { useAuthStore } from "../state/authStore";
import { useDeliveryRunStore } from "../state/deliveryRunStore";
import { useProfileStore } from "../state/profileStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors } from "../theme";
import { MainTabs } from "./MainTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Minimum time (ms) to show AppLaunchSplash so the animation always plays. */
const MIN_SPLASH_MS = 1200;

/**
 * Root navigator. Shows AppLaunchSplash during hydration (enforcing a minimum
 * ~1.2 s display time), then gates on auth + profile to pick the initial route.
 */
export function AppNavigator() {
  const draftHydrated = useRouteDraftStore((s) => s.hasHydrated);
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);

  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const session = useAuthStore((s) => s.session);
  const isGuest = useAuthStore((s) => s.isGuest);

  const profileHasLoaded = useProfileStore((s) => s.hasLoaded);
  const profileIsOnboarded = useProfileStore((s) => s.isOnboarded);

  // Minimum splash display timer
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    useAuthStore.getState().initialize();
    useDeliveryRunStore.getState().hydrateActiveRun();

    timerRef.current = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isAuthed = Boolean(session) || isGuest;

  // Show splash until everything is ready AND the minimum time has elapsed
  const stillLoading =
    !authHydrated ||
    !draftHydrated ||
    (isAuthed && !isGuest && !profileHasLoaded) ||
    !minTimeElapsed;

  if (stillLoading) {
    return <AppLaunchSplash />;
  }

  // Guests have no profile, so fall back to device-local storeLocation.
  // Authenticated users rely solely on their account profile — device-local
  // storeLocation persists across accounts on the same device, so using it
  // here would wrongly skip onboarding for a freshly created account.
  const isOnboarded = isGuest
    ? Boolean(storeLocation)
    : profileIsOnboarded();

  const initialRoute: keyof RootStackParamList = isOnboarded ? "MainTabs" : "Splash";

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
        key={!isAuthed ? "auth" : isOnboarded ? "main" : "onboarding"}
        initialRouteName={isAuthed ? initialRoute : "Auth"}
        screenOptions={{
          animation: "fade",
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      >
        {!isAuthed ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="PersonalizeProfile" component={PersonalizeProfileScreen} />
            <Stack.Screen name="PersonalizeRider" component={PersonalizeRiderScreen} />
            <Stack.Screen name="SetStore" component={SetStoreScreen} />
            <Stack.Screen name="OnboardingStops" component={OnboardingStopsScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="Loading"
              component={LoadingScreen}
              options={{ animation: "fade_from_bottom", presentation: "modal" }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="ActiveDelivery"
              component={ActiveDeliveryScreen}
              options={{ animation: "slide_from_bottom" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
