import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  BookmarkX,
  MapPin,
  Pencil,
  Play,
  Route,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { optimizeRoute } from "../api/routes";
import {
  deleteRoute,
  listRoutes,
  updateRoute,
  type SavedRoute,
} from "../api/savedRoutes";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { useDeliveryRunStore } from "../state/deliveryRunStore";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing } from "../theme";
import type { OptimizeResponse, RouteLeg } from "../types/api";

type SavedRoutesScreenProps = BottomTabScreenProps<MainTabParamList, "MyRoutes">;

export function SavedRoutesScreen({ navigation }: SavedRoutesScreenProps) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Routes</Text>
      </View>

      {routes.length === 0 ? (
        <View style={styles.empty}>
          <Route color={colors.muted} size={48} />
          <Text style={styles.emptyTitle}>No saved routes</Text>
          <Text style={styles.emptyCopy}>
            After optimizing a route, tap "Save route" to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RouteCard
              route={item}
              isStarting={actionLoading === item.id + "-start"}
              onLoad={() => handleLoad(item)}
              onStartRun={() => handleStartRun(item)}
              onRename={() => openRename(item)}
              onDelete={() => handleDelete(item)}
            />
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
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setRenameId(null)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  styles.modalBtnConfirm,
                  !renameDraft.trim() && styles.modalBtnDisabled,
                ]}
                onPress={confirmRename}
                disabled={!renameDraft.trim()}
              >
                <Text style={styles.modalBtnConfirmText}>Save</Text>
              </Pressable>
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
        <Pressable
          style={cardStyles.loadBtn}
          onPress={onLoad}
          accessibilityLabel="Load route into planner"
        >
          <BookmarkX color={colors.primaryDark} size={15} />
          <Text style={cardStyles.loadBtnText}>Load</Text>
        </Pressable>

        <Pressable
          style={[cardStyles.startBtn, isStarting && cardStyles.startBtnDisabled]}
          onPress={onStartRun}
          disabled={isStarting}
          accessibilityLabel="Start delivery run"
        >
          {isStarting ? (
            <ActivityIndicator color={colors.card} size="small" />
          ) : (
            <Play color={colors.card} size={14} fill={colors.card} />
          )}
          <Text style={cardStyles.startBtnText}>
            {isStarting ? "Starting…" : "Start run"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
  container: { backgroundColor: colors.background, flex: 1 },
  empty: {
    alignItems: "center",
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: "900" },
  list: { gap: spacing.md, padding: spacing.lg },
  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  modalBtn: {
    borderRadius: radius.sm,
    flex: 1,
    paddingVertical: 12,
  },
  modalBtnCancel: {
    backgroundColor: colors.mutedSoft,
  },
  modalBtnCancelText: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  modalBtnConfirm: {
    backgroundColor: colors.primary,
  },
  modalBtnConfirmText: {
    color: colors.card,
    fontWeight: "700",
    textAlign: "center",
  },
  modalBtnDisabled: { opacity: 0.4 },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: 24,
    padding: spacing.xl,
  },
  modalInput: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: 16,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "center",
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
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
  loadBtn: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    paddingVertical: 10,
  },
  loadBtnText: { color: colors.primaryDark, fontSize: 13, fontWeight: "800" },
  meta: { alignItems: "center", flexDirection: "row", gap: 4, marginTop: 3 },
  metaDot: { color: colors.muted, fontSize: 11 },
  metaText: { color: colors.muted, fontSize: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: "900" },
  nameBlock: { flex: 1, marginRight: spacing.sm },
  row: { alignItems: "flex-start", flexDirection: "row" },
  startBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    paddingVertical: 10,
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { color: colors.card, fontSize: 13, fontWeight: "800" },
});
