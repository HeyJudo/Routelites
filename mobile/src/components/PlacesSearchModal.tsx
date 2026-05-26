import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChevronLeft, MapPin, X } from "lucide-react-native";

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
  onPlaceSelected: (place: PlaceResult) => void;
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
const SCREEN_HEIGHT = Dimensions.get("window").height;

export function PlacesSearchModal({
  visible,
  onClose,
  onPlaceSelected,
}: PlacesSearchModalProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setQuery("");
      setPredictions([]);
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  // Swipe-down-to-close gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const searchPlaces = (text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setPredictions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
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

        if (data.status === "OK" && data.predictions) {
          setPredictions(data.predictions);
        } else {
          setPredictions([]);
          if (data.status !== "ZERO_RESULTS") {
            console.warn("[PlacesSearch] API status:", data.status, data.error_message);
          }
        }
      } catch (err) {
        console.warn("[PlacesSearch] Network error:", err);
        setPredictions([]);
      } finally {
        setLoading(false);
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
        onPlaceSelected({
          lat,
          lng,
          label: prediction.structured_formatting.main_text,
          address: prediction.description,
        });
        onClose();
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
      <Animated.View
        style={[styles.container, { transform: [{ translateY }] }]}
      >
        {/* Drag handle area */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        <SafeAreaView style={styles.safeArea}>
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
                style={styles.textInput}
                placeholder="Search for a place or address"
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={searchPlaces}
                autoFocus
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => {
                    setQuery("");
                    setPredictions([]);
                  }}
                  style={styles.clearButton}
                >
                  <X color={colors.muted} size={18} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Hint */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add a new stop</Text>
            <Text style={styles.sectionSubtitle}>
              Search by place name or address within Metro Manila
            </Text>
          </View>

          {/* Results */}
          <View style={styles.results}>
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
            {query.length >= 2 && predictions.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No places found</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
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
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 5,
    width: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 4,
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  inputContainer: {
    flex: 1,
    justifyContent: "center",
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
  results: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
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
