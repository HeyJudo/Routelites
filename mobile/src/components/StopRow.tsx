import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../theme";
import type { ActiveDeliveryStop } from "../types/delivery";
import { StatusChip } from "./StatusChip";

type StopRowProps = {
  stop: ActiveDeliveryStop;
  index: number;
  isActive: boolean;
  legDistanceM?: number;
  onPress: () => void;
};

export function StopRow({ stop, index, isActive, legDistanceM, onPress }: StopRowProps) {
  const isDone = stop.status === "delivered" || stop.status === "failed";

  return (
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
      {/* Badge */}
      <View
        style={[
          styles.badge,
          stop.status === "delivered" && styles.badgeDelivered,
          stop.status === "failed" && styles.badgeFailed,
          isActive && styles.badgeActive,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            (stop.status === "delivered" || isActive) && styles.badgeTextLight,
            stop.status === "failed" && styles.badgeTextLight,
          ]}
        >
          {index}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.label, isDone && styles.labelDone]}
          numberOfLines={1}
        >
          {stop.label}
        </Text>

        {/* Show address only for pending stops */}
        {!isDone && stop.address ? (
          <Text style={styles.address} numberOfLines={1}>
            {stop.address}
          </Text>
        ) : null}

        {/* Show note if present */}
        {isDone && stop.note ? (
          <Text style={styles.note} numberOfLines={1}>
            Note: {stop.note}
          </Text>
        ) : null}
      </View>

      {/* Right side: distance (pending) or status chip (done) */}
      <View style={styles.right}>
        {isDone ? (
          <StatusChip status={stop.status} />
        ) : (
          legDistanceM != null && (
            <Text style={styles.dist}>
              {(legDistanceM / 1000).toFixed(1)} km
            </Text>
          )
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  address: {
    color: colors.muted,
    fontSize: 11,
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
  badgeDelivered: {
    backgroundColor: colors.deliveredSoft,
    borderColor: colors.delivered,
  },
  badgeFailed: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "900",
  },
  badgeTextLight: {
    color: colors.card,
  },
  dist: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    minWidth: 44,
    textAlign: "right",
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  labelDone: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  note: {
    color: colors.muted,
    fontSize: 11,
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
