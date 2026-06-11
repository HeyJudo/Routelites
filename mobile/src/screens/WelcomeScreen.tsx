import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowRight, Map, MapPinned, Route } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { FadeSlideView } from "../components/FadeSlideView";
import { OnboardingHeader } from "../components/OnboardingHeader";
import { OnboardingIllustration } from "../components/OnboardingIllustration";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radius, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type WelcomeScreenProps = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <OnboardingHeader progress={0} showProgress={false} />

      <View style={styles.content}>
        <FadeSlideView delay={100}>
          <OnboardingIllustration variant="welcome" />
        </FadeSlideView>

        <FadeSlideView delay={200} style={styles.textContent}>
          <Text style={styles.title}>Plan smarter delivery routes</Text>
          <Text style={styles.subtitle}>
            Add your stops, let RouteLite find the best order, and see how much
            distance you save compared to your original route.
          </Text>
        </FadeSlideView>

        <FadeSlideView delay={300} style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <Route color={colors.primaryDark} size={16} />
            </View>
            <Text style={styles.featureText}>Optimized stop ordering</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <MapPinned color={colors.primaryDark} size={16} />
            </View>
            <Text style={styles.featureText}>Real road distances</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <Map color={colors.primaryDark} size={16} />
            </View>
            <Text style={styles.featureText}>Metro Manila coverage</Text>
          </View>
        </FadeSlideView>
      </View>

      <FadeSlideView delay={400} style={styles.footer}>
        <PrimaryButton
          icon={<ArrowRight color={colors.card} size={20} />}
          onPress={() => navigation.navigate("SetStore")}
        >
          Get started
        </PrimaryButton>
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
    gap: spacing.xl,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  featureText: {
    ...type.label,
    color: colors.text,
  },
  features: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: 18,
  },
  footer: {
    gap: spacing.md,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  subtitle: {
    ...type.body,
    color: colors.muted,
    textAlign: "center",
  },
  textContent: {
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.text,
    textAlign: "center",
  },
});
