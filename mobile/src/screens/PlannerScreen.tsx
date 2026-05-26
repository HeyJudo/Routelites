import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MapPinned, Route, Store } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { AppHeader } from "../components/AppHeader";
import { MapToast } from "../components/MapToast";
import {
  PlacesSearchInput,
  type PlaceResult,
} from "../components/PlacesSearchInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { RouteMap } from "../components/RouteMap";
import { ScreenShell } from "../components/ScreenShell";
import { StopListModal } from "../components/StopListModal";
import { createMapStop, demoStore } from "../data/demoRoute";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing } from "../theme";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { isDuplicateStop, isInsideNCR } from "../utils/validation";

type PlannerScreenProps = BottomTabScreenProps<MainTabParamList, "Planner">;

export function PlannerScreen({ navigation }: PlannerScreenProps) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height } = useWindowDimensions();
  const stops = useRouteDraftStore((s) => s.stops);
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);
  const addStop = useRouteDraftStore((s) => s.addStop);
  const loadDemoRoute = useRouteDraftStore((s) => s.loadDemoRoute);
  const activeStore = storeLocation ?? demoStore;
  const [showStopList, setShowStopList] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const collapsedHeight = Math.round(height * 0.38);
  const expandedHeight = Math.round(height * 0.78);
  const sheetHeight = useRef(new Animated.Value(collapsedHeight)).current;
  const currentSheetHeight = useRef(collapsedHeight);
  const stopModeLabel =
    stops.length === 0
      ? "0 stops"
      : stops.length <= 10
        ? `${stops.length} stops - Exact mode`
        : stops.length <= 20
          ? `${stops.length} stops - Clustered mode`
          : `${stops.length} stops - Large-route mode`;

  const addMapStop = (coordinate: { latitude: number; longitude: number }) => {
    if (!isInsideNCR(coordinate.latitude, coordinate.longitude)) {
      setToastMsg("This location is outside Metro Manila");
      return;
    }
    if (isDuplicateStop(stops, coordinate.latitude, coordinate.longitude)) {
      setToastMsg("A stop near here already exists");
      return;
    }
    addStop(
      createMapStop(coordinate.latitude, coordinate.longitude, stops.length + 1),
    );
  };

  const handlePlaceSelected = (place: PlaceResult) => {
    if (!isInsideNCR(place.lat, place.lng)) {
      setToastMsg("This location is outside Metro Manila");
      return;
    }
    if (isDuplicateStop(stops, place.lat, place.lng)) {
      setToastMsg("A stop near here already exists");
      return;
    }
    addStop({
      id: `stop_${Date.now()}`,
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      address: place.address,
    });
  };

  const snapSheetTo = (nextHeight: number) => {
    currentSheetHeight.current = nextHeight;
    Animated.spring(sheetHeight, {
      damping: 22,
      mass: 0.8,
      stiffness: 180,
      toValue: nextHeight,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        Math.abs(gestureState.dy) > 6,
      onPanResponderMove: (_event, gestureState) => {
        const nextHeight = Math.max(
          collapsedHeight,
          Math.min(expandedHeight, currentSheetHeight.current - gestureState.dy),
        );
        sheetHeight.setValue(nextHeight);
      },
      onPanResponderRelease: (_event, gestureState) => {
        const midpoint = (collapsedHeight + expandedHeight) / 2;
        const releasedHeight = currentSheetHeight.current - gestureState.dy;
        const targetHeight =
          gestureState.vy < -0.35 || releasedHeight > midpoint
            ? expandedHeight
            : collapsedHeight;
        snapSheetTo(targetHeight);
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <AppHeader showMenu />
      <ScreenShell padded={false}>
        <View style={styles.mapArea}>
          <RouteMap onLongPress={addMapStop} stops={stops} store={activeStore} />
          <MapToast
            message={toastMsg}
            visible={toastMsg !== ""}
            onDismiss={() => setToastMsg("")}
          />
        </View>
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
            },
          ]}
        >
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Ready to plan today's route?</Text>
            <View style={styles.storeCard}>
              <View style={styles.storeIcon}>
                <Store color={colors.primaryDark} size={20} />
              </View>
              <View style={styles.storeCopy}>
                <Text style={styles.cardTitle}>{activeStore.label}</Text>
                <Text style={styles.cardSubtitle}>{activeStore.address}</Text>
              </View>
            </View>
            <PlacesSearchInput
              onPlaceSelected={handlePlaceSelected}
              placeholder="Add delivery stop"
            />
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>{stopModeLabel}</Text>
              <Text style={styles.statusChip}>PENDING</Text>
            </View>
            {stops.length > 10 && stops.length <= 20 ? (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  Routes with 11+ stops use clustered mode and are approximate.
                </Text>
              </View>
            ) : null}
            {stops.length > 20 ? (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  Large-route mode: {stops.length} stops. Optimization may take
                  longer and results are approximate.
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
                  <Pressable onPress={() => setShowStopList(true)}>
                    <Text style={styles.moreStopsText}>
                      +{stops.length - 4} more stops — View all
                    </Text>
                  </Pressable>
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
              onPress={() => rootNav.navigate("Loading")}
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
          </ScrollView>
        </Animated.View>
      </ScreenShell>
      <StopListModal
        visible={showStopList}
        onClose={() => setShowStopList(false)}
      />
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
    backgroundColor: colors.border,
    height: 5,
    width: 44,
    borderRadius: radius.pill,
  },
  handleWrap: {
    alignItems: "center",
    paddingBottom: 12,
    paddingTop: 12,
  },
  mapArea: {
    backgroundColor: "#e6eeeb",
    flex: 1,
    overflow: "hidden",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
  },
  sheetContent: {
    gap: spacing.lg,
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 0,
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
