import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Layers, Plus, Route, Search, Store, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutLeft,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type BottomSheet from "@gorhom/bottom-sheet";

import { AppHeader } from "../components/AppHeader";
import { AppBottomSheet, BottomSheetScrollView } from "../components/AppBottomSheet";
import { MapToast } from "../components/MapToast";
import {
  PlacesSearchModal,
  type PlaceResult,
} from "../components/PlacesSearchModal";
import { PrimaryButton } from "../components/PrimaryButton";
import { ResumeRunBanner } from "../components/ResumeRunBanner";
import { RouteMap, type RouteMapHandle } from "../components/RouteMap";
import { StopListModal } from "../components/StopListModal";
import { createMapStop, demoStore } from "../data/demoRoute";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { useProfileStore } from "../state/profileStore";
import { colors, radius, shadow, spacing, type } from "../theme";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { isDuplicateStop, isInsideNCR } from "../utils/validation";

type PlannerScreenProps = BottomTabScreenProps<MainTabParamList, "Planner">;

/**
 * Renders the Planner screen UI for creating, previewing, and optimizing delivery routes.
 *
 * Presents an interactive map for adding stops, a draggable bottom sheet with route controls
 * and stop previews, and an action to optimize the route. Validates map-added stops (location
 * and duplicates), shows brief toast messages, and opens a modal to view the full stop list.
 *
 * @param navigation - Navigation prop used to navigate to the Results screen
 * @returns The Planner screen React element
 */
