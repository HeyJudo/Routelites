import { SlidersHorizontal } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { colors, radius, spacing } from "../theme";

export function ResultsScreen() {
  return (
    <View style={styles.container}>
      <AppHeader showMenu />
      <ScreenShell padded={false}>
        <View style={styles.mapArea}>
          <Text style={styles.mapText}>Route preview appears here</Text>
          <PrimaryButton
            icon={<SlidersHorizontal color={colors.primaryDark} size={18} />}
            variant="secondary"
          >
            Refine route
          </PrimaryButton>
        </View>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>No results yet</Text>
            <Text style={styles.link}>Algorithm details</Text>
          </View>
          <Text style={styles.copy}>
            Run a mock route optimization from Planner to compare the optimized
            route against the naive input-order route.
          </Text>
          <View style={styles.segmented}>
            <Text style={styles.segmentActive}>Optimized</Text>
            <Text style={styles.segment}>Naive</Text>
            <Text style={styles.segment}>Compare</Text>
          </View>
        </View>
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 32,
  },
  link: {
    color: colors.text,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  mapArea: {
    alignItems: "flex-start",
    backgroundColor: "#e6eeeb",
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  mapText: {
    alignSelf: "center",
    color: colors.muted,
    fontSize: 16,
    marginBottom: 24,
  },
  segment: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    textAlign: "center",
  },
  segmentActive: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    overflow: "hidden",
    paddingVertical: 12,
    textAlign: "center",
  },
  segmented: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.xs,
    padding: 4,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.lg,
    padding: 20,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
});

