import { Check, X } from "lucide-react-native";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, font, radius, spacing, type } from "../theme";
import type { ActiveDeliveryStop } from "../types/delivery";
import { StatusChip } from "./StatusChip";

type StopRowProps = {
  stop: ActiveDeliveryStop;
  index: number;
  isActive: boolean;
  legDistanceM?: number;
  onPress: () => void;
  // Reanimated passthrough props for list animations
  entering?: ComponentProps<typeof Animated.View>["entering"];
  exiting?: ComponentProps<typeof Animated.View>["exiting"];
  layout?: ComponentProps<typeof Animated.View>["layout"];
};

export function StopRow({
  stop,
  index,
  isActive,
  legDistanceM,
  onPress,
  entering,
  exiting,
  layout,
}: StopRowProps) {
  const isDone = stop.status === "delivered" || stop.status === "failed";

  // Track previous status to detect pending → done transition.
  // hasMounted ref prevents the pop animation on rows that are already-done at
  // first render (e.g. re-entering the screen mid-run).
  const prevStatusRef = useRef(stop.status);
  const hasMountedRef = useRef(false);

  const badgeScale = useSharedValue(1);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevStatusRef.current = stop.status;
      return;
    }

    const prev = prevStatusRef.current;
    const curr = stop.status;

    if (prev === "pending" && (curr === "delivered" || curr === "failed")) {
      // Badge pop: 1 → 1.25 → 1, ~280 ms total
      badgeScale.value = withSequence(
        withSpring(1.25, { damping: 6, stiffness: 300, mass: 0.5 }),
        withTiming(1, { duration: 140 }),
      );
    }

    prevStatusRef.current = curr;
  }, [stop.status]);

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <Animated.View entering={entering} exiting={exiting} layout={layout}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          isActive && styles.rowActive,
          isDone && styles.rowDone,
          pressed && styles.rowPressed,
        ]}
        accessibilityLabel={`Stop ${index}: ${stop.label}`}
      >
        {/* Badge — wrapped in Animated.View for scale pop */}
        <Animated.View style={badgeAnimStyle}>
          <View
            style={[
              styles.badge,
              stop.status === "delivered" && styles.badgeDeliveredSolid,
              stop.status === "failed" && styles.badgeFailedSolid,
              isActive && styles.badgeActive,
            ]}
          >
            {stop.status === "delivered" ? (
              <Animated.View entering={FadeIn.duration(150)}>
                <Check color={colors.textOnPrimary} size={14} strokeWidth={2.5} />
              </Animated.View>
            ) : stop.status === "failed" ? (
              <Animated.View entering={FadeIn.duration(150)}>
                <X color={colors.textOnPrimary} size={14} strokeWidth={2.5} />
              </Animated.View>
            ) : (
              <Text
                style={[
                  styles.badgeText,
                  isActive && styles.badgeTextLight,
                ]}
              >
                {index}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Info */}
        <View style={styles.info}>
          <Text
            style={[styles.label, isDone && styles.labelDone]}
            numberOfLines={1}
          >
            {stop.label}
          </Text>

          {/* Address fades out (exiting) when stop becomes done */}
          {!isDone && stop.address ? (
            <Animated.View exiting={FadeOut.duration(200)}>
              <Text style={styles.address} numberOfLines={1}>
                {stop.address}
              </Text>
            </Animated.View>
          ) : null}

          {/* Note shown after completion */}
          {isDone && stop.note ? (
            <Text style={styles.note} numberOfLines={1}>
              Note: {stop.note}
            </Text>
          ) : null}
        </View>

        {/* Right side: distance (pending) or animated status chip (done) */}
        <View style={styles.right}>
          {isDone ? (
            <StatusChip status={stop.status} animated />
          ) : (
            legDistanceM != null && (
              <Text style={styles.dist}>
                {(legDistanceM / 1000).toFixed(1)} km
              </Text>
            )
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  address: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
  badge: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 2,
    flexShrink: 0,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  badgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    height: 32,
    width: 32,
  },
  badgeDeliveredSolid: {
    backgroundColor: colors.delivered,
    borderColor: colors.delivered,
  },
  badgeFailedSolid: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  badgeText: {
    ...type.mono,
    color: colors.primaryDark,
    fontFamily: font.semibold,
    letterSpacing: 0,
  },
  badgeTextLight: {
    color: colors.card,
  },
  dist: {
    ...type.caption,
    color: colors.muted,
    minWidth: 44,
    textAlign: "right",
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  label: {
    ...type.label,
    color: colors.text,
  },
  labelDone: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  note: {
    ...type.caption,
    color: colors.muted,
    fontStyle: "italic",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    marginLeft: spacing.sm,
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingVertical: 10,
  },
  rowActive: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  rowDone: {
    opacity: 0.65,
  },
  rowPressed: {
    opacity: 0.75,
  },
});
