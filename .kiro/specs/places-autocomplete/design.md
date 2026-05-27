# Design Document

## Overview

This design describes the Google Places Autocomplete integration for RouteLite. The feature uses a full-screen search modal (`PlacesSearchModal`) that opens when the user taps the search box on the Planner screen. The modal handles autocomplete queries directly via the Google Places API (not through the `react-native-google-places-autocomplete` library wrapper), provides inline "Added" confirmation, and emits place selection events to the parent for NCR validation. A legacy inline component (`PlacesSearchInput`) also exists but is not used in the primary flow.

## Architecture

### Component Structure

```text
PlannerScreen.tsx
  ├── Search box (Pressable tap target) → opens PlacesSearchModal
  └── PlacesSearchModal.tsx (full-screen Modal)
        ├── TextInput (search query)
        ├── Predictions list (from Google Places Autocomplete API)
        └── Added stops confirmation cards
```

### Data Flow

```text
User taps search box → PlacesSearchModal opens
                                ↓
User types → direct fetch to Google Places Autocomplete API
                                ↓
            Suggestions displayed in scrollable list
                                ↓
        User taps a suggestion
                                ↓
    fetch Place Details API → extract lat, lng, label, address
                                ↓
    onPlaceSelected callback fires to PlannerScreen (returns boolean)
                                ↓
PlannerScreen validates: isInsideNCR? isDuplicateStop?
                                ↓
    If valid → addStop(stop), return true → modal shows "✓ Added"
    If invalid → show MapToast, return false → no confirmation shown
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
| `mobile/src/components/PlacesSearchModal.tsx` | CREATE | Full-screen search modal with direct API calls, confirmation UI, race-condition handling |
| `mobile/src/components/PlacesSearchInput.tsx` | CREATE | Legacy inline autocomplete component (kept as fallback, not used in primary flow) |
| `mobile/src/screens/PlannerScreen.tsx` | MODIFY | Added search box tap target, PlacesSearchModal integration, stop delete buttons, 3-level sheet |
| `mobile/package.json` | MODIFY | Added `react-native-google-places-autocomplete` dependency |
