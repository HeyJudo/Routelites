import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Navigation,
  Store,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import BottomSheet from "@gorhom/bottom-sheet";

import { StopRow } from "../components/StopRow";
import { PrimaryButton } from "../components/PrimaryButton";
import { AppBottomSheet, BottomSheetScrollView } from "../components/AppBottomSheet";
import type { RootStackParamList } from "../navigation/types";
import { useDeliveryRunStore, useActiveRun } from "../state/deliveryRunStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, font, motion, radius, shadow, spacing, type } from "../theme";
import { mapStyle } from "../data/mapStyle";
import type { ActiveDeliveryStop } from "../types/delivery";
import { openNavigation } from "../utils/navigationLinks";

type ActiveDeliveryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ActiveDelivery"
>;

// ─── AnimatedStopMarker ───────────────────────────────────────────────────────
// tracksViewChanges strategy: keep true ONLY while animating (~400 ms after a
// status change), then flip to false to avoid constant Android re-rasterization.

type AnimatedStopMarkerProps = {
  stop: ActiveDeliveryStop;
  index: number;
  isNext: boolean;
  isAnimating: boolean;
};

function AnimatedStopMarker({
  stop,
  index,
  isNext,
  isAnimating,
}: AnimatedStopMarkerProps) {
  const scale = useSharedValue(1);
  const prevStatusRef = useRef(stop.status);
  const prevIsNextRef = useRef(isNext);

  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = stop.status;

    if (prev === "pending" && (curr === "delivered" || curr === "failed")) {
      // Status-change pop: 1 → 1.3 → 1, ~300 ms
      scale.value = withSequence(
        withSpring(1.3, { damping: 5, stiffness: 280, mass: 0.5 }),
        withTiming(1, { duration: 160 }),
      );
    }

    prevStatusRef.current = curr;
  }, [stop.status]);

  useEffect(() => {
    const prevIsNext = prevIsNextRef.current;
    if (!prevIsNext && isNext) {
      // Gentle pulse when stop BECOMES the next stop: 1 → 1.15 → 1
      scale.value = withSequence(
        withSpring(1.15, { damping: 8, stiffness: 200, mass: 0.6 }),
        withTiming(1, { duration: 200 }),
      );
    }
    prevIsNextRef.current = isNext;
  }, [isNext]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDone =
    stop.status === "delivered" || stop.status === "failed";
  const bgColor =
    stop.status === "delivered"
      ? colors.delivered
      : stop.status === "failed"
      ? colors.danger
      : isNext
      ? colors.primaryDark
      : colors.primary;

  return (
    <Marker
      coordinate={{ latitude: stop.lat, longitude: stop.lng }}
      title={stop.label}
      zIndex={isNext ? 8 : 5}
      tracksViewChanges={isAnimating}
    >
      <Animated.View style={animStyle}>
        <View
          style={[
            markerStyles.stopMarker,
            { backgroundColor: bgColor },
            isNext && !isDone && markerStyles.stopMarkerNext,
          ]}
        >
          <Text
            style={[
              markerStyles.stopMarkerText,
              isNext && !isDone && markerStyles.stopMarkerTextNext,
            ]}
          >
            {index}
          </Text>
        </View>
      </Animated.View>
    </Marker>
  );
}

const markerStyles = StyleSheet.create({
  stopMarker: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
    ...shadow.sm,
  },
  stopMarkerNext: {
    borderWidth: 3,
    height: 34,
    width: 34,
  },
  stopMarkerText: {
    ...type.caption,
    color: colors.textOnPrimary,
    fontFamily: font.heavy,
  },
  stopMarkerTextNext: {
    ...type.label,
  },
});

// ─── Sub-component: Stop detail action card ───────────────────────────────────

type StopActionCardProps = {
  stop: ActiveDeliveryStop;
  onNavigate: () => void;
  onDeliver: (note?: string) => void;
  onFail: (note?: string) => void;
};

