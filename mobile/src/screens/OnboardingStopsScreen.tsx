import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MapPin, Route } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FadeSlideView } from "../components/FadeSlideView";
import { OnboardingHeader } from "../components/OnboardingHeader";
import { OnboardingIllustration } from "../components/OnboardingIllustration";
import { PrimaryButton } from "../components/PrimaryButton";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing } from "../theme";
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

  const handleStartPlanning = () => {
    navigation.replace("MainTabs");
  };

  const handleLoadDemo = () => {
    loadDemoRoute();
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
          <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
          <Text style={styles.title}>Add your delivery stops</Text>
          <Text style={styles.subtitle}>
            You're all set! Here's how to add stops to your route.
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

        <FadeSlideView delay={350}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Pro tip</Text>
            <Text style={styles.infoText}>
              Add 3-10 stops for the best optimization results. RouteLite will
              find the shortest route that visits all your stops.
            </Text>
          </View>
        </FadeSlideView>
      </View>

      <FadeSlideView delay={400} style={styles.footer}>
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
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    gap: spacing.md,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  infoCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    gap: 6,
    padding: 16,
  },
  infoText: {
    color: colors.primaryDark,
    fontSize: 14,
    lineHeight: 20,
  },
  infoTitle: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "800",
  },
  stepLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
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
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  tipTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
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
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
});
