import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, font, motion, radius, spacing, type } from "../theme";

type SelectableCardProps = {
  children?: ReactNode;
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  selected: boolean;
  sublabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SelectableCard({
  children,
  icon,
  label,
  onPress,
  selected,
  sublabel,
}: SelectableCardProps) {
  const scale = useSharedValue(1);
  const selectedProgress = useDerivedValue(() =>
    withTiming(selected ? 1 : 0, { duration: motion.fast }),
  );

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [colors.border, colors.primary],
    ),
    transform: [{ scale: scale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [colors.card, colors.primarySoft],
    ),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, motion.spring);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, motion.spring);
  };

  return (
    <AnimatedPressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, cardStyle, bgStyle]}
    >
      {icon ? <Animated.View style={styles.icon}>{icon}</Animated.View> : null}
      <Animated.Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Animated.Text>
      {sublabel ? (
        <Text style={styles.sublabel}>{sublabel}</Text>
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...type.label,
    color: colors.text,
    textAlign: "center",
  },
  labelSelected: {
    color: colors.primaryDark,
    fontFamily: font.bold,
  },
  sublabel: {
    ...type.caption,
    color: colors.muted,
    textAlign: "center",
  },
});
