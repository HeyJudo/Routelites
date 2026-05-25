import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { colors, radius } from "../theme";

type Props = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
};

/**
 * Displays an animated toast with the provided message and dismisses itself after a brief visible period.
 *
 * When `visible` becomes true the toast fades in, remains visible for a short duration, then fades out;
 * `onDismiss` is called once the hide animation finishes.
 *
 * @param message - The text displayed inside the toast
 * @param visible - Whether the toast is currently shown
 * @param onDismiss - Called after the toast completes its hide animation
 * @returns The rendered toast element when `visible` is true, otherwise `null`
 */
export function MapToast({ message, visible, onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 12,
    left: 20,
    right: 20,
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
