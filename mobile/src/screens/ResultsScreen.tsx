import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Info } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { metroManilaRegion } from "../data/demoRoute";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import type { OptimizeResponse, RouteLeg } from "../types/api";
import { AlgorithmDetailsModal } from "../components/AlgorithmDetailsModal";

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, "Results">;

type ViewMode = "optimized" | "naive" | "compare";

function legsToCoords(legs: RouteLeg[]) {
  return legs.flatMap((leg) =>
    leg.path.map((p) => ({ latitude: p.lat, longitude: p.lng })),
  );
}

export function ResultsScreen({ navigation, route }: ResultsScreenProps) {
  const { response } = route.params;
  const [mode, setMode] = useState<ViewMode>("optimized");
  const [showDetails, setShowDetails] = useState(false);

  const optimizedCoords = legsToCoords(response.optimized_route.legs);
  const naiveCoords = legsToCoords(response.naive_route.legs);

  const activeRoute =
    mode === "naive" ? response.naive_route : response.optimized_route;

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapArea}>
        <MapView
          initialRegion={metroManilaRegion}
          showsCompass={false}
          showsMyLocationButton={false}
          style={StyleSheet.absoluteFill}
        >
          {(mode === "optimized" || mode === "compare") && (
            <Polyline
              coordinates={optimizedCoords}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          )}
          {(mode === "naive" || mode === "compare") && (
            <Polyline
              coordinates={naiveCoords}
              strokeColor="#9e9e9e"
              strokeWidth={3}
              lineDashPattern={[8, 6]}
            />
          )}
          {/* Stop markers from optimized order */}
          {response.optimized_route.legs.map((leg, i) =>
            i === 0 ? (
              <Marker
                key="store-start"
                coordinate={{
                  latitude: leg.path[0].lat,
                  longitude: leg.path[0].lng,
                }}
                title="Store"
              >
                <View style={styles.storeMarker}>
                  <Text style={styles.storeMarkerText}>S</Text>
                </View>
              </Marker>
            ) : null,
          )}
          {activeRoute.order
            .filter((id) => id !== "store")
            .map((id, i) => {
              const leg = response.optimized_route.legs.find(
                (l) => l.to === id,
              );
              if (!leg) return null;
              const lastPt = leg.path[leg.path.length - 1];
              return (
                <Marker
                  key={id}
                  coordinate={{ latitude: lastPt.lat, longitude: lastPt.lng }}
                  title={id}
                >
                  <View style={styles.stopMarker}>
                    <Text style={styles.stopMarkerText}>{i + 1}</Text>
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
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.title}>Route Results</Text>
          <Pressable onPress={() => setShowDetails(true)}>
            <View style={styles.detailsLink}>
              <Info color={colors.primary} size={16} />
              <Text style={styles.linkText}>Algorithm details</Text>
            </View>
          </Pressable>
        </View>

        {/* Toggle */}
        <View style={styles.segmented}>
          {(["optimized", "naive", "compare"] as ViewMode[]).map((m) => (
            <Pressable
              key={m}
              style={[styles.segment, mode === m && styles.segmentActive]}
              onPress={() => setMode(m)}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === m && styles.segmentTextActive,
                ]}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Optimized"
            value={`${(response.optimized_route.total_distance_m / 1000).toFixed(2)} km`}
            highlight
          />
          <StatCard
            label="Naive"
            value={`${(response.naive_route.total_distance_m / 1000).toFixed(2)} km`}
          />
          <StatCard
            label="Saved"
            value={`${response.savings.percentage.toFixed(1)}%`}
            highlight
          />
        </View>

        {/* Stop order list */}
        <ScrollView style={styles.stopList} showsVerticalScrollIndicator={false}>
          {activeRoute.order.map((id, i) => (
            <View key={`${id}-${i}`} style={styles.stopRow}>
              <View
                style={[
                  styles.stopBadge,
                  id === "store" && styles.storeBadge,
                ]}
              >
                <Text style={styles.stopBadgeText}>
                  {id === "store" ? "S" : i}
                </Text>
              </View>
              <Text style={styles.stopId}>{id === "store" ? "Store (depot)" : id.replace("_", " ")}</Text>
              {i < activeRoute.legs.length && (
                <Text style={styles.legDist}>
                  {(activeRoute.legs[i].distance_m / 1000).toFixed(1)} km
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <AlgorithmDetailsModal
        metadata={response.metadata}
        visible={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    elevation: 3,
    height: 40,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    top: 50,
    width: 40,
  },
  container: { backgroundColor: colors.background, flex: 1 },
  detailsLink: { alignItems: "center", flexDirection: "row", gap: 4 },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 12,
    width: 32,
  },
  legDist: { color: colors.muted, fontSize: 12, marginLeft: "auto" },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  mapArea: { flex: 1 },
  segment: {
    borderRadius: radius.sm,
    flex: 1,
    paddingVertical: 10,
  },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { color: colors.muted, fontSize: 14, textAlign: "center" },
  segmentTextActive: { color: colors.text, fontWeight: "900" },
  segmented: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "50%",
    padding: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  statCardHighlight: { borderColor: colors.primary },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  stopBadge: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  stopBadgeText: { color: colors.primaryDark, fontSize: 11, fontWeight: "900" },
  stopId: { color: colors.text, fontSize: 14, fontWeight: "600", marginLeft: 10 },
  stopList: { maxHeight: 140 },
  stopRow: { alignItems: "center", flexDirection: "row", paddingVertical: 6 },
  storeBadge: { backgroundColor: colors.primary, borderColor: colors.primary },
  storeMarker: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: 20,
    borderWidth: 3,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  storeMarkerText: { color: colors.card, fontSize: 14, fontWeight: "900" },
  stopMarker: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 2.5,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  stopMarkerText: { color: colors.primaryDark, fontSize: 12, fontWeight: "900" },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
});
