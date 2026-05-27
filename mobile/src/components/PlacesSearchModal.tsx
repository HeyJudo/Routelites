import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Search,
  X,
} from "lucide-react-native";

import { colors, radius, spacing } from "../theme";

export type PlaceResult = {
  lat: number;
  lng: number;
  label: string;
  address: string;
};

type PlacesSearchModalProps = {
  visible: boolean;
  onClose: () => void;
  onPlaceSelected: (place: PlaceResult) => boolean;
};

type Prediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function PlacesSearchModal({
  visible,
  onClose,
  onPlaceSelected,
}: PlacesSearchModalProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedStops, setAddedStops] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const inputRef = useRef<TextInput>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setQuery("");
      setPredictions([]);
      setAddedStops([]);
      focusTimeoutRef.current = setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (refocusTimeoutRef.current) clearTimeout(refocusTimeoutRef.current);
    };
  }, [visible]);

  const searchPlaces = (text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setPredictions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;
      try {
        setLoading(true);
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${encodeURIComponent(text)}` +
          `&key=${API_KEY}` +
          `&components=country:ph` +
          `&location=14.5995%2C120.9842` +
          `&radius=25000` +
          `&language=en`;

        const res = await fetch(url);
        const data = await res.json();

        // Only update state if this is still the latest request
        if (currentRequestId !== requestIdRef.current) return;

        if (data.status === "OK" && data.predictions) {
          setPredictions(data.predictions);
        } else {
          setPredictions([]);
          if (data.status !== "ZERO_RESULTS") {
            console.warn(
              "[PlacesSearch] API status:",
              data.status,
              data.error_message,
            );
          }
        }
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return;
        console.warn("[PlacesSearch] Network error:", err);
        setPredictions([]);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);
  };

  const selectPlace = async (prediction: Prediction) => {
    try {
      Keyboard.dismiss();
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${prediction.place_id}` +
        `&fields=geometry,name,formatted_address` +
        `&key=${API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const place: PlaceResult = {
          lat,
          lng,
          label: prediction.structured_formatting.main_text,
          address: prediction.description,
        };

        const wasAdded = onPlaceSelected(place);

        if (wasAdded) {
          // Show confirmation inline — don't close, let user add more
          setAddedStops((prev) => [
            prediction.structured_formatting.main_text,
            ...prev,
          ]);
        }

        setQuery("");
        setPredictions([]);

        // Re-focus input for next search
        refocusTimeoutRef.current = setTimeout(() => inputRef.current?.focus(), 200);
      }
    } catch (err) {
      console.warn("[PlacesSearch] Details fetch error:", err);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={styles.backButton}
            accessibilityLabel="Close search"
          >
            <ChevronLeft color={colors.text} size={24} />
          </Pressable>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Add or find stops"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={searchPlaces}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setPredictions([]);
                  inputRef.current?.focus();
                }}
                style={styles.clearButton}
              >
                <X color={colors.muted} size={18} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Recently added stops confirmation */}
          {addedStops.length > 0 && (
            <View style={styles.addedSection}>
              {addedStops.map((name, i) => (
                <View key={`${name}-${i}`} style={styles.addedRow}>
                  <View style={styles.addedInfo}>
                    <Text style={styles.addedName} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                  <View style={styles.addedBadge}>
                    <CheckCircle2 color={colors.primary} size={16} />
                    <Text style={styles.addedBadgeText}>Added</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Search results */}
          {predictions.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionLabel}>Add a new stop</Text>
              {predictions.map((prediction) => (
                <Pressable
                  key={prediction.place_id}
                  style={styles.resultRow}
                  onPress={() => selectPlace(prediction)}
                >
                  <View style={styles.resultIcon}>
                    <MapPin color={colors.muted} size={18} />
                  </View>
                  <View style={styles.resultText}>
                    <Text style={styles.resultMain} numberOfLines={1}>
                      {prediction.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.resultSecondary} numberOfLines={1}>
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Empty state — no query yet */}
          {query.length < 2 && predictions.length === 0 && addedStops.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Search color={colors.muted} size={32} />
              </View>
              <Text style={styles.emptyTitle}>Add a new stop</Text>
              <Text style={styles.emptySubtitle}>
                Search by place name or address{"\n"}within Metro Manila
              </Text>
            </View>
          )}

          {/* No results */}
          {query.length >= 2 && predictions.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No places found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term
              </Text>
            </View>
          )}

          {/* Loading */}
          {loading && (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  addedBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  addedBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  addedInfo: {
    flex: 1,
  },
  addedName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  addedRow: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addedSection: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  body: {
    flex: 1,
  },
  clearButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    width: 36,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.pill,
    height: 72,
    justifyContent: "center",
    marginBottom: 16,
    width: 72,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 4,
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  inputContainer: {
    flex: 1,
    justifyContent: "center",
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15,
  },
  resultIcon: {
    alignItems: "center",
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  resultMain: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  resultRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  resultSecondary: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  resultText: {
    flex: 1,
  },
  resultsSection: {
    paddingTop: 16,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    paddingBottom: 8,
    paddingHorizontal: 20,
    textTransform: "uppercase",
  },
  textInput: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: 16,
    height: 44,
    paddingHorizontal: 16,
    paddingRight: 44,
  },
});
