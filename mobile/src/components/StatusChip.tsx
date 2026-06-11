import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../theme";
import type { DeliveryStopStatus } from "../types/delivery";

type StatusChipProps = {
  status: DeliveryStopStatus;
};

const STATUS_LABEL: Record<DeliveryStopStatus, string> = {
  pending: "Pending",
  delivered: "Delivered",
  failed: "Failed",
};

export function StatusChip({ status }: StatusChipProps) {
  return (
    <View style={[styles.chip, styles[status]]}>
      <Text style={[styles.text, styles[`${status}Text` as keyof typeof styles]]}>
        {status === "delivered" ? "✓ " : status === "failed" ? "✕ " : ""}
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
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
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});
