import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Navigation } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { StopRow } from "../components/StopRow";
import { PrimaryButton } from "../components/PrimaryButton";
import type { RootStackParamList } from "../navigation/types";
import { useDeliveryRunStore, useActiveRun } from "../state/deliveryRunStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing } from "../theme";
import type { ActiveDeliveryStop } from "../types/delivery";
import { openNavigation } from "../utils/navigationLinks";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ActiveDeliveryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ActiveDelivery"
>;

const SCREEN_H = Dimensions.get("window").height;
const COLLAPSED = Math.round(SCREEN_H * 0.40);
const EXPANDED = Math.round(SCREEN_H * 0.88);
const MIDPOINT = (COLLAPSED + EXPANDED) / 2;

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
    <View style={cardStyles.card}>
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

      <View style={cardStyles.actions}>
        <Pressable
          style={[cardStyles.btn, cardStyles.btnPrimary]}
          onPress={onNavigate}
          accessibilityLabel="Navigate to stop"
        >
          <Navigation color={colors.card} size={14} />
          <Text style={[cardStyles.btnText, cardStyles.btnTextPrimary]}>Navigate</Text>
        </Pressable>

        <Pressable
          style={[cardStyles.btn, cardStyles.btnDanger]}
          onPress={() => onFail(note || undefined)}
          accessibilityLabel="Mark as failed"
        >
          <Text style={[cardStyles.btnText, cardStyles.btnTextDanger]}>Failed</Text>
        </Pressable>

        <Pressable
          style={[cardStyles.btn, cardStyles.btnSuccess]}
          onPress={() => onDeliver(note || undefined)}
          accessibilityLabel="Mark as delivered"
        >
          <Text style={[cardStyles.btnText, cardStyles.btnTextSuccess]}>Delivered</Text>
        </Pressable>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  address: {
    color: colors.muted,
    fontSize: 12,
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
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSuccess: {
    backgroundColor: colors.deliveredSoft,
  },
  btnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  btnTextDanger: {
    color: colors.danger,
  },
  btnTextPrimary: {
    color: colors.card,
  },
  btnTextSuccess: {
    color: colors.delivered,
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
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  noteInput: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: 13,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
});

// ─── Summary overlay ──────────────────────────────────────────────────────────

type SummaryProps = {
  delivered: number;
  failed: number;
  totalDistanceM: number;
  onDone: () => void;
};

