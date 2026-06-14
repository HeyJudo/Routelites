import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  FolderOpen,
  MapPin,
  Pencil,
  Play,
  Route,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeOutLeft,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { optimizeRoute } from "../api/routes";
import {
  deleteRoute,
  listRoutes,
  updateRoute,
  type SavedRoute,
} from "../api/savedRoutes";
import { PrimaryButton } from "../components/PrimaryButton";
import { ResumeRunBanner } from "../components/ResumeRunBanner";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { useDeliveryRunStore } from "../state/deliveryRunStore";
import { useProfileStore } from "../state/profileStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, motion, radius, spacing, type } from "../theme";
import type { OptimizeResponse, RouteLeg } from "../types/api";

type SavedRoutesScreenProps = BottomTabScreenProps<MainTabParamList, "MyRoutes">;

// ---------------------------------------------------------------------------
// SkeletonCard
// ---------------------------------------------------------------------------

function SkeletonCard() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: motion.slow }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[skeletonStyles.card, animStyle]}>
      <View style={skeletonStyles.titleBar} />
      <View style={skeletonStyles.metaBar} />
      <View style={skeletonStyles.btnRow}>
        <View style={skeletonStyles.btnBlock} />
        <View style={skeletonStyles.btnBlock} />
      </View>
    </Animated.View>
  );
}

const skeletonStyles = StyleSheet.create({
  btnBlock: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.pill,
    flex: 1,
    height: 40,
  },
  btnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  metaBar: {
    backgroundColor: colors.mutedSoft,
    borderRadius: 4,
    height: 14,
    marginTop: spacing.sm,
    width: "50%",
  },
  titleBar: {
    backgroundColor: colors.mutedSoft,
    borderRadius: 4,
    height: 18,
    width: "70%",
  },
});

// ---------------------------------------------------------------------------
// SavedRoutesScreen
// ---------------------------------------------------------------------------

