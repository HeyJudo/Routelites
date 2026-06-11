import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlaskConical, Info, PlugZap, Store, UserCircle } from "lucide-react-native";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import type { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../state/authStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing } from "../theme";

/**
 * Render the Settings screen containing controls for store location, connection status, demo actions, and app reset.
 *
 * The screen displays the current store (or "No store set.") and lets the user navigate to the SetStore screen, load a demo route, clear the current route draft, or reset the app. Clearing the draft and resetting the app prompt for confirmation; resetting clears stops and store location and navigates to the Splash screen.
 *
 * @returns The JSX element for the Settings screen
 */
export function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);
  const clearStops = useRouteDraftStore((s) => s.clearStops);
  const clearStoreLocation = useRouteDraftStore((s) => s.clearStoreLocation);
  const loadDemoRoute = useRouteDraftStore((s) => s.loadDemoRoute);

  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const signOut = useAuthStore((s) => s.signOut);

  const handleClearDraft = () => {
    Alert.alert("Clear stops", "Remove all stops?", [
      { style: "cancel", text: "Cancel" },
      { onPress: clearStops, text: "Clear" },
    ]);
  };

  const handleReset = () => {
    Alert.alert("Reset app", "Clear store and all stops?", [
      { style: "cancel", text: "Cancel" },
      {
        onPress: () => {
          clearStops();
          clearStoreLocation();
          navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
        },
        style: "destructive",
        text: "Reset",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader showMenu />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Manage routing preferences and system status.
        </Text>
        <SettingsCard
          icon={<Store color={colors.primaryDark} size={22} />}
          title="Store Location"
        >
          <Text style={styles.bodyText}>
            {storeLocation
              ? `${storeLocation.label} — ${storeLocation.address}`
              : "No store set."}
          </Text>
          <PrimaryButton
            onPress={() => navigation.navigate("SetStore")}
            variant="secondary"
          >
            Change store location
          </PrimaryButton>
        </SettingsCard>
        <SettingsCard
          icon={<PlugZap color={colors.primaryDark} size={22} />}
          title="Connection"
        >
          <Text style={styles.bodyText}>Backend routing engine is online.</Text>
          <PrimaryButton>Test backend status</PrimaryButton>
        </SettingsCard>
        <SettingsCard
          icon={<FlaskConical color={colors.primaryDark} size={22} />}
          title="Demo & Development"
        >
          <PrimaryButton onPress={loadDemoRoute} variant="secondary">
            Load demo route
          </PrimaryButton>
          <PrimaryButton onPress={handleClearDraft} variant="danger">
            Clear stops
          </PrimaryButton>
          <PrimaryButton onPress={handleReset} variant="danger">
            Reset app
          </PrimaryButton>
        </SettingsCard>
        <SettingsCard
          icon={<UserCircle color={colors.primaryDark} size={22} />}
          title="Account"
        >
          {isGuest ? (
            <>
              <Text style={styles.bodyText}>
                You're using RouteLite as a guest. Sign up to sync your routes across devices.
              </Text>
              <PrimaryButton onPress={() => signOut()} variant="secondary">
                Sign up to sync
              </PrimaryButton>
            </>
          ) : (
            <>
              <Text style={styles.bodyText}>{user?.email ?? ""}</Text>
              <PrimaryButton onPress={() => signOut()} variant="danger">
                Sign out
              </PrimaryButton>
            </>
          )}
        </SettingsCard>
        <SettingsCard
          icon={<Info color={colors.muted} size={22} />}
          title="About"
        >
          <Text style={styles.bodyText}>
            RouteLite uses Dijkstra + Branch and Bound for route optimization.
          </Text>
        </SettingsCard>
      </ScrollView>
    </View>
  );
}

type SettingsCardProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
};

function SettingsCard({ children, icon, title }: SettingsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.lg,
    padding: 20,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: 20,
    paddingBottom: 120,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: -8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
});
