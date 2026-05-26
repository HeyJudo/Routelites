import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import { colors, radius, spacing } from "../theme";

export type PlaceResult = {
  lat: number;
  lng: number;
  label: string;
  address: string;
};

type PlacesSearchInputProps = {
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
};

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function PlacesSearchInput({
  onPlaceSelected,
  placeholder = "Search for a delivery stop",
}: PlacesSearchInputProps) {
  const ref = useRef<any>(null);

  if (!API_KEY) {
    console.warn(
      "[PlacesSearchInput] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Autocomplete will not work.",
    );
  }

  return (
    <View style={styles.wrapper}>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder}
        minLength={2}
        fetchDetails
        onPress={(data, details = null) => {
          if (!details) return;

          const place: PlaceResult = {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
            label: data.structured_formatting?.main_text ?? data.description,
            address: data.description,
          };

          onPlaceSelected(place);

          // Clear input after selection
          ref.current?.clear();
          ref.current?.blur();
        }}
        onFail={(error) => {
          console.warn("[PlacesSearchInput] API request failed:", error);
        }}
        onNotFound={() => {
          // No results — the library handles the empty state display
        }}
        query={{
          key: API_KEY,
          language: "en",
          components: "country:ph",
          location: "14.5995,120.9842",
          radius: 25000,
        }}
        textInputProps={{
          placeholderTextColor: colors.muted,
          returnKeyType: "search",
        }}
        styles={{
          container: styles.container,
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          separator: styles.separator,
          description: styles.description,
          poweredContainer: styles.poweredContainer,
        }}
        enablePoweredByContainer={false}
        debounce={300}
        listViewDisplayed="auto"
        keyboardShouldPersistTaps="handled"
        disableScroll
        renderRow={(data) => (
          <View style={styles.suggestionRow}>
            <Text style={styles.suggestionMain} numberOfLines={1}>
              {data.structured_formatting?.main_text ?? data.description}
            </Text>
            {data.structured_formatting?.secondary_text ? (
              <Text style={styles.suggestionSecondary} numberOfLines={1}>
                {data.structured_formatting.secondary_text}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    zIndex: 10,
  },
  description: {
    color: colors.text,
    fontSize: 14,
  },
  listView: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 200,
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  poweredContainer: {
    display: "none",
  },
  row: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
  },
  suggestionMain: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  suggestionRow: {
    gap: 2,
  },
  suggestionSecondary: {
    color: colors.muted,
    fontSize: 13,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: 16,
    height: 52,
    paddingHorizontal: 16,
  },
  textInputContainer: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
  wrapper: {
    zIndex: 10,
  },
});
