# Design Document

## Overview

This design describes the Google Places Autocomplete integration for RouteLite. The feature adds a `PlacesSearchInput` component that wraps `react-native-google-places-autocomplete` and integrates into the existing Planner screen's search box area. The component is built as a standalone, reusable module that emits place selection events to the parent.

## Architecture

### Component Structure

```text
PlannerScreen.tsx
  └── PlacesSearchInput.tsx (new component)
        └── GooglePlacesAutocomplete (from react-native-google-places-autocomplete)
```

### Data Flow

```text
User types → GooglePlacesAutocomplete queries Places API
                                          ↓
                        Suggestions displayed in dropdown
                                          ↓
                    User selects a suggestion
                                          ↓
            Place details (lat, lng, name, address) returned
                                          ↓
        onPlaceSelected callback fires to PlannerScreen
                                          ↓
    PlannerScreen validates: isInsideNCR? isDuplicateStop?
                                          ↓
              If valid → addStop(stop) to Zustand store
              If invalid → show MapToast error message
```

## Detailed Design

### New File: `mobile/src/components/PlacesSearchInput.tsx`

#### Props Interface

```typescript
type PlaceResult = {
  lat: number;
  lng: number;
  label: string;
  address: string;
};

type PlacesSearchInputProps = {
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
};
```

#### Implementation Approach

- Uses `react-native-google-places-autocomplete` library (already in package.json dependencies list in IMPLEMENTATION_PLAN.md)
- Reads API key from `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- Configures the autocomplete with:
  - `query.components`: `"country:ph"` (restrict to Philippines)
  - `query.location`: `"14.5995,120.9842"` (Metro Manila center bias)
  - `query.radius`: `25000` (25km bias radius)
  - `minLength`: `2` (minimum characters before querying)
  - `fetchDetails`: `true` (to get lat/lng from place details)
- On place selection, extracts:
  - `lat` from `details.geometry.location.lat`
  - `lng` from `details.geometry.location.lng`
  - `label` from `data.structured_formatting.main_text`
  - `address` from `data.description`
- Calls `onPlaceSelected` with the extracted data
- Clears input after selection

#### Styling

- Matches existing search box style: `colors.card` background, `radius.pill` border radius, 52px min height
- Uses `colors.muted` for placeholder text
- Uses `colors.text` for input text
- Dropdown list uses `colors.card` background with `colors.border` separator
- Suggestion rows show main text in `colors.text` (bold) and secondary text in `colors.muted`

### Modified File: `mobile/src/screens/PlannerScreen.tsx`

#### Changes

1. Replace the static `searchBox` View with the `PlacesSearchInput` component
2. Add a handler function `handlePlaceSelected` that:
   - Validates NCR boundary using existing `isInsideNCR`
   - Checks duplicates using existing `isDuplicateStop`
   - Creates a `Stop` object with `id: stop_${Date.now()}`
   - Calls `addStop` from the Zustand store
   - Shows toast messages for validation failures

#### Integration Point

```typescript
const handlePlaceSelected = (place: PlaceResult) => {
  if (!isInsideNCR(place.lat, place.lng)) {
    setToastMsg("This location is outside Metro Manila");
    return;
  }
  if (isDuplicateStop(stops, place.lat, place.lng)) {
    setToastMsg("A stop near here already exists");
    return;
  }
  addStop({
    id: `stop_${Date.now()}`,
    lat: place.lat,
    lng: place.lng,
    label: place.label,
    address: place.address,
  });
};
```

### Dependencies

- `react-native-google-places-autocomplete` — needs to be installed via npm
- No new backend changes required
- No new navigation changes required

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Network error | Library shows "Network error" in dropdown |
| No results | Library shows "No results" message |
| Missing API key | Console warning logged; input renders but search won't work |
| Invalid API key | Google returns error; library shows failure state |

### Considerations

- **Z-index / overlay**: The autocomplete dropdown renders above other content. In the Planner sheet's ScrollView, the dropdown needs `listViewDisplayed` managed carefully or rendered with `position: absolute` and high `zIndex`.
- **Keyboard avoidance**: The sheet may need to expand when the search input is focused so the dropdown is visible.
- **Expo Go compatibility**: `react-native-google-places-autocomplete` is a pure JS library — no native modules needed. Works in Expo Go without issues.

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `mobile/src/components/PlacesSearchInput.tsx` | CREATE | Standalone autocomplete component |
| `mobile/src/screens/PlannerScreen.tsx` | MODIFY | Replace static search box with PlacesSearchInput |
| `mobile/package.json` | MODIFY | Add `react-native-google-places-autocomplete` dependency |
