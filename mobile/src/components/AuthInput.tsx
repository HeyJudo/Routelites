import { Eye, EyeOff } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Pressable,
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
  /** When true, renders an eye-toggle to show/hide the value. */
  secureToggle?: boolean;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function AuthInput({ label, disabled, secureToggle, secureTextEntry, style, ...rest }: AuthInputProps) {
  const [visible, setVisible] = useState(false);
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

  const isSecure = secureToggle ? !visible : secureTextEntry;

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedView style={[styles.inputContainer, borderStyle, disabled && styles.inputDisabled]}>
        <TextInput
          editable={!disabled}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholderTextColor={colors.muted}
          secureTextEntry={isSecure}
          style={[styles.input, secureToggle && styles.inputWithToggle, style]}
          {...rest}
        />
        {secureToggle ? (
          <Pressable
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            hitSlop={8}
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeToggle}
          >
            {visible ? (
              <EyeOff color={colors.muted} size={18} />
            ) : (
              <Eye color={colors.muted} size={18} />
            )}
          </Pressable>
        ) : null}
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  eyeToggle: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 14,
    position: "absolute",
    right: 0,
    top: 0,
  },
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
  inputWithToggle: {
    paddingRight: 48, // leave room for eye toggle
  },
  label: {
    ...type.label,
    color: colors.text,
  },
});