export function SavedRoutesScreen({ navigation }: SavedRoutesScreenProps) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((s) => s.profile);

  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rename modal state
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const fetchRoutes = useCallback(async () => {
    try {
      const data = await listRoutes();
      setRoutes(data);
    } catch {
      // silently ignore — user sees empty list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Refresh when tab comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchRoutes);
    return unsubscribe;
  }, [navigation, fetchRoutes]);

  // ── Load ──────────────────────────────────────────────────────────────────

  const handleLoad = (route: SavedRoute) => {
    const { setStoreLocation, clearStops, addStop } = useRouteDraftStore.getState();
    setStoreLocation(route.store);
    clearStops();
    route.stops.forEach((s) => addStop(s));
    navigation.navigate("Planner");
  };

  // ── Start run ─────────────────────────────────────────────────────────────

  const handleStartRun = async (route: SavedRoute) => {
    setActionLoading(route.id + "-start");
    try {
      const response = (await optimizeRoute({
        store: {
          lat: route.store.lat,
          lng: route.store.lng,
          lon: route.store.lng,
          label: route.store.label,
          address: route.store.address ?? "",
        },
        stops: route.stops.map((s) => ({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          lon: s.lng,
          label: s.label,
          address: s.address ?? "",
        })),
      })) as OptimizeResponse;

      const order = response.optimized_route.order;
      const depotId = order[0];
      const stopIds = order.filter((id: string) => id !== depotId);

      const runStops = stopIds.map((id: string) => {
        const leg = response.optimized_route.legs.find(
          (l: RouteLeg) => l.to === id,
        );
        const last = leg ? leg.path[leg.path.length - 1] : null;
        return {
          label: response.places?.[id]?.label ?? id,
          address: response.places?.[id]?.address ?? "",
          lat: last?.lat ?? 0,
          lng: last?.lng ?? 0,
        };
      });

      await useDeliveryRunStore.getState().startRun({
        savedRouteId: route.id,
        name: route.name,
        optimizedOrder: order,
        totalDistanceM: response.optimized_route.total_distance_m,
        stops: runStops,
      });

      const newRun = useDeliveryRunStore.getState().activeRun;
      if (newRun) {
        rootNav.navigate("ActiveDelivery", { runId: newRun.id });
      }
    } catch {
      Alert.alert(
        "Could not start route",
        "Make sure the backend is running and try again.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ── Rename ────────────────────────────────────────────────────────────────

  const openRename = (route: SavedRoute) => {
    setRenameDraft(route.name);
    setRenameId(route.id);
  };

  const confirmRename = async () => {
    if (!renameId) return;
    const trimmed = renameDraft.trim();
    if (!trimmed) return;
    try {
      await updateRoute(renameId, { name: trimmed });
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === renameId ? { ...r, name: trimmed } : r,
        ),
      );
    } catch {
      Alert.alert("Error", "Could not rename route.");
    } finally {
      setRenameId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (route: SavedRoute) => {
    Alert.alert("Delete route", `Delete "${route.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRoute(route.id);
            setRoutes((prev) => prev.filter((r) => r.id !== route.id));
          } catch {
            Alert.alert("Error", "Could not delete route.");
          }
        },
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.md },
        ]}
      >
        <Text style={styles.headerTitle}>My Routes</Text>
        {profile?.storeName ? (
          <Text style={styles.headerSubtitle}>{profile.storeName}</Text>
        ) : null}
      </View>

      <ResumeRunBanner />

      {loading ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.empty}>
          <Route color={colors.muted} size={48} />
          <Text style={styles.emptyTitle}>No saved routes</Text>
          <Text style={styles.emptyCopy}>
            Optimize a route, then save it here.
          </Text>
          <PrimaryButton
            size="sm"
            onPress={() => navigation.navigate("Planner")}
          >
            Plan a route
          </PrimaryButton>
        </View>
      ) : (
        <Animated.FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          itemLayoutAnimation={LinearTransition.springify()}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInUp.delay(index * 50).duration(motion.base)}
              exiting={FadeOutLeft.duration(200)}
              layout={LinearTransition.springify()}
            >
              <RouteCard
                route={item}
                isStarting={actionLoading === item.id + "-start"}
                onLoad={() => handleLoad(item)}
                onStartRun={() => handleStartRun(item)}
                onRename={() => openRename(item)}
                onDelete={() => handleDelete(item)}
              />
            </Animated.View>
          )}
        />
      )}

      {/* Rename modal */}
      <Modal
        visible={renameId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameId(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename route</Text>
            <TextInput
              style={styles.modalInput}
              value={renameDraft}
              onChangeText={setRenameDraft}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmRename}
              placeholderTextColor={colors.muted}
              selectionColor={colors.primary}
            />
            <View style={styles.modalActions}>
              <PrimaryButton
                size="sm"
                variant="secondary"
                onPress={() => setRenameId(null)}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                size="sm"
                variant="primary"
                onPress={confirmRename}
                disabled={!renameDraft.trim()}
              >
                Save
              </PrimaryButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RouteCard
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

interface RouteCardProps {
  route: SavedRoute;
  isStarting: boolean;
  onLoad: () => void;
  onStartRun: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function RouteCard({
  route,
  isStarting,
  onLoad,
  onStartRun,
  onRename,
  onDelete,
}: RouteCardProps) {
  return (
    <View style={cardStyles.card}>
      {/* Card header */}
      <View style={cardStyles.row}>
        <View style={cardStyles.nameBlock}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {route.name}
          </Text>
          <View style={cardStyles.meta}>
            <MapPin color={colors.muted} size={12} />
            <Text style={cardStyles.metaText}>
              {route.stops.length} stop{route.stops.length !== 1 ? "s" : ""}
            </Text>
            <Text style={cardStyles.metaDot}>·</Text>
            <Text style={cardStyles.metaText}>{formatDate(route.updated_at)}</Text>
          </View>
        </View>

        {/* Icon actions */}
        <View style={cardStyles.iconActions}>
          <Pressable
            style={cardStyles.iconBtn}
            onPress={onRename}
            hitSlop={8}
            accessibilityLabel="Rename"
          >
            <Pencil color={colors.muted} size={16} />
          </Pressable>
          <Pressable
            style={cardStyles.iconBtn}
            onPress={onDelete}
            hitSlop={8}
            accessibilityLabel="Delete"
          >
            <Trash2 color={colors.danger} size={16} />
          </Pressable>
        </View>
      </View>

      {/* Action buttons */}
      <View style={cardStyles.actions}>
        <View style={cardStyles.loadBtnWrapper}>
          <PrimaryButton
            size="sm"
            variant="outline"
            icon={<FolderOpen color={colors.primaryDark} size={15} />}
            onPress={onLoad}
          >
            Load
          </PrimaryButton>
        </View>

        <View style={cardStyles.startBtnWrapper}>
          <PrimaryButton
            size="sm"
            loading={isStarting}
            icon={<Play color={colors.textOnPrimary} size={14} fill={colors.textOnPrimary} />}
            onPress={onStartRun}
          >
            Start run
          </PrimaryButton>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  empty: {
    alignItems: "center",
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyCopy: {
    ...type.body,
    color: colors.muted,
    textAlign: "center",
  },
  emptyTitle: { ...type.title, color: colors.text },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: { ...type.display, color: colors.text },
  headerSubtitle: { ...type.body, color: colors.muted, marginTop: 2 },
  list: { gap: spacing.md, padding: spacing.lg },
  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: 24,
    padding: spacing.xl,
  },
  modalInput: {
    ...type.body,
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    color: colors.text,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "center",
  },
  modalTitle: { ...type.title, color: colors.text },
});

const cardStyles = StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  iconActions: { flexDirection: "row", gap: spacing.sm },
  iconBtn: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  loadBtnWrapper: { flex: 1 },
  meta: { alignItems: "center", flexDirection: "row", gap: 4, marginTop: 3 },
  metaDot: { ...type.caption, color: colors.muted },
  metaText: { ...type.caption, color: colors.muted },
  name: { ...type.heading, color: colors.text },
  nameBlock: { flex: 1, marginRight: spacing.sm },
  row: { alignItems: "flex-start", flexDirection: "row" },
  startBtnWrapper: { flex: 1 },
});
