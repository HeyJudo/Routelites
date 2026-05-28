import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowRight } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { FadeSlideView } from "../components/FadeSlideView";
import { OnboardingHeader } from "../components/OnboardingHeader";
import { OnboardingIllustration } from "../components/OnboardingIllustration";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, spacing } from "../theme";
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
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Optimized stop ordering</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Real road distances</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
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
        <Text style={styles.footerNote}>Takes less than a minute to set up</Text>
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
  featureDot: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  featureText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  features: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.md,
    padding: 18,
  },
  footer: {
    gap: spacing.md,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  footerNote: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  textContent: {
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
});
