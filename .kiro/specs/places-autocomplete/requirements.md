# Requirements Document

## Introduction

This feature adds a Google Places Autocomplete search input component (`PlacesSearchInput`) to the RouteLite mobile app. The component allows users to search for delivery stops by name or address using the Google Places API, validates that selected locations fall within Metro Manila (NCR), and returns structured stop data via a callback. The component is built in isolation for later integration into the PlannerScreen.

## Glossary

- **PlacesSearchInput**: A React Native component that renders a text input with autocomplete suggestions powered by the Google Places API.
- **NCR**: National Capital Region (Metro Manila), the geographic boundary within which delivery stops must be located.
- **Stop**: A data object representing a delivery stop with the shape `{ id: string, lat: number, lng: number, label: string, address: string }`.
- **Google_Places_API**: The Google Places Autocomplete service that returns place predictions based on text input.
- **NCR_Bounding_Box**: The approximate geographic rectangle (lat 14.35–14.78, lng 120.9–121.15) used to validate stop locations.
- **Suggestion**: A single autocomplete prediction returned by the Google Places API containing a place description and place ID.
- **Place_Details**: The full details (geometry, name, formatted address) returned by the Google Places API for a selected place ID.

## Requirements

### Requirement 1: Autocomplete Text Input

**User Story:** As a delivery driver, I want to type a place name or address and see matching suggestions, so that I can quickly find delivery stops without memorizing exact addresses.

#### Acceptance Criteria

1. THE PlacesSearchInput SHALL render a text input field that accepts user-typed search queries.
2. WHEN the user types at least 2 characters, THE PlacesSearchInput SHALL request autocomplete predictions from the Google_Places_API.
3. WHEN predictions are returned, THE PlacesSearchInput SHALL display them as a scrollable list of Suggestions below the input field.
4. THE PlacesSearchInput SHALL bias autocomplete results toward the NCR geographic area by providing location bias coordinates (lat 14.5995, lng 120.9842) and a radius of 25000 meters.
5. THE PlacesSearchInput SHALL restrict autocomplete results to the Philippines (country code "ph").

### Requirement 2: Place Selection and Data Extraction

**User Story:** As a delivery driver, I want to tap a suggestion and have the app extract the location details, so that I can add it as a delivery stop without manual coordinate entry.

#### Acceptance Criteria

1. WHEN the user taps a Suggestion, THE PlacesSearchInput SHALL request Place_Details from the Google_Places_API using the selected place ID.
2. WHEN Place_Details are returned, THE PlacesSearchInput SHALL extract the latitude, longitude, place name, and formatted address.
3. WHEN Place_Details are successfully extracted, THE PlacesSearchInput SHALL construct a Stop object with a unique generated id, the extracted lat, lng, the place name as label, and the formatted address as address.

### Requirement 3: NCR Boundary Validation

**User Story:** As a delivery driver, I want the app to reject stops outside Metro Manila, so that I only add valid delivery locations within my service area.

#### Acceptance Criteria

1. WHEN a Stop object is constructed from Place_Details, THE PlacesSearchInput SHALL validate that the latitude and longitude fall within the NCR_Bounding_Box using the existing isInsideNCR utility function.
2. IF the selected place is outside the NCR_Bounding_Box, THEN THE PlacesSearchInput SHALL display an inline error message stating "This location is outside Metro Manila".
3. IF the selected place is outside the NCR_Bounding_Box, THEN THE PlacesSearchInput SHALL NOT invoke the onStopSelected callback.
4. WHEN the selected place is inside the NCR_Bounding_Box, THE PlacesSearchInput SHALL invoke the onStopSelected callback with the constructed Stop object.

### Requirement 4: Callback Interface

**User Story:** As a developer integrating PlacesSearchInput, I want a clear callback prop interface, so that I can handle selected stops in the parent component.

#### Acceptance Criteria

1. THE PlacesSearchInput SHALL accept an onStopSelected prop of type `(stop: Stop) => void`.
2. WHEN a valid stop is selected and passes NCR validation, THE PlacesSearchInput SHALL call onStopSelected exactly once with the Stop object.
3. THE PlacesSearchInput SHALL clear the text input field after successfully invoking onStopSelected.

### Requirement 5: Error Handling

**User Story:** As a delivery driver, I want clear feedback when something goes wrong with the search, so that I know the issue and can try again.

#### Acceptance Criteria

1. IF the EXPO_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is empty or undefined, THEN THE PlacesSearchInput SHALL display a persistent message "Search unavailable — API key missing".
2. IF the Google_Places_API returns a network error or timeout, THEN THE PlacesSearchInput SHALL display an inline error message "Network error — check your connection".
3. IF the Google_Places_API returns zero predictions, THEN THE PlacesSearchInput SHALL display a message "No results found" in the suggestions area.
4. WHEN an error message is displayed, THE PlacesSearchInput SHALL allow the user to continue typing to retry the search.

### Requirement 6: Visual Styling and UX

**User Story:** As a delivery driver, I want the search input to match the app's look and feel, so that the experience feels cohesive and polished.

#### Acceptance Criteria

1. THE PlacesSearchInput SHALL use the app's teal/green color theme (primary color #00796b) for focus states and active elements.
2. THE PlacesSearchInput SHALL display a search icon on the left side of the input field.
3. THE PlacesSearchInput SHALL display a clear/dismiss button when the input field contains text.
4. THE PlacesSearchInput SHALL render suggestion rows with the place name in bold and the address in muted text below.
5. WHILE the Google_Places_API request is in progress, THE PlacesSearchInput SHALL display a loading indicator within the suggestions area.

### Requirement 7: Component Isolation

**User Story:** As a developer, I want PlacesSearchInput to be self-contained with no dependencies on screen-level state, so that I can integrate it into any screen later.

#### Acceptance Criteria

1. THE PlacesSearchInput SHALL NOT import or depend on any screen-level component or navigation context.
2. THE PlacesSearchInput SHALL accept all configuration through props (onStopSelected callback, optional placeholder text).
3. THE PlacesSearchInput SHALL be exported as a named export from `mobile/src/components/PlacesSearchInput.tsx`.
