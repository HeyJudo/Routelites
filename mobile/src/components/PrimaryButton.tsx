import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../theme";

type PrimaryButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
};

export function PrimaryButton({
  children,
  disabled,
  icon,
  onPress,
  variant = "primary",
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text
          style={[
            styles.label,
            variant === "primary" ? styles.primaryLabel : styles.secondaryLabel,
            variant === "danger" ? styles.dangerLabel : null,
            disabled ? styles.disabledLabel : null,
          ]}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
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
  label: {
    fontSize: 16,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.78,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    color: colors.card,
  },
  secondary: {
    backgroundColor: colors.mutedSoft,
  },
  secondaryLabel: {
    color: colors.text,
  },
});