function StopActionCard({ stop, onNavigate, onDeliver, onFail }: StopActionCardProps) {
  const [note, setNote] = useState("");

  return (
    <Animated.View
      entering={FadeInDown.duration(motion.fast)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition.springify()}
      style={cardStyles.card}
    >
      <Text style={cardStyles.label} numberOfLines={1}>
        {stop.label}
      </Text>
      {stop.address ? (
        <Text style={cardStyles.address} numberOfLines={2}>
          {stop.address}
        </Text>
      ) : null}

      <TextInput
        style={cardStyles.noteInput}
        placeholder="Add a note (optional)"
        placeholderTextColor={colors.muted}
        value={note}
        onChangeText={setNote}
        returnKeyType="done"
      />

      {/* Button order: Navigate | Failed | Delivered */}
      <View style={cardStyles.actions}>
        {/* Navigate — outline */}
        <Pressable
          style={[cardStyles.btn, cardStyles.btnNavigate]}
          onPress={onNavigate}
          accessibilityLabel="Navigate to stop"
        >
          <Navigation color={colors.primary} size={14} />
          <Text style={[cardStyles.btnText, cardStyles.btnTextNavigate]}>Navigate</Text>
        </Pressable>

        {/* Failed — soft danger */}
        <Pressable
          style={[cardStyles.btn, cardStyles.btnDanger]}
          onPress={() => onFail(note || undefined)}
          accessibilityLabel="Mark as failed"
        >
          <X color={colors.danger} size={14} />
          <Text style={[cardStyles.btnText, cardStyles.btnTextDanger]}>Failed</Text>
        </Pressable>

        {/* Delivered — solid delivered (heaviest) */}
        <Pressable
          style={[cardStyles.btn, cardStyles.btnDelivered]}
          onPress={() => onDeliver(note || undefined)}
          accessibilityLabel="Mark as delivered"
        >
          <Check color={colors.textOnPrimary} size={14} />
          <Text style={[cardStyles.btnText, cardStyles.btnTextDelivered]}>Delivered</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  address: {
    ...type.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  btn: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    paddingVertical: 10,
  },
  btnDanger: {
    backgroundColor: colors.dangerSoft,
  },
  btnDelivered: {
    backgroundColor: colors.delivered,
  },
  btnNavigate: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  btnText: {
    ...type.label,
  },
  btnTextDanger: {
    color: colors.danger,
  },
  btnTextDelivered: {
    color: colors.textOnPrimary,
  },
  btnTextNavigate: {
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginHorizontal: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.md,
  },
  label: {
    ...type.body,
    color: colors.text,
    marginBottom: 4,
  },
  noteInput: {
    ...type.caption,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
});

// ─── Summary overlay ──────────────────────────────────────────────────────────

type SummaryProps = {
  delivered: number;
  failed: number;
  totalDistanceM: number;
  startedAt?: string | null;
  onDone: (clearDraft: boolean) => void;
};

function SummaryOverlay({
  delivered,
  failed,
  totalDistanceM,
  startedAt,
  onDone,
}: SummaryProps) {
  const [clearDraft, setClearDraft] = useState(true);

  // Elapsed time: startedAt is an ISO string in ActiveDeliveryRun
  let elapsedLabel: string | null = null;
  if (startedAt) {
    const startMs = new Date(startedAt).getTime();
    const nowMs = Date.now();
    const diffMin = Math.round((nowMs - startMs) / 60000);
    elapsedLabel = `${diffMin} min`;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={summaryStyles.overlay}
    >
      <Animated.View entering={ZoomIn.duration(350)} style={summaryStyles.card}>
        {/* Icon above title */}
        <CheckCircle2
          color={colors.delivered}
          size={40}
          style={summaryStyles.icon}
        />
        <Text style={summaryStyles.title}>Run complete</Text>

        <View style={summaryStyles.stats}>
          <View style={summaryStyles.stat}>
            <Text style={summaryStyles.statValue}>{delivered}</Text>
            <Text style={summaryStyles.statLabel}>Delivered</Text>
          </View>
          {failed > 0 ? (
            <View style={summaryStyles.stat}>
              <Text style={[summaryStyles.statValue, summaryStyles.statFailed]}>
                {failed}
              </Text>
              <Text style={summaryStyles.statLabel}>Failed</Text>
            </View>
          ) : null}
          <View style={summaryStyles.stat}>
            <Text style={summaryStyles.statValue}>
              {(totalDistanceM / 1000).toFixed(1)} km
            </Text>
            <Text style={summaryStyles.statLabel}>Route dist.</Text>
          </View>
          {elapsedLabel ? (
            <View style={summaryStyles.stat}>
              <Text style={summaryStyles.statValue}>{elapsedLabel}</Text>
              <Text style={summaryStyles.statLabel}>Elapsed</Text>
            </View>
          ) : null}
        </View>

        {/* Clear planned stops toggle */}
        <Pressable
          style={summaryStyles.clearToggleRow}
          onPress={() => setClearDraft((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: clearDraft }}
        >
          <View
            style={[
              summaryStyles.checkbox,
              clearDraft && summaryStyles.checkboxChecked,
            ]}
          >
            {clearDraft && <Check color={colors.textOnPrimary} size={14} />}
          </View>
          <Text style={summaryStyles.clearToggleLabel}>Clear planned stops</Text>
        </Pressable>

        <PrimaryButton onPress={() => onDone(clearDraft)}>Done</PrimaryButton>
      </Animated.View>
    </Animated.View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    margin: spacing.xl,
    padding: spacing.xl,
    width: "85%",
    ...shadow.lg,
  },
  icon: {
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: colors.overlay,
    justifyContent: "center",
    zIndex: 50,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statFailed: {
    color: colors.danger,
  },
  statLabel: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
  statValue: {
    ...type.title,
    color: colors.text,
  },
  stats: {
    flexDirection: "row",
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.text,
    textAlign: "center",
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  clearToggleLabel: {
    ...type.label,
    color: colors.text,
  },
  clearToggleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
});

// ─── Animated progress bar ────────────────────────────────────────────────────

type ProgressBarProps = { doneRatio: number };

function ProgressBar({ doneRatio }: ProgressBarProps) {
  const progress = useSharedValue(doneRatio);

  useEffect(() => {
    progress.value = withSpring(doneRatio, motion.spring);
  }, [doneRatio]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
  }));

  return (
    <View style={styles.progressBarBg}>
      <Animated.View style={[styles.progressBarFill, fillStyle]} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ActiveDeliveryScreen({ navigation }: ActiveDeliveryScreenProps) {
  const activeRun = useActiveRun();
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);
  const { updateStopStatus, completeRun, clearRun } = useDeliveryRunStore.getState();
  const { height: windowHeight } = useWindowDimensions();

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  // Track which stop markers are currently animating for tracksViewChanges
  const [animatingMarkerIds, setAnimatingMarkerIds] = useState<Set<string>>(
    new Set(),
  );

  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const mapEdgePaddingBottom = windowHeight * 0.45 + 20;

  // ── fitToCoordinates on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeRun) return;
    const coords = activeRun.stops.map((s) => ({
      latitude: s.lat,
      longitude: s.lng,
    }));
    if (storeLocation) {
      coords.push({ latitude: storeLocation.lat, longitude: storeLocation.lng });
    }
    if (coords.length > 0) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 40, bottom: mapEdgePaddingBottom, left: 40 },
        animated: true,
      });
    }
  }, []);

  // ── Auto-complete when all stops are resolved ─────────────────────────────
  useEffect(() => {
    if (!activeRun || activeRun.status !== "active") return;
    const allDone = activeRun.stops.every(
      (s) => s.status === "delivered" || s.status === "failed",
    );
    if (allDone && activeRun.stops.length > 0) {
      completeRun();
    }
  }, [activeRun?.stops]);

  // ── Empty / null guard ────────────────────────────────────────────────────
  if (!activeRun) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active delivery run.</Text>
        <PrimaryButton
          variant="secondary"
          onPress={() => navigation.navigate("MainTabs")}
        >
          Back
        </PrimaryButton>
      </View>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const stops = activeRun.stops;

  // Reorder: pending first (in optimizedOrder), then done
  const pendingStops = stops.filter((s) => s.status === "pending");
  const doneStops = stops.filter(
    (s) => s.status === "delivered" || s.status === "failed",
  );

  const deliveredCount = stops.filter((s) => s.status === "delivered").length;
  const failedCount = stops.filter((s) => s.status === "failed").length;
  const totalCount = stops.length;
  const doneRatio = totalCount > 0 ? (deliveredCount + failedCount) / totalCount : 0;

  // Next pending stop for emphasis
  const nextPendingStop = pendingStops[0] ?? null;

  // Build polyline: depot → stops in optimizedOrder → depot
  const polylineCoords: { latitude: number; longitude: number }[] = [];
  if (storeLocation) {
    polylineCoords.push({ latitude: storeLocation.lat, longitude: storeLocation.lng });
  }
  stops.forEach((s) => {
    polylineCoords.push({ latitude: s.lat, longitude: s.lng });
  });
  if (storeLocation) {
    polylineCoords.push({ latitude: storeLocation.lat, longitude: storeLocation.lng });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Pulse a marker's tracksViewChanges for 400 ms then disable it. */
  const pulseMarker = (stopId: string) => {
    setAnimatingMarkerIds((prev) => new Set(prev).add(stopId));
    setTimeout(() => {
      setAnimatingMarkerIds((prev) => {
        const next = new Set(prev);
        next.delete(stopId);
        return next;
      });
    }, 400);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStopPress = (stopId: string) => {
    setSelectedStopId((prev) => (prev === stopId ? null : stopId));
  };

  const handleMarkStatus = async (
    stopId: string,
    status: "delivered" | "failed",
    note?: string,
  ) => {
    // Haptic feedback — fire-and-forget before store update
    if (status === "delivered") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // Animate the marker being acted on
    pulseMarker(stopId);

    await updateStopStatus(stopId, status, note);
    setSelectedStopId(null);

    // Camera: pan to next pending stop after marking
    const updatedStops = useDeliveryRunStore.getState().activeRun?.stops ?? [];
    const nextPending = updatedStops.find((s) => s.status === "pending");
    if (nextPending) {
      // Pulse the marker that just became next
      pulseMarker(nextPending.id);
      mapRef.current?.animateToRegion(
        {
          latitude: nextPending.lat,
          longitude: nextPending.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600,
      );
    }
  };

  const handleDone = (clearDraft: boolean) => {
    if (clearDraft) {
      useRouteDraftStore.getState().clearStops();
    }
    clearRun();
    navigation.navigate("MainTabs");
  };

  const isComplete = activeRun.status === "completed";

  return (
    <View style={styles.container}>
      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        customMapStyle={mapStyle}
        style={StyleSheet.absoluteFill}
        showsCompass={false}
        showsMyLocationButton={false}
      >
        {/* Route polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[6, 4]}
            zIndex={1}
          />
        )}

        {/* Depot marker */}
        {storeLocation && (
          <Marker
            key="depot"
            coordinate={{
              latitude: storeLocation.lat,
              longitude: storeLocation.lng,
            }}
            title={storeLocation.label ?? "Store"}
            zIndex={10}
            tracksViewChanges={false}
          >
            <View style={styles.storeMarker}>
              <Store color={colors.textOnPrimary} size={16} />
            </View>
          </Marker>
        )}

        {/* Stop markers — animated */}
        {stops.map((stop, idx) => {
          const isNext = stop.id === nextPendingStop?.id;
          const isAnimating = animatingMarkerIds.has(stop.id);

          return (
            <AnimatedStopMarker
              key={stop.id}
              stop={stop}
              index={idx + 1}
              isNext={isNext}
              isAnimating={isAnimating}
            />
          );
        })}
      </MapView>

      {/* Minimize / back button — ChevronDown (minimize semantics) */}
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.navigate("MainTabs")}
        accessibilityLabel="Minimize delivery view"
      >
        <ChevronDown color={colors.primaryDark} size={24} />
      </Pressable>

      {/* ── Bottom sheet ────────────────────────────────────────────────────── */}
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["45%", "88%"]}
        index={0}
        onChange={(i) => setIsExpanded(i === 1)}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        {/* Sheet header */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.progressText}>
              {deliveredCount}/{totalCount} delivered
            </Text>
            {failedCount > 0 ? (
              <Text style={styles.failedText}>{failedCount} failed</Text>
            ) : null}
          </View>
          {!isExpanded && (
            <Pressable onPress={() => sheetRef.current?.snapToIndex(1)}>
              <Text style={styles.expandHint}>Swipe up ↑</Text>
            </Pressable>
          )}
        </View>

        {/* Animated progress bar */}
        <ProgressBar doneRatio={doneRatio} />

        {/* Stop list */}
        <BottomSheetScrollView
          style={styles.stopList}
          contentContainerStyle={styles.stopListContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Pending stops */}
          {pendingStops.map((stop) => {
            const originalIndex = stops.indexOf(stop);
            const isSelected = selectedStopId === stop.id;
            const isNext = stop.id === nextPendingStop?.id;

            return (
              <Animated.View
                key={stop.id}
                layout={LinearTransition.springify()}
              >
                <StopRow
                  stop={stop}
                  index={originalIndex + 1}
                  isActive={isNext && !isSelected}
                  onPress={() => handleStopPress(stop.id)}
                  layout={LinearTransition.springify()}
                />
                {isSelected && (
                  <StopActionCard
                    stop={stop}
                    onNavigate={() => openNavigation(stop.lat, stop.lng, stop.label)}
                    onDeliver={(note) => handleMarkStatus(stop.id, "delivered", note)}
                    onFail={(note) => handleMarkStatus(stop.id, "failed", note)}
                  />
                )}
              </Animated.View>
            );
          })}

          {/* Separator between pending and done */}
          {doneStops.length > 0 && (
            <Animated.View
              layout={LinearTransition.springify()}
              style={styles.doneSeparator}
            >
              <View style={styles.doneSeparatorLine} />
              <View style={styles.doneSeparatorPill}>
                <Text style={styles.doneSeparatorText}>
                  {doneStops.length} done
                </Text>
              </View>
              <View style={styles.doneSeparatorLine} />
            </Animated.View>
          )}

          {/* Done stops */}
          {doneStops.map((stop) => {
            const originalIndex = stops.indexOf(stop);

            return (
              <StopRow
                key={stop.id}
                stop={stop}
                index={originalIndex + 1}
                isActive={false}
                onPress={() => {
                  /* done stops are not interactive */
                }}
                layout={LinearTransition.springify()}
              />
            );
          })}
        </BottomSheetScrollView>
      </AppBottomSheet>

      {/* ── Completion summary overlay ────────────────────────────────────── */}
      {isComplete && (
        <SummaryOverlay
          delivered={deliveredCount}
          failed={failedCount}
          totalDistanceM={activeRun.totalDistanceM}
          startedAt={activeRun.startedAt}
          onDone={handleDone}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    top: 50,
    width: 40,
    zIndex: 10,
    ...shadow.sm,
  },
  container: { flex: 1 },
  doneSeparator: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  doneSeparatorLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  doneSeparatorPill: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  doneSeparatorText: {
    ...type.caption,
    color: colors.muted,
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.xl,
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyText: {
    ...type.body,
    color: colors.muted,
    textAlign: "center",
  },
  expandHint: {
    ...type.caption,
    color: colors.primary,
  },
  failedText: {
    ...type.caption,
    color: colors.danger,
    marginTop: 2,
  },
  headerLeft: { flex: 1 },
  progressBarBg: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    overflow: "hidden",
  },
  progressBarFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 4,
  },
  progressText: {
    ...type.heading,
    color: colors.text,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  stopList: { flex: 1 },
  stopListContent: { paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
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
});
