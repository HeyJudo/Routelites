# Implementation Plan: Google Places Autocomplete

## Overview

This plan implements the Google Places Autocomplete search input for the RouteLite mobile app. It covers installing the dependency, creating the standalone `PlacesSearchInput` component, integrating it into the `PlannerScreen`, and verifying the build compiles without errors.

## Tasks

- [x] 1. Install dependency and set up project
  - [x] 1.1 Install react-native-google-places-autocomplete
    - Run `npm install react-native-google-places-autocomplete` in the `mobile/` directory
    - Verify the package is added to `package.json` dependencies
    - _Requirements: 1.1, 1.2_

  - [ ] 1.2 Verify build compiles without errors
    - Run `npx expo start` to confirm no build errors after adding the dependency
    - _Requirements: 7.1, 7.3_

- [x] 2. Create PlacesSearchInput component
  - [x] 2.1 Implement PlacesSearchInput with autocomplete functionality
    - Create file `mobile/src/components/PlacesSearchInput.tsx`
    - Define `PlaceResult` type with `lat`, `lng`, `label`, `address` fields
    - Define `PlacesSearchInputProps` with `onPlaceSelected` callback and optional `placeholder`
    - Import and configure `GooglePlacesAutocomplete` from the library
    - Set query params: `key` from env, `language: "en"`, `components: "country:ph"`
    - Set location bias: `location: "14.5995,120.9842"`, `radius: "25000"`
    - Set `minLength: 2` and `fetchDetails: true`
    - On press, extract lat/lng from `details.geometry.location` and label/address from `data`
    - Call `onPlaceSelected` with the extracted `PlaceResult`
    - Clear input text after successful selection
    - Export the component as a named export
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3_

  - [x] 2.2 Add styling and UX polish
    - Style the component to match the app theme (card background, pill radius, 52px height)
    - Style the dropdown suggestions list (card background, border separators)
    - Add search icon on the left side of the input field
    - Add clear/dismiss button when input contains text
    - Render suggestion rows with place name in bold and address in muted text
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.3 Add error handling and environment validation
    - Display console warning if `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is missing
    - Handle network errors gracefully (no crash)
    - Handle zero predictions with "No results found" message
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Integrate PlacesSearchInput into PlannerScreen
  - [x] 3.1 Replace static search box with PlacesSearchInput
    - Import `PlacesSearchInput` in `PlannerScreen.tsx`
    - Replace the static `searchBox` View (the one with "Add delivery stop" text) with `<PlacesSearchInput>`
    - Verify the dropdown renders above the sheet content (z-index handling)
    - _Requirements: 1.1, 1.3_

  - [x] 3.2 Implement handlePlaceSelected with validation logic
    - Add `handlePlaceSelected` function that validates coordinates with `isInsideNCR(place.lat, place.lng)`
    - Show toast "This location is outside Metro Manila" if outside NCR
    - Check duplicates with `isDuplicateStop(stops, place.lat, place.lng)`
    - Show toast "A stop near here already exists" if duplicate
    - Create a Stop object: `{ id: "stop_" + Date.now(), lat, lng, label, address }`
    - Call `addStop()` from the Zustand store
    - Pass `handlePlaceSelected` as the `onPlaceSelected` prop
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [x] 4. Checkpoint - Verify integration
  - App builds without errors, Places search works end-to-end.

- [x] 5. UI Improvements (post-integration)
  - [x] 5.1 Replaced inline PlacesSearchInput with full-screen PlacesSearchModal
  - [x] 5.2 Added inline "✓ Added" confirmation cards inside the search modal
  - [x] 5.3 Fixed false "Added" confirmation for outside-NCR locations (onPlaceSelected returns boolean)
  - [x] 5.4 Added request-versioning to prevent stale predictions from race conditions
  - [x] 5.5 Added timeout cleanup on unmount to prevent memory leaks
  - [x] 5.6 Implemented 3-level draggable sheet (peek/collapsed/expanded) for full-map viewing
  - [x] 5.7 Added stop delete (trash icon) directly in the Planner sheet stop list

- [ ] 6. Write automated tests (optional)
  - [ ]* 6.1 Write unit tests for NCR validation logic
    - Test that coordinates inside NCR bounding box pass validation
    - Test that coordinates outside NCR bounding box are rejected
    - Test boundary edge cases (exact boundary coordinates)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.2 Write unit tests for duplicate stop detection
    - Test that stops with same coordinates are detected as duplicates
    - Test that stops with different coordinates are not duplicates
    - _Requirements: 3.2_

  - [ ]* 6.3 Write unit tests for handlePlaceSelected integration logic
    - Test that valid NCR place creates a stop with correct shape
    - Test that outside-NCR place triggers rejection toast
    - Test that duplicate place triggers duplicate toast
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design does not include correctness properties, so no property-based tests are included
- `react-native-google-places-autocomplete` is a pure JS library compatible with Expo Go (no native modules)
- Unit tests validate NCR boundary logic and stop creation independently of the Google Places API

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["5.1", "5.2"] },
    { "id": 6, "tasks": ["5.3"] }
  ]
}
```