export function PlannerScreen({ navigation }: PlannerScreenProps) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const stops = useRouteDraftStore((s) => s.stops);
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);
  const addStop = useRouteDraftStore((s) => s.addStop);
  const removeStop = useRouteDraftStore((s) => s.removeStop);
  const loadDemoRoute = useRouteDraftStore((s) => s.loadDemoRoute);
  const optimizeMode = useRouteDraftStore((s) => s.optimizeMode);
  const setOptimizeMode = useRouteDraftStore((s) => s.setOptimizeMode);
  const storeName = useProfileStore((s) => s.profile?.storeName);
  const activeStore = storeLocation ?? demoStore;
  const displayStoreName = storeName || activeStore.label;
  const [showStopList, setShowStopList] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [sheetIndex, setSheetIndex] = useState(1);
  const mapRef = useRef<RouteMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);

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

  const handlePlaceSelected = (place: PlaceResult): boolean => {
    if (!isInsideNCR(place.lat, place.lng)) {
      setToastMsg("This location is outside Metro Manila");
      return false;
    }
    if (isDuplicateStop(stops, place.lat, place.lng)) {
      setToastMsg("A stop near here already exists");
      return false;
    }
    addStop({
      id: `stop_${Date.now()}`,
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      address: place.address,
    });
    return true;
  };

  const isLargeRoute = stops.length > 10;

  // Segmented control for optimize mode
  const [modeSegmentWidth, setModeSegmentWidth] = useState(0);
  const modeThumbX = useSharedValue(0);
  const modeThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: modeThumbX.value }],
  }));

  // Force distance mode for large routes
  useEffect(() => {
    if (isLargeRoute && optimizeMode === "time") {
      setOptimizeMode("distance");
    }
  }, [isLargeRoute, optimizeMode, setOptimizeMode]);

  // Animate thumb to the selected mode segment
  useEffect(() => {
    if (modeSegmentWidth > 0) {
      modeThumbX.value = withSpring(optimizeMode === "distance" ? 0 : modeSegmentWidth, {
        damping: 20,
        stiffness: 200,
      });
    }
  }, [optimizeMode, modeSegmentWidth]);

  return (
    <View style={styles.container}>
      {/* AppHeader rendered above the sheet — shows personalized greeting */}
      <AppHeader showGreeting />

      {/* Resume banner — self-contained, renders null when no active run */}
      <ResumeRunBanner />

      {/* Map fills remaining space below header/banner */}
      <View style={styles.mapArea}>
        <RouteMap ref={mapRef} onLongPress={addMapStop} stops={stops} store={activeStore} />
        <MapToast
          message={toastMsg}
          visible={toastMsg !== ""}
          onDismiss={() => setToastMsg("")}
        />
      </View>

      {/* Bottom sheet is a sibling of mapArea, positioned absolutely by gorhom */}
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["15%", "45%", "88%"]}
        index={1}
        onChange={setSheetIndex}
      >
        {/* Peek bar — always visible at 15% snap */}
        <View style={styles.peekBar}>
          <View style={styles.peekLeft}>
            <Text style={styles.peekStopCount}>
              {stops.length === 0 ? "No stops yet" : `${stops.length} stop${stops.length > 1 ? "s" : ""}`}
            </Text>
            {isLargeRoute ? (
              <View style={styles.clusteredChip}>
                <Layers color={colors.primaryDark} size={12} />
                <Text style={styles.clusteredChipText}>Clustered</Text>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => setShowSearch(true)}
            style={styles.peekSearchButton}
          >
            <Search color={colors.primary} size={20} />
          </Pressable>
        </View>

        {/* Sheet content — scrollable */}
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Store card */}
          <Pressable
            style={styles.storeCard}
            onPress={() => mapRef.current?.focusLocation(activeStore.lat, activeStore.lng)}
            accessibilityLabel={`Focus map on ${activeStore.label}`}
          >
            <View style={styles.storeIcon}>
              <Store color={colors.primaryDark} size={20} />
            </View>
            <View style={styles.storeCopy}>
              <Text style={styles.cardTitle}>{displayStoreName}</Text>
              <Text style={styles.cardSubtitle}>{activeStore.address}</Text>
            </View>
          </Pressable>

          {/* Search / add stop box */}
          <Pressable
            style={styles.searchBox}
            onPress={() => setShowSearch(true)}
          >
            <Search color={colors.muted} size={20} />
            <Text style={styles.searchText}>Add delivery stop</Text>
            <Plus color={colors.primary} size={20} />
          </Pressable>

          {/* Stop preview rows */}
          {stops.length > 0 ? (
            <View style={styles.stopList}>
              {stops.slice(0, 4).map((stop, index) => (
                <Animated.View
                  key={stop.id}
                  entering={FadeInDown.duration(250)}
                  exiting={FadeOutLeft.duration(200)}
                  layout={LinearTransition.springify()}
                >
                  <Pressable
                    style={styles.stopRow}
                    onPress={() => mapRef.current?.focusLocation(stop.lat, stop.lng)}
                    accessibilityLabel={`Focus map on ${stop.label}`}
                  >
                    <View style={styles.stopNumber}>
                      <Text style={styles.stopNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stopCopy}>
                      <Text style={styles.stopLabel}>{stop.label}</Text>
                      <Text numberOfLines={1} style={styles.stopAddress}>
                        {stop.address}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeStop(stop.id)}
                      hitSlop={8}
                      accessibilityLabel={`Remove ${stop.label}`}
                      style={styles.deleteButton}
                    >
                      <Trash2 color={colors.danger} size={16} />
                    </Pressable>
                  </Pressable>
                </Animated.View>
              ))}
              {/* Reorder / view all link */}
              <Animated.View layout={LinearTransition.springify()}>
                <Pressable onPress={() => setShowStopList(true)} style={styles.viewAllRow}>
                  <Text style={styles.moreStopsText}>
                    {stops.length > 4
                      ? `+${stops.length - 4} more · Tap to reorder`
                      : "Tap to reorder stops"}
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          ) : null}

          {/* Optimize mode selector */}
          <View>
            <View
              style={styles.modeSegmented}
              onLayout={(e) => setModeSegmentWidth(e.nativeEvent.layout.width / 2)}
            >
              {modeSegmentWidth > 0 && (
                <Animated.View
                  style={[
                    styles.modeSegmentThumb,
                    { width: modeSegmentWidth },
                    modeThumbStyle,
                  ]}
                />
              )}
              <Pressable
                style={styles.modeSegment}
                onPress={() => setOptimizeMode("distance")}
              >
                <Text
                  style={[
                    styles.modeSegmentText,
                    optimizeMode === "distance"
                      ? styles.modeSegmentTextActive
                      : styles.modeSegmentTextInactive,
                  ]}
                >
                  Shortest
                </Text>
              </Pressable>
              <Pressable
                style={styles.modeSegment}
                disabled={isLargeRoute}
                onPress={() => !isLargeRoute && setOptimizeMode("time")}
              >
                <Text
                  style={[
                    styles.modeSegmentText,
                    optimizeMode === "time" && !isLargeRoute
                      ? styles.modeSegmentTextActive
                      : styles.modeSegmentTextInactive,
                    isLargeRoute && styles.modeSegmentTextDisabled,
                  ]}
                >
                  Fastest in traffic
                </Text>
                {isLargeRoute ? (
                  <Text style={styles.modeSegmentCap}>Up to 10 stops</Text>
                ) : null}
              </Pressable>
            </View>
          </View>

          {/* Optimize CTA — the only solid-primary button in the sheet */}
          <PrimaryButton
            disabled={stops.length === 0}
            icon={
              <Route
                color={stops.length === 0 ? colors.muted : colors.textOnPrimary}
                size={20}
              />
            }
            onPress={() => rootNav.navigate("Loading")}
          >
            Optimize route
          </PrimaryButton>

          {/* Demo route link — only shown when there are no stops */}
          {stops.length === 0 ? (
            <Pressable onPress={loadDemoRoute} style={styles.demoLink}>
              <Text style={styles.demoLinkText}>or try a demo route</Text>
            </Pressable>
          ) : null}
        </BottomSheetScrollView>
      </AppBottomSheet>

      <StopListModal
        visible={showStopList}
        onClose={() => setShowStopList(false)}
      />
      <PlacesSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onPlaceSelected={handlePlaceSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardSubtitle: {
    ...type.body,
    color: colors.muted,
    marginTop: 2,
  },
  cardTitle: {
    ...type.heading,
    color: colors.text,
  },
  clusteredChip: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  clusteredChipText: {
    ...type.caption,
    color: colors.primaryDark,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  deleteButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  demoLink: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  demoLinkText: {
    ...type.label,
    color: colors.primary,
  },
  mapArea: {
    backgroundColor: "#e6eeeb",
    flex: 1,
    overflow: "hidden",
  },
  moreStopsText: {
    ...type.label,
    color: colors.primary,
    textAlign: "center",
  },
  viewAllRow: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  peekBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  peekLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  peekSearchButton: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  peekStopCount: {
    ...type.heading,
    color: colors.text,
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
    ...type.body,
    color: colors.muted,
    flex: 1,
  },
  sheetContent: {
    gap: spacing.lg,
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  stopAddress: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
  stopCopy: {
    flex: 1,
  },
  stopLabel: {
    ...type.label,
    color: colors.text,
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
    ...type.caption,
    color: colors.primaryDark,
  },
  stopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
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
  modeSegmented: {
    flexDirection: "row",
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    padding: 3,
    position: "relative",
    overflow: "hidden",
  },
  modeSegmentThumb: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    backgroundColor: colors.card,
    borderRadius: radius.sm - 1,
  },
  modeSegment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    zIndex: 1,
  },
  modeSegmentText: {
    ...type.label,
    textAlign: "center",
  },
  modeSegmentTextActive: {
    color: colors.text,
  },
  modeSegmentTextInactive: {
    color: colors.muted,
  },
  modeSegmentTextDisabled: {
    color: colors.muted,
    opacity: 0.5,
  },
  modeSegmentCap: {
    ...type.caption,
    color: colors.muted,
    opacity: 0.6,
    marginTop: 1,
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
});
