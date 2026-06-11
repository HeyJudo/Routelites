import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Bookmark, ChevronLeft, Info, Play, Store } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import MapView, { Marker, Polyline } from "react-native-maps";
import BottomSheet from "@gorhom/bottom-sheet";

import { AlgorithmDetailsModal } from "../components/AlgorithmDetailsModal";
import { AppBottomSheet, BottomSheetScrollView } from "../components/AppBottomSheet";
import { MapToast } from "../components/MapToast";
import { PrimaryButton } from "../components/PrimaryButton";
import { metroManilaRegion } from "../data/demoRoute";
import { mapStyle } from "../data/mapStyle";
import { colors, font, motion, radius, shadow, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { createRoute } from "../api/savedRoutes";
import { useDeliveryRunStore } from "../state/deliveryRunStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import type { RouteLeg } from "../types/api";

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, "Results">;
type ViewMode = "optimized" | "naive" | "compare";

// ── Helpers ───────────────────────────────────────────────────────────────────

function legsToCoords(legs: RouteLeg[]) {
  return legs.flatMap((leg) =>
    leg.path.map((p) => ({ latitude: p.lat, longitude: p.lng })),
  );
}

/** Quadratic ease-in-out, t in [0,1] */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── AnimatedNumber ─────────────────────────────────────────────────────────────
// Standard Reanimated number-ticker using Animated.createAnimatedComponent(TextInput).
// TextInput is used because its `text` prop is animatable on the UI thread via
// useAnimatedProps, giving a true JS-thread-free count-up effect.

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type AnimatedNumberProps = {
  target: number;
  // Formatting is declarative (decimals + suffix) rather than a function prop:
  // a plain JS function captured in useAnimatedProps is not callable on the UI thread.
  decimals: number;
  suffix: string;
  style?: object | object[];
};

function AnimatedNumber({ target, decimals, suffix, style }: AnimatedNumberProps) {
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withTiming(target, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [target]);

  const animatedProps = useAnimatedProps(() => {
    const text = sv.value.toFixed(decimals) + suffix;
    return { text, defaultValue: text };
  });

  return (
    <AnimatedTextInput
      animatedProps={animatedProps}
      editable={false}
      // @ts-ignore pointerEvents is valid on TextInput for RN
      pointerEvents="none"
      style={[styles.animatedNumberBase, style]}
      underlineColorAndroid="transparent"
      caretHidden
    />
  );
}

// ── ResultsScreen ──────────────────────────────────────────────────────────────

export function ResultsScreen({ navigation, route }: ResultsScreenProps) {
  const { response } = route.params;
  const { height: windowHeight } = useWindowDimensions();

  const [mode, setMode]               = useState<ViewMode>("optimized");
  const [showDetails, setShowDetails] = useState(false);
  const [startingRun, setStartingRun] = useState(false);

  // Toast
  const [toastMsg, setToastMsg]         = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Save route modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [routeNameDraft, setRouteNameDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // Segmented control
  const [segmentContainerWidth, setSegmentContainerWidth] = useState(0);
  const segmentIndex = mode === "optimized" ? 0 : mode === "naive" ? 1 : 2;
  const thumbTranslateX = useSharedValue(0);

  // Marker tracksViewChanges
  const [trackMarkers, setTrackMarkers] = useState(true);

  const sheetRef = useRef<BottomSheet>(null);

  // ── Route data ────────────────────────────────────────────────────────────
  const optimizedCoords = legsToCoords(response.optimized_route.legs);
  const naiveCoords     = legsToCoords(response.naive_route.legs);
  const activeRoute =
    mode === "naive" ? response.naive_route : response.optimized_route;

  const depotId: string = response.optimized_route.order[0];

  const mapRef = useRef<MapView>(null);
  const mapEdgePaddingBottom = windowHeight * 0.45 + 20;

  // ── Polyline draw-on ──────────────────────────────────────────────────────
  // drawProgress advances 0→1 via a requestAnimationFrame loop over DRAW_DURATION ms.
  // On mode change the previous loop is cancelled and a new one starts from 0.
  // The naive/gray dashed line in compare mode renders instantly (no draw-on).
  const DRAW_DURATION = 900;
  const [drawProgress, setDrawProgress] = useState(0);
  const rafRef       = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const drawStartRef = useRef<number | null>(null);

  const startDrawOn = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    drawStartRef.current = null;
    setDrawProgress(0);

    const tick = (timestamp: number) => {
      if (drawStartRef.current === null) drawStartRef.current = timestamp;
      const elapsed = timestamp - drawStartRef.current;
      const rawT    = Math.min(elapsed / DRAW_DURATION, 1);
      setDrawProgress(easeInOut(rawT));
      if (rawT < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    startDrawOn();
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mode]);

  // ── Map fit ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const coords = mode === "naive" ? naiveCoords : optimizedCoords;
    if (coords.length > 0) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 40, bottom: mapEdgePaddingBottom, left: 40 },
        animated: true,
      });
    }
  }, [mode]);

  // ── Marker tracksViewChanges cleanup ─────────────────────────────────────
  const stopCount = activeRoute.order.filter((id: string) => id !== depotId).length;

  useEffect(() => {
    const totalMarkers = stopCount + 1; // stops + depot
    const timer = setTimeout(
      () => setTrackMarkers(false),
      totalMarkers * 40 + 400,
    );
    return () => clearTimeout(timer);
  }, [stopCount]);

  // ── Segmented control sliding thumb ──────────────────────────────────────
  const segmentWidth = segmentContainerWidth > 0 ? segmentContainerWidth / 3 : 0;

  useEffect(() => {
    if (segmentWidth > 0) {
      thumbTranslateX.value = withSpring(segmentIndex * segmentWidth, motion.spring);
    }
  }, [segmentIndex, segmentWidth]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const nameFor = (id: string): string => {
    const info = response.places?.[id];
    if (info?.label) return info.label;
    if (id === depotId) return "Store (Depot)";
    return id.replace(/_/g, " ");
  };
  const addressFor = (id: string): string =>
    response.places?.[id]?.address ?? "";

  const storeLat = response.optimized_route.legs[0]?.path[0]?.lat;
  const storeLng = response.optimized_route.legs[0]?.path[0]?.lng;

  const totalKm   = (activeRoute.total_distance_m / 1000).toFixed(1);
  const optimizedKm = response.optimized_route.total_distance_m / 1000;
  const naiveKm     = response.naive_route.total_distance_m / 1000;
  const savingsPct  = response.savings.percentage;

  // ── Coords with draw-on applied ───────────────────────────────────────────
  function sliceCoords(coords: { latitude: number; longitude: number }[]) {
    if (coords.length === 0) return coords;
    const count = Math.max(1, Math.ceil(coords.length * drawProgress));
    return coords.slice(0, count);
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  // ── Start route handler ───────────────────────────────────────────────────
  const handleStartRoute = async () => {
    const order    = response.optimized_route.order;
    const depotIdx = order[0];
    const stopIds  = order.filter((id: string) => id !== depotIdx);

    const stops = stopIds.map((id: string) => {
      const leg  = response.optimized_route.legs.find((l: RouteLeg) => l.to === id);
      const last = leg ? leg.path[leg.path.length - 1] : null;
      return {
        label:   nameFor(id),
        address: addressFor(id),
        lat: last?.lat ?? 0,
        lng: last?.lng ?? 0,
      };
    });

    if (stops.length === 0) return;

    setStartingRun(true);
    try {
      await useDeliveryRunStore.getState().startRun({
        optimizedOrder:  order,
        totalDistanceM:  response.optimized_route.total_distance_m,
        stops,
      });
      const newRun = useDeliveryRunStore.getState().activeRun;
      if (newRun) navigation.navigate("ActiveDelivery", { runId: newRun.id });
    } catch (err) {
      console.warn("[ResultsScreen] startRun failed:", err);
    } finally {
      setStartingRun(false);
    }
  };

  // ── Save route handler ────────────────────────────────────────────────────
  const handleSaveRoute = async () => {
    const { storeLocation, stops } = useRouteDraftStore.getState();
    if (!storeLocation || stops.length === 0) {
      showToast("Add stops to your route first.");
      return;
    }
    setSaving(true);
    try {
      await createRoute(routeNameDraft.trim() || "My Route", storeLocation, stops);
      setShowSaveModal(false);
      setRouteNameDraft("");
      showToast("Saved to My Routes");
    } catch {
      showToast("Could not save route");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        customMapStyle={mapStyle}
        initialRegion={metroManilaRegion}
        showsCompass={false}
        showsMyLocationButton={false}
        style={StyleSheet.absoluteFill}
      >
        {/* Naive dashed line — in compare mode renders instantly (no draw-on for gray line) */}
        {(mode === "naive" || mode === "compare") && (
          <Polyline
            coordinates={mode === "compare" ? naiveCoords : sliceCoords(naiveCoords)}
            strokeColor="#9e9e9e"
            strokeWidth={3}
            lineDashPattern={[8, 6]}
            zIndex={1}
          />
        )}

        {/* Optimized line — draw-on applies */}
        {(mode === "optimized" || mode === "compare") && (
          <Polyline
            coordinates={sliceCoords(optimizedCoords)}
            strokeColor={colors.primary}
            strokeWidth={4}
            zIndex={2}
          />
        )}

        {/* Depot marker — stagger index 0 */}
        {storeLat != null && storeLng != null && (
          <Marker
            key="depot-marker"
            coordinate={{ latitude: storeLat, longitude: storeLng }}
            title={nameFor(depotId)}
            tracksViewChanges={trackMarkers}
            zIndex={10}
          >
            <Animated.View entering={ZoomIn.delay(0).duration(200)}>
              <View style={styles.storeMarker}>
                <Store color={colors.textOnPrimary} size={16} />
              </View>
            </Animated.View>
          </Marker>
        )}

        {/* Stop markers — staggered ZoomIn, 40 ms apart */}
        {(mode === "compare"
          ? [response.optimized_route, response.naive_route]
          : [activeRoute]
        ).flatMap((r, routeIdx) => {
          let n = 0;
          return r.order
            .filter((id: string) => id !== depotId)
            .map((id: string, stopIdx: number) => {
              n += 1;
              const leg = r.legs.find((l: RouteLeg) => l.to === id);
              if (!leg) return null;
              const last     = leg.path[leg.path.length - 1];
              const delayMs  = (stopIdx + 1) * 40; // depot=0ms, stop 1=40ms, …
              return (
                <Marker
                  key={`marker-${routeIdx}-${id}`}
                  coordinate={{ latitude: last.lat, longitude: last.lng }}
                  title={nameFor(id)}
                  tracksViewChanges={trackMarkers}
                  zIndex={5}
                >
                  <Animated.View entering={ZoomIn.delay(delayMs).duration(200)}>
                    <View style={styles.stopMarker}>
                      <Text style={styles.stopMarkerText}>{n}</Text>
                    </View>
                  </Animated.View>
                </Marker>
              );
            });
        })}
      </MapView>

      {/* Back button */}
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Back to planner"
      >
        <ChevronLeft color={colors.primaryDark} size={24} />
      </Pressable>

      {/* Toast — absolute, over map */}
      <MapToast
        message={toastMsg}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />

      {/* ── Bottom sheet ──────────────────────────────────────────────────── */}
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["45%", "88%"]}
        index={0}
      >
        {/* Info button — right-aligned, opens algorithm details */}
        <View style={styles.statsHeaderRow}>
          <Pressable
            onPress={() => setShowDetails(true)}
            style={styles.infoButton}
            accessibilityLabel="Algorithm details"
          >
            <Info color={colors.muted} size={20} />
          </Pressable>
        </View>

        {/* Hero stats row: Saved (hero, ~40% width) | Optimized | Naive */}
        <View style={styles.statsRow}>
          {/* Hero: Saved */}
          <View style={[styles.statCard, styles.heroCard]}>
            <AnimatedNumber
              target={savingsPct}
              decimals={1}
              suffix="%"
              style={[type.title, { color: colors.delivered }]}
            />
            <Text style={[type.caption, styles.statLabel]}>Saved</Text>
          </View>

          {/* Optimized */}
          <View style={[styles.statCard, styles.optimizedCard]}>
            <AnimatedNumber
              target={optimizedKm}
              decimals={2}
              suffix=" km"
              style={[type.heading, { color: colors.text }]}
            />
            <Text style={[type.caption, styles.statLabel]}>Optimized</Text>
          </View>

          {/* Naive */}
          <View style={styles.statCard}>
            <AnimatedNumber
              target={naiveKm}
              decimals={2}
              suffix=" km"
              style={[type.heading, { color: colors.text }]}
            />
            <Text style={[type.caption, styles.statLabel]}>Naive</Text>
          </View>
        </View>

        {/* Buttons row: Start (flex 2) + Save (flex 1) */}
        <View style={styles.buttonsRow}>
          <View style={{ flex: 2 }}>
            <PrimaryButton
              onPress={handleStartRoute}
              disabled={stopCount === 0}
              loading={startingRun}
              icon={<Play color={colors.textOnPrimary} size={16} />}
            >
              Start route
            </PrimaryButton>
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              variant="outline"
              onPress={() => {
                setRouteNameDraft("");
                setShowSaveModal(true);
              }}
              disabled={stopCount === 0}
              icon={<Bookmark color={colors.primaryDark} size={16} />}
            >
              Save
            </PrimaryButton>
          </View>
        </View>

        {/* Segmented control with sliding thumb */}
        <View
          style={[styles.segmented, { marginTop: spacing.sm }]}
          onLayout={(e) => setSegmentContainerWidth(e.nativeEvent.layout.width)}
        >
          {/* Sliding thumb — only rendered once we have a measured width */}
          {segmentContainerWidth > 0 && (
            <Animated.View
              style={[
                styles.segmentThumb,
                { width: segmentWidth, transform: [{ translateX: thumbTranslateX }] },
              ]}
            />
          )}

          {(["optimized", "naive", "compare"] as ViewMode[]).map((m) => {
            const isActive = mode === m;
            return (
              <Pressable
                key={m}
                style={styles.segment}
                onPress={() => {
                  setMode(m);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isActive ? styles.segmentTextActive : styles.segmentTextInactive,
                  ]}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Stop list header */}
        <View style={styles.stopListHeader}>
          <Text style={[type.label, { color: colors.muted }]}>
            {stopCount} stop{stopCount !== 1 ? "s" : ""} · {totalKm} km total
          </Text>
        </View>

        {/* Stop rows — scrollable */}
        <BottomSheetScrollView
          style={styles.stopList}
          contentContainerStyle={styles.stopListContent}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            let stopNum = 0;
            return activeRoute.order.map((id: string, i: number) => {
              const isDepot  = id === depotId;
              const isReturn = isDepot && i > 0;
              if (!isDepot) stopNum += 1;
              const leg  = i < activeRoute.legs.length ? activeRoute.legs[i] : null;
              const addr = addressFor(id);

              return (
                <View
                  key={`${id}-${i}`}
                  style={[
                    styles.stopRow,
                    i === activeRoute.order.length - 1 && styles.stopRowLast,
                  ]}
                >
                  <View style={[styles.stopBadge, isDepot && styles.storeBadge]}>
                    {isDepot ? (
                      <Store color={colors.card} size={12} />
                    ) : (
                      <Text style={styles.stopBadgeText}>{stopNum}</Text>
                    )}
                  </View>

                  <View style={styles.stopInfo}>
                    <Text style={[type.label, styles.stopName]} numberOfLines={1}>
                      {isReturn ? "Return to store" : nameFor(id)}
                    </Text>
                    {!isReturn && addr ? (
                      <Text style={[type.caption, styles.stopAddress]} numberOfLines={1}>
                        {addr}
                      </Text>
                    ) : null}
                  </View>

                  {leg ? (
                    <Text style={[type.caption, styles.legDist]}>
                      {(leg.distance_m / 1000).toFixed(1)} km
                    </Text>
                  ) : null}
                </View>
              );
            });
          })()}
        </BottomSheetScrollView>
      </AppBottomSheet>

      <AlgorithmDetailsModal
        metadata={response.metadata}
        visible={showDetails}
        onClose={() => setShowDetails(false)}
      />

      {/* Save route modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={saveModalStyles.overlay}
        >
          <View style={saveModalStyles.card}>
            <Text style={saveModalStyles.modalTitle}>Save route</Text>
            <TextInput
              style={saveModalStyles.input}
              placeholder="Route name (e.g. Morning run)"
              placeholderTextColor={colors.muted}
              value={routeNameDraft}
              onChangeText={setRouteNameDraft}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveRoute}
              selectionColor={colors.primary}
            />
            <View style={saveModalStyles.actions}>
              <Pressable
                style={[saveModalStyles.btn, saveModalStyles.btnCancel]}
                onPress={() => setShowSaveModal(false)}
                disabled={saving}
              >
                <Text style={saveModalStyles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  saveModalStyles.btn,
                  saveModalStyles.btnConfirm,
                  saving && saveModalStyles.btnDisabled,
                ]}
                onPress={handleSaveRoute}
                disabled={saving}
              >
                <Text style={saveModalStyles.btnConfirmText}>
                  {saving ? "Saving…" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Back button
  backButton: {
    position: "absolute",
    top: 50,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    ...shadow.sm,
  },

  // Stats header (info button right-aligned)
  statsHeaderRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.mutedSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  // Stats row: hero Saved card first, then Optimized, Naive
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  // Hero card: ~40% — achieved via flex: 1.4 relative to the two flex:1 cards
  heroCard: {
    flex: 1.4,
    backgroundColor: colors.deliveredSoft,
    borderColor: colors.delivered,
  },
  // Optimized card: subtle primary border
  optimizedCard: {
    borderColor: colors.primary,
  },
  statLabel: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  // Base style for AnimatedNumber (transparent bg, no padding, center-aligned)
  animatedNumberBase: {
    backgroundColor: "transparent",
    padding: 0,
    margin: 0,
    color: colors.text,
    textAlign: "center",
  },

  // Buttons row: Start (flex 2) + Save (flex 1)
  buttonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },

  // Segmented control
  segmented: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    padding: 3,
    position: "relative",
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  // Sliding thumb — absolutely positioned, translated via Reanimated withSpring
  segmentThumb: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    backgroundColor: colors.card,
    borderRadius: radius.sm - 1,
    ...shadow.sm,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    zIndex: 1,
  },
  segmentText: {
    ...type.label,
    textAlign: "center",
  },
  segmentTextActive: {
    color: colors.text,
  },
  segmentTextInactive: {
    color: colors.muted,
  },

  // Stop list
  stopListHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  stopList: {
    flex: 1,
  },
  stopListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  stopRowLast: {
    borderBottomWidth: 0,
  },
  stopBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  storeBadge: {
    backgroundColor: colors.primaryDark,
  },
  stopBadgeText: {
    ...type.caption,
    color: colors.textOnPrimary,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    color: colors.text,
  },
  stopAddress: {
    color: colors.muted,
    marginTop: 1,
  },
  legDist: {
    color: colors.muted,
    minWidth: 44,
    textAlign: "right",
  },

  // Map markers
  storeMarker: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 40,
    justifyContent: "center",
    width: 40,
    ...shadow.md,
  },
  storeMarkerText: {
    ...type.heading,
    fontFamily: font.heavy,
    color: colors.textOnPrimary,
  },
  stopMarker: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.card,
  },
  stopMarkerText: {
    ...type.caption,
    fontFamily: font.heavy,
    color: colors.textOnPrimary,
  },
});

const saveModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow.md,
  },
  modalTitle: {
    ...type.title,
    color: colors.text,
  },
  input: {
    ...type.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.mutedSoft,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: colors.mutedSoft,
  },
  btnConfirm: {
    backgroundColor: colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnCancelText: {
    ...type.label,
    color: colors.muted,
  },
  btnConfirmText: {
    ...type.label,
    color: colors.textOnPrimary,
  },
});
