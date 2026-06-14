import { Check, X } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { colors, motion, radius, spacing, type } from "../theme";
import type { DeliveryStopStatus } from "../types/delivery";

type StatusChipProps = {
  animated?: boolean;
  status: DeliveryStopStatus;
  variant?: "pill" | "dot";
};

const STATUS_LABEL: Record<DeliveryStopStatus, string> = {
  pending: "Pending",
  delivered: "Delivered",
  failed: "Failed",
};

const STATUS_COLOR: Record<DeliveryStopStatus, string> = {
  pending: colors.muted,
  delivered: colors.delivered,
  failed: colors.danger,
};

export function StatusChip({ animated = false, status, variant = "pill" }: StatusChipProps) {
  const textColor = STATUS_COLOR[status];

  const inner =
    variant === "dot" ? (
      <View style={styles.dotRow}>
        <View
          style={[
            styles.dot,
            status === "delivered" && styles.dotDelivered,
            status === "failed" && styles.dotFailed,
            status === "pending" && styles.dotPending,
          ]}
        />
        <Text style={[styles.text, { color: textColor }]}>{STATUS_LABEL[status]}</Text>
      </View>
    ) : (
      <View style={[styles.chip, styles[status]]}>
        <View style={styles.row}>
          {status === "delivered" ? (
            <Check color={textColor} size={11} strokeWidth={2.5} />
          ) : status === "failed" ? (
            <X color={textColor} size={11} strokeWidth={2.5} />
          ) : null}
          <Text style={[styles.text, styles[`${status}Text` as keyof typeof styles] as object]}>
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </View>
    );

  if (animated) {
    return (
      <Animated.View entering={FadeIn.duration(motion.fast)}>
        {inner}
      </Animated.View>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  delivered: {
    backgroundColor: colors.deliveredSoft,
  },
  deliveredText: {
    color: colors.delivered,
  },
  dot: {
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  dotDelivered: {
    backgroundColor: colors.delivered,
  },
  dotFailed: {
    backgroundColor: colors.danger,
  },
  dotPending: {
    backgroundColor: colors.muted,
  },
  dotRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  failed: {
    backgroundColor: colors.dangerSoft,
  },
  failedText: {
    color: colors.danger,
  },
  pending: {
    backgroundColor: colors.mutedSoft,
  },
  pendingText: {
    color: colors.muted,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  text: {
    ...type.caption,
  },
});
