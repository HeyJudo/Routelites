import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { MapPinned, Plus, Route, Search, Store } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { RouteMap } from "../components/RouteMap";
import { ScreenShell } from "../components/ScreenShell";
import { createMapStop, demoStops, demoStore } from "../data/demoRoute";
import { colors, radius, spacing } from "../theme";
import type { MainTabParamList } from "../navigation/types";
import type { Stop } from "../types/route";

type PlannerScreenProps = BottomTabScreenProps<MainTabParamList, "Planner">;

export function PlannerScreen({ navigation }: PlannerScreenProps) {
  const { height } = useWindowDimensions();
  const [stops, setStops] = useState<Stop[]>([]);
  const mapHeight = Math.max(260, Math.round(height * 0.34));
  const stopModeLabel =
    stops.length === 0
      ? "0 stops"
      : stops.length <= 10
        ? `${stops.length} stops - Exact mode`
        : stops.length <= 20
          ? `${stops.length} stops - Clustered mode`
          : `${stops.length} stops - Large-route mode`;

  const addMapStop = (coordinate: { latitude: number; longitude: number }) => {
    setStops((currentStops) => [
      ...currentStops,
      createMapStop(
        coordinate.latitude,
        coordinate.longitude,
        currentStops.length + 1,
      ),
    ]);
  };

  const loadDemoRoute = () => {
    setStops(demoStops);
  };

  return (
    <View style={styles.container}>
      <AppHeader showMenu />
      <ScreenShell padded={false}>
        <View style={[styles.mapArea, { height: mapHeight }]}>
          <RouteMap onLongPress={addMapStop} stops={stops} store={demoStore} />
        </View>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Ready to plan today's route?</Text>
          <View style={styles.storeCard}>
            <View style={styles.storeIcon}>
              <Store color={colors.primaryDark} size={20} />
            </View>
            <View style={styles.storeCopy}>
              <Text style={styles.cardTitle}>{demoStore.label}</Text>
              <Text style={styles.cardSubtitle}>{demoStore.address}</Text>
            </View>
          </View>
          <View style={styles.searchBox}>
            <Search color={colors.muted} size={20} />
            <Text style={styles.searchText}>Add delivery stop</Text>
            <Plus color={colors.primary} size={20} />
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>{stopModeLabel}</Text>
            <Text style={styles.statusChip}>PENDING</Text>
          </View>
          {stops.length > 10 ? (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                Routes with 11+ stops use clustered mode and are approximate.
              </Text>
            </View>
          ) : null}
          {stops.length > 0 ? (
            <View style={styles.stopList}>
              {stops.slice(0, 4).map((stop, index) => (
                <View key={stop.id} style={styles.stopRow}>
                  <View style={styles.stopNumber}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopCopy}>
                    <Text style={styles.stopLabel}>{stop.label}</Text>
                    <Text numberOfLines={1} style={styles.stopAddress}>
                      {stop.address}
                    </Text>
                  </View>
                </View>
              ))}
              {stops.length > 4 ? (
                <Text style={styles.moreStopsText}>
                  +{stops.length - 4} more stops
                </Text>
              ) : null}
            </View>
          ) : null}
          <PrimaryButton
            disabled={stops.length === 0}
            icon={
              <Route
                color={stops.length === 0 ? colors.muted : colors.card}
                size={20}
              />
            }
            onPress={() => navigation.navigate("Results")}
          >
            Optimize route
          </PrimaryButton>
          <PrimaryButton
            icon={<MapPinned color={colors.text} size={20} />}
            onPress={loadDemoRoute}
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
    backgroundColor: "#e6eeeb",
    overflow: "hidden",
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
    flex: 1,
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
  },
  stopAddress: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  stopCopy: {
    flex: 1,
  },
  stopLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  stopList: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: 14,
  },
  stopNumber: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  stopNumberText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  stopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  moreStopsText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    paddingLeft: 38,
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
  warningCard: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    padding: 12,
  },
  warningText: {
    color: colors.warning,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 17,
  },
});