function SummaryOverlay({ delivered, failed, totalDistanceM, onDone }: SummaryProps) {
  return (
    <View style={summaryStyles.overlay}>
      <View style={summaryStyles.card}>
        <Text style={summaryStyles.title}>Run Complete!</Text>
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
        </View>
        <PrimaryButton onPress={onDone}>Done</PrimaryButton>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    elevation: 16,
    margin: spacing.xl,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    width: "85%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
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
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  stats: {
    flexDirection: "row",
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ActiveDeliveryScreen({ navigation }: ActiveDeliveryScreenProps) {
  const activeRun = useActiveRun();
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);
  const { updateStopStatus, completeRun, clearRun } = useDeliveryRunStore.getState();

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const mapRef = useRef<MapView>(null);

  // ── Sheet animation (same pattern as ResultsScreen) ─────────────────────────
  const sheetAnim = useRef(new Animated.Value(COLLAPSED)).current;
  const lastHeight = useRef(COLLAPSED);

  const snapTo = (target: number) => {
    lastHeight.current = target;
    setIsExpanded(target === EXPANDED);
    Animated.spring(sheetAnim, {
      toValue: target,
      useNativeDriver: false,
      tension: 65,
      friction: 12,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 6,
      onPanResponderMove: (_, gs) => {
        const next = Math.max(
          COLLAPSED,
          Math.min(EXPANDED, lastHeight.current - gs.dy),
        );
        sheetAnim.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        const current = lastHeight.current - gs.dy;
        if (gs.vy < -0.5 || current > MIDPOINT) {
          snapTo(EXPANDED);
        } else {
          snapTo(COLLAPSED);
        }
      },
    }),
  ).current;

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
        edgePadding: { top: 60, right: 40, bottom: COLLAPSED + 20, left: 40 },
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStopPress = (stopId: string) => {
    setSelectedStopId((prev) => (prev === stopId ? null : stopId));
  };

  const handleMarkStatus = async (
    stopId: string,
    status: "delivered" | "failed",
    note?: string,
  ) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await updateStopStatus(stopId, status, note);
    setSelectedStopId(null);
  };

  const handleDone = () => {
    clearRun();
    navigation.navigate("MainTabs");
  };

  const isComplete = activeRun.status === "completed";

  return (
    <View style={styles.container}>
      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsCompass={false}
        showsMyLocationButton={false}
      >
        {/* Route polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={colors.primary}
            strokeWidth={3}
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
          >
            <View style={styles.storeMarker}>
              <Text style={styles.storeMarkerText}>S</Text>
            </View>
          </Marker>
        )}

        {/* Stop markers */}
        {stops.map((stop, idx) => {
          const isNext = stop.id === nextPendingStop?.id;
          const markerColor =
            stop.status === "delivered"
              ? colors.delivered
              : stop.status === "failed"
              ? colors.danger
              : colors.primary;

          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat, longitude: stop.lng }}
              title={stop.label}
              zIndex={isNext ? 8 : 5}
            >
              <View
                style={[
                  styles.stopMarker,
                  { borderColor: markerColor },
                  isNext && styles.stopMarkerNext,
                ]}
              >
                <Text
                  style={[
                    styles.stopMarkerText,
                    { color: markerColor },
                    isNext && styles.stopMarkerTextNext,
                  ]}
                >
                  {idx + 1}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Back button */}
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.navigate("MainTabs")}
        accessibilityLabel="Back to planner"
      >
        <ChevronLeft color={colors.primaryDark} size={24} />
      </Pressable>

      {/* ── Bottom sheet ────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.sheet, { height: sheetAnim }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.handle} />

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
              <Pressable onPress={() => snapTo(EXPANDED)}>
                <Text style={styles.expandHint}>Swipe up ↑</Text>
              </Pressable>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${totalCount > 0 ? ((deliveredCount + failedCount) / totalCount) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Stop list */}
        <ScrollView
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
              <View key={stop.id}>
                <StopRow
                  stop={stop}
                  index={originalIndex + 1}
                  isActive={isNext && !isSelected}
                  onPress={() => handleStopPress(stop.id)}
                />
                {isSelected && (
                  <StopActionCard
                    stop={stop}
                    onNavigate={() => openNavigation(stop.lat, stop.lng, stop.label)}
                    onDeliver={(note) => handleMarkStatus(stop.id, "delivered", note)}
                    onFail={(note) => handleMarkStatus(stop.id, "failed", note)}
                  />
                )}
              </View>
            );
          })}

          {/* Separator between pending and done */}
          {pendingStops.length > 0 && doneStops.length > 0 && (
            <View style={styles.doneSeparator}>
              <View style={styles.doneSeparatorLine} />
              <Text style={styles.doneSeparatorText}>Completed stops</Text>
              <View style={styles.doneSeparatorLine} />
            </View>
          )}

          {/* Done stops (trimmed) */}
          {doneStops.map((stop) => {
            const originalIndex = stops.indexOf(stop);

            return (
              <StopRow
                key={stop.id}
                stop={stop}
                index={originalIndex + 1}
                isActive={false}
                onPress={() => {/* done stops are not interactive */}}
              />
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── Completion summary overlay ────────────────────────────────────── */}
      {isComplete && (
        <SummaryOverlay
          delivered={deliveredCount}
          failed={failedCount}
          totalDistanceM={activeRun.totalDistanceM}
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
    elevation: 4,
    height: 40,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    top: 50,
    width: 40,
    zIndex: 10,
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
  doneSeparatorText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  dragArea: { paddingBottom: spacing.xs },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.xl,
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  expandHint: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  failedText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.sm,
    width: 40,
  },
  headerLeft: { flex: 1 },
  progressBarBg: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  progressBarFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 4,
  },
  progressText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    bottom: 0,
    elevation: 12,
    left: 0,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { height: -3, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  stopList: { flex: 1 },
  stopListContent: { paddingBottom: spacing.xl },
  stopMarker: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  stopMarkerNext: {
    backgroundColor: colors.primarySoft,
    borderWidth: 3,
    height: 34,
    width: 34,
  },
  stopMarkerText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  stopMarkerTextNext: {
    fontSize: 13,
  },
  storeMarker: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  storeMarkerText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: "900",
  },
});
