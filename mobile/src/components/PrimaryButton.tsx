import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, font, motion, radius, type } from "../theme";

type PrimaryButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  size?: "md" | "sm";
  variant?: "primary" | "secondary" | "danger" | "outline";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  children,
  disabled,
  icon,
  loading = false,
  onPress,
  size = "md",
  variant = "primary",
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  // Armed-CTA animation: only active for the `primary` variant.
  // Drives a 0→1 value that interpolates background between mutedSoft and primary.
  const isDisabled = disabled || loading;
  const armedProgress = useDerivedValue(() =>
    withTiming(isDisabled ? 0 : 1, { duration: motion.base }),
  );

  const primaryBgStyle = useAnimatedStyle(() => {
    if (variant !== "primary") return {};
    return {
      backgroundColor: interpolateColor(
        armedProgress.value,
        [0, 1],
        [colors.mutedSoft, colors.primary],
      ),
    };
  });

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withSpring(0.97, motion.spring);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, motion.spring);
  };

  // For primary variant: static styles exclude backgroundColor (animated style owns it).
  // All other variants keep static backgroundColor via styles[variant].
  const staticVariantStyle = variant === "primary" ? styles.primaryNoBackground : styles[variant];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        size === "sm" ? styles.buttonSm : styles.buttonMd,
        staticVariantStyle,
        // For non-primary disabled states, apply the static disabled bg.
        // For primary, armedProgress handles the background transition.
        variant !== "primary" && isDisabled ? styles.disabled : null,
        scaleStyle,
        // Primary animated background applied last so it wins.
        primaryBgStyle,
      ]}
    >
      {/* Fixed-size content area so button doesn't resize when loading toggles */}
      <View style={styles.content}>
        {/* Label — always rendered but invisible when loading */}
        <Animated.View
          style={loading ? styles.hidden : undefined}
          entering={!loading ? FadeIn.duration(motion.fast) : undefined}
          exiting={FadeOut.duration(motion.fast)}
        >
          <View style={styles.labelRow}>
            {icon}
            <Text
              style={[
                size === "sm" ? styles.labelSm : styles.labelMd,
                variant === "primary" ? styles.primaryLabel : styles.secondaryLabel,
                variant === "danger" ? styles.dangerLabel : null,
                variant === "outline" ? styles.outlineLabel : null,
                isDisabled ? styles.disabledLabel : null,
              ]}
            >
              {children}
            </Text>
          </View>
        </Animated.View>

        {/* Spinner — absolutely positioned so it doesn't affect layout */}
        {loading ? (
          <Animated.View
            style={styles.spinnerOverlay}
            entering={FadeIn.duration(motion.fast)}
            exiting={FadeOut.duration(motion.fast)}
          >
            <ActivityIndicator
              color={variant === "primary" ? colors.textOnPrimary : colors.primary}
              size="small"
            />
          </Animated.View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.pill,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonMd: {
    minHeight: 52,
  },
  buttonSm: {
    minHeight: 40,
    paddingHorizontal: 14,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  danger: {
    backgroundColor: colors.dangerSoft,
  },
  dangerLabel: {
    color: colors.danger,
  },
  disabled: {
    backgroundColor: colors.mutedSoft,
  },
  disabledLabel: {
    color: colors.muted,
  },
  hidden: {
    opacity: 0,
  },
  labelMd: {
    fontFamily: font.bold,
    fontSize: 16, // intentionally larger than type.label(13) for md-size CTA legibility
    lineHeight: 20,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  labelSm: {
    ...type.label,
  },
  outline: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  },
  outlineLabel: {
    color: colors.text,
  },
  // primary variant: background is owned by the animated style, not a static StyleSheet rule.
  // This entry is intentionally omitted so AnimatedStyle wins without fighting.
  primaryNoBackground: {
    // no backgroundColor — armedProgress animated style handles it
  },
  primaryLabel: {
    color: colors.textOnPrimary,
  },
  secondary: {
    backgroundColor: colors.mutedSoft,
  },
  secondaryLabel: {
    color: colors.text,
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
