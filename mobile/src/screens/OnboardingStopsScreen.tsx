import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MapPin, Route } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FadeSlideView } from "../components/FadeSlideView";
import { OnboardingHeader } from "../components/OnboardingHeader";
import { OnboardingIllustration } from "../components/OnboardingIllustration";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuthStore } from "../state/authStore";
import { useProfileStore } from "../state/profileStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type OnboardingStopsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "OnboardingStops"
>;

/**
 * Step 3 of onboarding: Quick tutorial on adding stops.
 * Shows progress bar at 100%, explains how to add stops, offers demo route.
 */
export function OnboardingStopsScreen({ navigation }: OnboardingStopsScreenProps) {
  const loadDemoRoute = useRouteDraftStore((s) => s.loadDemoRoute);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const isGuest = useAuthStore((s) => s.isGuest);

  const finishOnboarding = () => {
    if (!isGuest) {
      updateProfile({ onboarded_at: new Date().toISOString() }).catch(() => {});
    }
  };

  const handleStartPlanning = () => {
    finishOnboarding();
    navigation.replace("MainTabs");
  };

  const handleLoadDemo = () => {
    loadDemoRoute();
    finishOnboarding();
    navigation.replace("MainTabs");
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        progress={100}
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <FadeSlideView delay={100}>
          <Text style={styles.stepLabel}>STEP 4 OF 4</Text>
          <Text style={styles.title}>Add your delivery stops</Text>
          <Text style={styles.subtitle}>
            You're all set. Here's how to add stops to your route.
          </Text>
        </FadeSlideView>

        <FadeSlideView delay={200}>
          <OnboardingIllustration variant="stops" />
        </FadeSlideView>

        <FadeSlideView delay={300} style={styles.tips}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <MapPin color={colors.primary} size={20} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Long-press the map</Text>
              <Text style={styles.tipText}>
                Touch and hold anywhere on the map to drop a delivery pin
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Route color={colors.primary} size={20} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Or search by name</Text>
              <Text style={styles.tipText}>
                Use the search bar to find addresses and places in Metro Manila
              </Text>
            </View>
          </View>
        </FadeSlideView>

      </View>

      <FadeSlideView delay={350} style={styles.footer}>
        <PrimaryButton onPress={handleStartPlanning}>
          Start planning
        </PrimaryButton>
        <Pressable onPress={handleLoadDemo} hitSlop={8}>
          <Text style={styles.demoText}>Load demo route to try it out</Text>
        </Pressable>
      </FadeSlideView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: 24,
  },
  demoText: {
    ...type.label,
    color: colors.primary,
    textAlign: "center",
  },
  footer: {
    gap: spacing.md,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  stepLabel: {
    ...type.caption,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    ...type.body,
    color: colors.muted,
  },
  tipCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  tipContent: {
    flex: 1,
    gap: 2,
  },
  tipIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  tipText: {
    ...type.caption,
    color: colors.muted,
  },
  tipTitle: {
    ...type.heading,
    color: colors.text,
  },
  tips: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.lg,
    padding: 18,
  },
  title: {
    ...type.display,
    color: colors.text,
    marginBottom: 8,
  },
});
