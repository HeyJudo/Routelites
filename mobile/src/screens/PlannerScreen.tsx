import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { MapPinned, Plus, Route, Search, Store } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { colors, radius, spacing } from "../theme";
import type { MainTabParamList } from "../navigation/types";

type PlannerScreenProps = BottomTabScreenProps<MainTabParamList, "Planner">;

export function PlannerScreen({ navigation }: PlannerScreenProps) {
  return (
    <View style={styles.container}>
      <AppHeader showMenu />
      <ScreenShell padded={false}>
        <View style={styles.mapArea}>
          <View style={styles.pin}>
            <Store color={colors.card} size={18} />
          </View>
        </View>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Ready to plan today's route?</Text>
          <View style={styles.storeCard}>
            <View style={styles.storeIcon}>
              <Store color={colors.primaryDark} size={20} />
            </View>
            <View style={styles.storeCopy}>
              <Text style={styles.cardTitle}>Depot Alpha</Text>
              <Text style={styles.cardSubtitle}>Start point - Metro Manila</Text>
            </View>
          </View>
          <View style={styles.searchBox}>
            <Search color={colors.muted} size={20} />
            <Text style={styles.searchText}>Add delivery stop</Text>
            <Plus color={colors.primary} size={20} />
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>0 stops</Text>
            <Text style={styles.statusChip}>PENDING</Text>
          </View>
          <PrimaryButton
            disabled
            icon={<Route color={colors.muted} size={20} />}
            onPress={() => navigation.navigate("Results")}
          >
            Optimize route
          </PrimaryButton>
          <PrimaryButton
            icon={<MapPinned color={colors.text} size={20} />}
            variant="secondary"
          >
            Load demo route
          </PrimaryButton>
        </View>
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 32,
  },
  mapArea: {
    alignItems: "center",
    backgroundColor: "#e6eeeb",
    flex: 1,
    justifyContent: "center",
  },
  pin: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  searchText: {
    color: colors.muted,
    flex: 1,
    fontSize: 16,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.lg,
    padding: 20,
  },
  statusCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: 16,
  },
  statusChip: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  storeCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: 14,
  },
  storeCopy: {
    flex: 1,
  },
  storeIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
  },
});

