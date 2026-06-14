import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useActiveRun } from "../state/deliveryRunStore";
import { colors, motion, radius, shadow, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/types";

/**
 * Self-contained banner that reads `useActiveRun()` and renders `null` when
 * there is no active run. Navigation to ActiveDelivery is handled internally
 * so callers need zero wiring — just drop in `<ResumeRunBanner />`.
 */
export function ResumeRunBanner() {
  const activeRun = useActiveRun();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!activeRun || activeRun.status !== "active") return null;

  const deliveredCount = activeRun.stops.filter((s) => s.status === "delivered").length;
  const totalCount = activeRun.stops.length;

  return (
    <Animated.View
      style={styles.banner}
      entering={FadeInDown.duration(motion.base)}
    >
      <View style={styles.textBlock}>
        <Text style={styles.label}>Delivery in progress</Text>
        <Text style={styles.progress}>
          {deliveredCount}/{totalCount} delivered
        </Text>
      </View>
      <Pressable
        style={styles.resumeButton}
        onPress={() => rootNav.navigate("ActiveDelivery", { runId: activeRun.id })}
        accessibilityLabel="Resume active delivery"
      >
        <Text style={styles.resumeButtonText}>Resume</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow.md,
  },
  label: {
    ...type.heading,
    color: colors.primaryDark,
  },
  progress: {
    ...type.body,
    color: colors.primary,
    marginTop: 2,
  },
  resumeButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resumeButtonText: {
    ...type.label,
    color: colors.textOnPrimary,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
});
