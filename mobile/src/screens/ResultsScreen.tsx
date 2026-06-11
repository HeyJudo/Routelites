import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Bookmark, ChevronLeft, Info, Play, Store } from "lucide-react-native";
import { useRef, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { AlgorithmDetailsModal } from "../components/AlgorithmDetailsModal";
import { PrimaryButton } from "../components/PrimaryButton";
import { metroManilaRegion } from "../data/demoRoute";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { createRoute } from "../api/savedRoutes";
import { useDeliveryRunStore } from "../state/deliveryRunStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import type { OptimizeResponse, RouteLeg } from "../types/api";

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, "Results">;
type ViewMode = "optimized" | "naive" | "compare";

const SCREEN_H = Dimensions.get("window").height;
const COLLAPSED = Math.round(SCREEN_H * 0.42);
const EXPANDED  = Math.round(SCREEN_H * 0.88);
const MIDPOINT  = (COLLAPSED + EXPANDED) / 2;

function legsToCoords(legs: RouteLeg[]) {
  return legs.flatMap((leg) =>
    leg.path.map((p) => ({ latitude: p.lat, longitude: p.lng })),
  );
}

export function ResultsScreen({ navigation, route }: ResultsScreenProps) {
  const { response } = route.params;

  const [mode, setMode]           = useState<ViewMode>("optimized");
  const [showDetails, setShowDetails] = useState(false);
  const [isExpanded, setIsExpanded]   = useState(false);
  const [startingRun, setStartingRun] = useState(false);

  // Save route modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [routeNameDraft, setRouteNameDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Animated sheet height ──────────────────────────────────────────────────
  const sheetAnim  = useRef(new Animated.Value(COLLAPSED)).current;
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
        // Also snap based on swipe velocity
        if (gs.vy < -0.5 || current > MIDPOINT) {
          snapTo(EXPANDED);
        } else {
          snapTo(COLLAPSED);
        }
      },
    }),
  ).current;

  // ── Route data ─────────────────────────────────────────────────────────────
  const optimizedCoords = legsToCoords(response.optimized_route.legs);
  const naiveCoords     = legsToCoords(response.naive_route.legs);
  const activeRoute =
    mode === "naive" ? response.naive_route : response.optimized_route;

  // Depot = always order[0]; works for demo ("store") and real OSM node IDs
  const depotId: string = response.optimized_route.order[0];

  const mapRef = useRef<MapView>(null);
  useEffect(() => {
    const coords = mode === "naive" ? naiveCoords : optimizedCoords;
    if (coords.length > 0) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 40, bottom: COLLAPSED + 20, left: 40 },
        animated: true,
      });
    }
  }, [mode]);

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

  const stopCount = activeRoute.order.filter((id: string) => id !== depotId).length;
  const totalKm   = (activeRoute.total_distance_m / 1000).toFixed(1);

  // ── Start route handler ────────────────────────────────────────────────────
  const handleStartRoute = async () => {
    const order = response.optimized_route.order;
    const depotIdx = order[0];

    // All entries in order that are not the depot (skips start depot + return-to-depot tail)
    const stopIds = order.filter((id: string) => id !== depotIdx);

    // Build stops in optimized visit order
    const stops = stopIds.map((id: string) => {
      const leg = response.optimized_route.legs.find((l: RouteLeg) => l.to === id);
      const last = leg ? leg.path[leg.path.length - 1] : null;
      return {
        label: nameFor(id),
        address: addressFor(id),
        lat: last?.lat ?? 0,
        lng: last?.lng ?? 0,
      };
    });

    if (stops.length === 0) return;

    setStartingRun(true);
    try {
      await useDeliveryRunStore.getState().startRun({
        optimizedOrder: order,
        totalDistanceM: response.optimized_route.total_distance_m,
        stops,
      });
      const newRun = useDeliveryRunStore.getState().activeRun;
      if (newRun) {
        navigation.navigate("ActiveDelivery", { runId: newRun.id });
      }
    } catch (err) {
      console.warn("[ResultsScreen] startRun failed:", err);
    } finally {
      setStartingRun(false);
    }
  };

  // ── Save route handler ─────────────────────────────────────────────────────
  const handleSaveRoute = async () => {
    const { storeLocation, stops } = useRouteDraftStore.getState();
    if (!storeLocation || stops.length === 0) {
      Alert.alert("Nothing to save", "Add stops to your route first.");
      return;
    }
    setSaving(true);
    try {
      await createRoute(routeNameDraft.trim() || "My Route", storeLocation, stops);
      setShowSaveModal(false);
      setRouteNameDraft("");
      Alert.alert("Saved", "Route saved to My Routes.");
    } catch {
      Alert.alert("Error", "Could not save route. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        initialRegion={metroManilaRegion}
        showsCompass={false}
        showsMyLocationButton={false}
        style={StyleSheet.absoluteFill}
      >
        {(mode === "naive" || mode === "compare") && (
          <Polyline
            coordinates={naiveCoords}
            strokeColor="#9e9e9e"
            strokeWidth={3}
            lineDashPattern={[8, 6]}
            zIndex={1}
          />
        )}
        {(mode === "optimized" || mode === "compare") && (
          <Polyline
            coordinates={optimizedCoords}
            strokeColor={colors.primary}
            strokeWidth={4}
            zIndex={2}
          />
        )}

        {storeLat != null && storeLng != null && (
          <Marker
            key="depot-marker"
            coordinate={{ latitude: storeLat, longitude: storeLng }}
            title={nameFor(depotId)}
            zIndex={10}
          >
            <View style={styles.storeMarker}>
              <Text style={styles.storeMarkerText}>S</Text>
            </View>
          </Marker>
        )}

        {(mode === "compare"
          ? [response.optimized_route, response.naive_route]
          : [activeRoute]
        ).flatMap((r, routeIdx) => {
          let n = 0;
          return r.order
            .filter((id: string) => id !== depotId)
            .map((id: string) => {
              n += 1;
              const leg = r.legs.find((l: RouteLeg) => l.to === id);
              if (!leg) return null;
              const last = leg.path[leg.path.length - 1];
              return (
                <Marker
                  key={`marker-${routeIdx}-${id}`}
                  coordinate={{ latitude: last.lat, longitude: last.lng }}
                  title={nameFor(id)}
                  zIndex={5}
                >
                  <View style={styles.stopMarker}>
                    <Text style={styles.stopMarkerText}>{n}</Text>
                  </View>
                </Marker>
              );
            });
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

      {/* ── Swipeable bottom sheet ─────────────────────────────────────────── */}
      <Animated.View style={[styles.sheet, { height: sheetAnim }]}>

        {/* Drag handle — entire area is the pan target */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.handle} />
          {/* Header inside the drag area so users can drag from it too */}
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>Route Results</Text>
            <Pressable onPress={() => setShowDetails(true)}>
              <View style={styles.detailsLink}>
                <Info color={colors.primary} size={15} />
                <Text style={styles.linkText}>Algorithm details</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={styles.statValue}>
              {(response.optimized_route.total_distance_m / 1000).toFixed(2)} km
            </Text>
            <Text style={styles.statLabel}>Optimized</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {(response.naive_route.total_distance_m / 1000).toFixed(2)} km
            </Text>
            <Text style={styles.statLabel}>Naive</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSaved]}>
            <Text style={[styles.statValue, styles.statValueSaved]}>
              {response.savings.percentage.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        {/* Start route + Save route buttons */}
        <PrimaryButton
          onPress={handleStartRoute}
          disabled={stopCount === 0 || startingRun}
          icon={<Play color={colors.card} size={16} />}
        >
          {startingRun ? "Starting…" : "Start route"}
        </PrimaryButton>

        <Pressable
          style={styles.saveRouteBtn}
          onPress={() => {
            setRouteNameDraft("");
            setShowSaveModal(true);
          }}
          disabled={stopCount === 0}
          accessibilityLabel="Save route"
        >
          <Bookmark color={colors.primaryDark} size={14} />
          <Text style={styles.saveRouteBtnText}>Save route</Text>
        </Pressable>

        {/* Segmented control */}
        <View style={[styles.segmented, { marginTop: spacing.sm }]}>
          {(["optimized", "naive", "compare"] as ViewMode[]).map((m) => (
            <Pressable
              key={m}
              style={[styles.segment, mode === m && styles.segmentActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stop list header */}
        <View style={styles.stopListHeader}>
          <Text style={styles.stopListTitle}>
            {stopCount} stop{stopCount !== 1 ? "s" : ""} · {totalKm} km total
          </Text>
          {!isExpanded && (
            <Pressable onPress={() => snapTo(EXPANDED)}>
              <Text style={styles.expandHint}>Swipe up or tap ↑</Text>
            </Pressable>
          )}
        </View>

        {/* Stop rows — scrollable */}
        <ScrollView
          style={styles.stopList}
          contentContainerStyle={styles.stopListContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
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
                    <Text style={styles.stopName} numberOfLines={1}>
                      {isReturn ? "Return to store" : nameFor(id)}
                    </Text>
                    {!isReturn && addr ? (
                      <Text style={styles.stopAddress} numberOfLines={1}>
                        {addr}
                      </Text>
                    ) : null}
                  </View>

                  {leg ? (
                    <Text style={styles.legDist}>
                      {(leg.distance_m / 1000).toFixed(1)} km
                    </Text>
                  ) : null}
                </View>
              );
            });
          })()}
        </ScrollView>
      </Animated.View>

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
            <Text style={saveModalStyles.title}>Save route</Text>
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
  detailsLink: { alignItems: "center", flexDirection: "row", gap: 4 },
  dragArea: { paddingBottom: spacing.xs },
  expandHint: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.sm,
    width: 40,
  },
  legDist: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: spacing.sm,
    minWidth: 44,
    textAlign: "right",
  },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  segment: { borderRadius: radius.sm, flex: 1, paddingVertical: 9 },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { color: colors.muted, fontSize: 12, textAlign: "center" },
  segmentTextActive: { color: colors.text, fontWeight: "900" },
  segmented: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: 4,
    marginBottom: spacing.sm,
    padding: 4,
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
  statCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.md,
  },
  statCardHighlight: { borderColor: colors.primary },
  statCardSaved: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: "900" },
  statValueSaved: { color: colors.primaryDark },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  stopAddress: { color: colors.muted, fontSize: 11, marginTop: 1 },
  stopBadge: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 2,
    flexShrink: 0,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  stopBadgeText: { color: colors.primaryDark, fontSize: 11, fontWeight: "900" },
  stopInfo: { flex: 1, marginLeft: spacing.md },
  stopList: { flex: 1 },
  stopListContent: { paddingBottom: spacing.xl },
  stopListHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  stopListTitle: { color: colors.muted, fontSize: 12, fontWeight: "700" },
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
  stopMarkerText: { color: colors.primaryDark, fontSize: 12, fontWeight: "900" },
  stopName: { color: colors.text, fontSize: 13, fontWeight: "700" },
  stopRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingVertical: 10,
  },
  stopRowLast: { borderBottomWidth: 0 },
  storeBadge: { backgroundColor: colors.primary, borderColor: colors.primary },
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
  storeMarkerText: { color: colors.card, fontSize: 14, fontWeight: "900" },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  saveRouteBtn: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    marginTop: spacing.xs,
    paddingVertical: 10,
  },
  saveRouteBtnText: { color: colors.primaryDark, fontSize: 13, fontWeight: "800" },
});

const saveModalStyles = StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  btn: { borderRadius: radius.sm, flex: 1, paddingVertical: 12 },
  btnCancel: { backgroundColor: colors.mutedSoft },
  btnCancelText: { color: colors.text, fontWeight: "700", textAlign: "center" },
  btnConfirm: { backgroundColor: colors.primary },
  btnConfirmText: { color: colors.card, fontWeight: "700", textAlign: "center" },
  btnDisabled: { opacity: 0.5 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: 24,
    padding: spacing.xl,
  },
  input: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: 16,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "center",
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "900" },
});
