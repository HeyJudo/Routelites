import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Crosshair, Search } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FadeSlideView } from "../components/FadeSlideView";
import { OnboardingHeader } from "../components/OnboardingHeader";
import { OnboardingIllustration } from "../components/OnboardingIllustration";
import {
  PlacesSearchModal,
  type PlaceResult,
} from "../components/PlacesSearchModal";
import { PrimaryButton } from "../components/PrimaryButton";
import { RouteMap } from "../components/RouteMap";
import { demoStore } from "../data/demoRoute";
import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { isInsideNCR } from "../utils/validation";

type SetStoreScreenProps = NativeStackScreenProps<RootStackParamList, "SetStore">;

/**
 * Step 2 of onboarding: Set the store/pickup location.
 * Shows progress bar at 50%, map preview, and location selection options.
 */
export function SetStoreScreen({ navigation }: SetStoreScreenProps) {
  const setStoreLocation = useRouteDraftStore((s) => s.setStoreLocation);
  const storeLocation = useRouteDraftStore((s) => s.storeLocation);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedStore, setSelectedStore] = useState(storeLocation ?? demoStore);
  const [validationError, setValidationError] = useState("");

  const handlePlaceSelected = (place: PlaceResult): boolean => {
    if (!isInsideNCR(place.lat, place.lng)) {
      setValidationError("This location is outside Metro Manila");
      return false;
    }
    setSelectedStore({
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      address: place.address,
    });
    setValidationError("");
    return true;
  };

  const handleContinue = () => {
    setStoreLocation(selectedStore);
    navigation.navigate("OnboardingStops");
  };

  const handleSkip = () => {
    setStoreLocation(selectedStore);
    navigation.replace("MainTabs");
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        progress={50}
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <FadeSlideView delay={100}>
          <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
          <Text style={styles.title}>Where do your deliveries start?</Text>
          <Text style={styles.subtitle}>
            Set your store, warehouse, or pickup location. This is where your
            route will begin and end.
          </Text>
        </FadeSlideView>

        <FadeSlideView delay={200}>
          <Pressable
            style={styles.searchBox}
            onPress={() => setShowSearch(true)}
          >
            <Search color={colors.muted} size={20} />
            <Text style={styles.searchText}>Search for a location</Text>
          </Pressable>
        </FadeSlideView>

        <FadeSlideView delay={250}>
          <Pressable style={styles.currentLocation}>
            <Crosshair color={colors.primary} size={20} />
            <Text style={styles.currentLocationText}>Use current location</Text>
          </Pressable>
        </FadeSlideView>

        {validationError ? (
          <FadeSlideView>
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          </FadeSlideView>
        ) : null}

        <FadeSlideView delay={300} style={styles.mapContainer}>
          <View style={styles.mapArea}>
            <RouteMap store={selectedStore} />
          </View>
          <View style={styles.selectedCard}>
            <View style={styles.selectedDot} />
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedLabel}>{selectedStore.label}</Text>
              <Text style={styles.selectedAddress} numberOfLines={1}>
                {selectedStore.address}
              </Text>
            </View>
          </View>
        </FadeSlideView>
      </View>

      <FadeSlideView delay={400} style={styles.footer}>
        <PrimaryButton onPress={handleContinue}>
          Continue
        </PrimaryButton>
        <Pressable onPress={handleSkip} hitSlop={8}>
          <Text style={styles.skipText}>Skip setup, use demo location</Text>
        </Pressable>
      </FadeSlideView>

      <PlacesSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onPlaceSelected={handlePlaceSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: 24,
  },
  currentLocation: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  currentLocationText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "700",
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    gap: spacing.md,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  mapArea: {
    borderRadius: radius.md,
    flex: 1,
    overflow: "hidden",
  },
  mapContainer: {
    flex: 1,
    gap: spacing.md,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  searchText: {
    color: colors.muted,
    fontSize: 16,
  },
  selectedAddress: {
    color: colors.muted,
    fontSize: 13,
  },
  selectedCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: 14,
  },
  selectedDot: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  selectedInfo: {
    flex: 1,
    gap: 2,
  },
  selectedLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  skipText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  stepLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
});
