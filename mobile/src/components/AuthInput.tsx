import { useCallback } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, font, motion, radius, spacing, type } from "../theme";

type AuthInputProps = TextInputProps & {
  label: string;
  disabled?: boolean;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function AuthInput({ label, disabled, style, ...rest }: AuthInputProps) {
  const focused = useSharedValue(0);

  const handleFocus = useCallback(() => {
    focused.value = withTiming(1, { duration: motion.fast });
  }, [focused]);

  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, { duration: motion.fast });
  }, [focused]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focused.value,
      [0, 1],
      [colors.border, colors.primary],
    ),
  }));

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedView style={[styles.inputContainer, borderStyle, disabled && styles.inputDisabled]}>
        <TextInput
          editable={!disabled}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholderTextColor={colors.muted}
          style={[styles.input, style]}
          {...rest}
        />
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: spacing.xs,
  },
  input: {
    ...type.body,
    color: colors.text,
    fontSize: 16, // intentionally larger than type.body(15) for touch-target legibility
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  label: {
    ...type.label,
    color: colors.text,
  },
});
