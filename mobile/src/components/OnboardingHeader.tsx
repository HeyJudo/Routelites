import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { LogoMark } from "./LogoMark";
import { OnboardingProgressBar } from "./OnboardingProgressBar";
import { colors } from "../theme";

type OnboardingHeaderProps = {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Whether to show back button */
  canGoBack?: boolean;
  /** Callback when back button is pressed */
  onBack?: () => void;
  /** Whether to show the progress bar (hide on first screen) */
  showProgress?: boolean;
};

/**
 * Header component for onboarding screens.
 * Shows logo, optional back button, and progress bar.
 */
export function OnboardingHeader({
  progress,
  canGoBack = false,
  onBack,
  showProgress = true,
}: OnboardingHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {canGoBack ? (
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            hitSlop={12}
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={colors.text} size={24} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <LogoMark size="sm" />
        <View style={styles.backPlaceholder} />
      </View>
      {showProgress && (
        <View style={styles.progressWrap}>
          <OnboardingProgressBar progress={progress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  backPlaceholder: {
    width: 40,
  },
  container: {
    backgroundColor: colors.background,
    gap: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  progressWrap: {
    paddingHorizontal: 4,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
