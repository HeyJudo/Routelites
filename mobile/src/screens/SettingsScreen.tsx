import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Info,
  PlugZap,
  Store,
  UserCircle,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppHeader } from "../components/AppHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { ResumeRunBanner } from "../components/ResumeRunBanner";
import type { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../state/authStore";
import { useProfileStore } from "../state/profileStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing, type } from "../theme";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type HealthStatus = "unknown" | "checking" | "online" | "offline";

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
  const setPostSignOutScreen = useAuthStore((s) => s.setPostSignOutScreen);
  const profile = useProfileStore((s) => s.profile);

  // ── Health check ──────────────────────────────────────────────────────────
  const [health, setHealth] = useState<HealthStatus>("unknown");
  const abortRef = useRef<AbortController | null>(null);

  const checkHealth = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setHealth("checking");
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      setHealth(res.ok ? "online" : "offline");
    } catch {
      clearTimeout(timer);
      setHealth("offline");
    }
  };

  useEffect(() => {
    checkHealth();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const healthDotColor =
    health === "online"
      ? colors.delivered
      : health === "offline"
        ? colors.danger
        : colors.muted;

  const healthLabel =
    health === "online"
      ? "Backend online"
      : health === "offline"
        ? "Backend unreachable"
        : "Checking…";

  // ── Developer section ─────────────────────────────────────────────────────
  const [devOpen, setDevOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────
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

  const handleGuestUpsell = async () => {
    setPostSignOutScreen("SignUp");
    await signOut();
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ResumeRunBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Account card */}
        <SettingsCard
          icon={<UserCircle color={colors.primaryDark} size={22} />}
          title="Account"
        >
          {isGuest ? (
            <>
              <View style={styles.guestRow}>
                <View style={styles.guestPill}>
                  <Text style={styles.guestPillText}>Guest mode</Text>
                </View>
              </View>
              <Text style={styles.bodyText}>
                Your routes live on this device only.
              </Text>
              <PrimaryButton size="sm" onPress={handleGuestUpsell}>
                Create free account
              </PrimaryButton>
            </>
          ) : (
            <>
              {profile?.displayName ? (
                <Text style={styles.profileName}>{profile.displayName}</Text>
              ) : null}
              <Text style={styles.bodyText}>{user?.email ?? ""}</Text>
              {profile?.vehicleType ? (
                <View style={styles.vehiclePill}>
                  <Text style={styles.vehiclePillText}>
                    {profile.vehicleType.charAt(0).toUpperCase() + profile.vehicleType.slice(1)}
                  </Text>
                </View>
              ) : null}
              <PrimaryButton
                size="sm"
                variant="danger"
                onPress={() => signOut()}
              >
                Sign out
              </PrimaryButton>
            </>
          )}
        </SettingsCard>

        {/* Store Location card */}
        <SettingsCard
          icon={<Store color={colors.primaryDark} size={22} />}
          title={profile?.storeName ? profile.storeName : "Store Location"}
        >
          <Text style={styles.bodyText}>
            {storeLocation
              ? `${storeLocation.label} — ${storeLocation.address}`
              : "No store set."}
          </Text>
          <PrimaryButton
            size="sm"
            variant="outline"
            onPress={() => navigation.navigate("SetStore")}
          >
            Change store location
          </PrimaryButton>
        </SettingsCard>

        {/* Connection card */}
        <SettingsCard
          icon={<PlugZap color={colors.primaryDark} size={22} />}
          title="Connection"
        >
          <View style={styles.healthRow}>
            <View style={[styles.healthDot, { backgroundColor: healthDotColor }]} />
            <Text style={styles.bodyText}>{healthLabel}</Text>
          </View>
          <PrimaryButton
            size="sm"
            variant="outline"
            loading={health === "checking"}
            onPress={checkHealth}
          >
            Check again
          </PrimaryButton>
        </SettingsCard>

        {/* About card */}
        <SettingsCard
          icon={<Info color={colors.muted} size={22} />}
          title="About"
        >
          <Text style={styles.bodyText}>
            RouteLite uses Dijkstra + Branch and Bound for route optimization.
          </Text>
        </SettingsCard>

        {/* Developer disclosure */}
        <View style={styles.devSection}>
          <Pressable
            style={styles.devToggleRow}
            onPress={() => setDevOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Toggle developer section"
          >
            <FlaskConical color={colors.muted} size={16} />
            <Text style={styles.devToggleLabel}>Developer</Text>
            {devOpen ? (
              <ChevronUp color={colors.muted} size={16} />
            ) : (
              <ChevronDown color={colors.muted} size={16} />
            )}
          </Pressable>

          {devOpen && (
            <Animated.View entering={FadeInDown} style={styles.devContent}>
              <PrimaryButton size="sm" variant="secondary" onPress={loadDemoRoute}>
                Load demo route
              </PrimaryButton>
              <PrimaryButton size="sm" variant="danger" onPress={handleClearDraft}>
                Clear stops
              </PrimaryButton>
              <PrimaryButton size="sm" variant="danger" onPress={handleReset}>
                Reset app
              </PrimaryButton>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SettingsCard
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  bodyText: {
    ...type.body,
    color: colors.muted,
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
    ...type.heading,
    color: colors.text,
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
  devContent: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  devSection: {
    gap: 0,
  },
  devToggleLabel: {
    ...type.label,
    color: colors.muted,
    flex: 1,
  },
  devToggleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  guestPill: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  guestPillText: {
    ...type.caption,
    color: colors.muted,
  },
  guestRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  profileName: {
    ...type.heading,
    color: colors.text,
  },
  vehiclePill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  vehiclePillText: {
    ...type.caption,
    color: colors.primaryDark,
  },
  healthDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  healthRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  title: {
    ...type.display,
    color: colors.text,
  },
});
