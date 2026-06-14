import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { colors, font, type } from "../theme";

type OnboardingProgressBarProps = {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Optional label to show (e.g., "Your progress") */
  label?: string;
};

/**
 * Animated progress bar for onboarding flow.
 * Shows a percentage label and a smooth-filling progress track.
 */
export function OnboardingProgressBar({
  progress,
  label = "Your progress",
}: OnboardingProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: progress,
      damping: 20,
      mass: 1,
      stiffness: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolated,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: "100%",
  },
  label: {
    ...type.caption,
    color: colors.muted,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  percentage: {
    ...type.caption,
    color: colors.primary,
    fontFamily: font.heavy,
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 6,
    overflow: "hidden",
    width: "100%",
  },
});
