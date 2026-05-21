# RouteLite MVP UI Handoff Design

Date: 2026-05-21

## Purpose

This handoff defines the MVP UI scope for RouteLite's UI/UX Developer and for generating the first full-app Google Stitch wireframe. RouteLite is a DAA-focused mobile route optimizer for delivery riders and small local businesses in Metro Manila/NCR. The UI must support the core flow: set a store, add stops, optimize the route, compare naive versus optimized routing, and expose algorithm metadata for defense.

The MVP should feel like a clean map-first utility with a soft home-screen feel. It should not look like a delivery marketplace, wallet app, booking app, or rider operations tracker.

## Design Direction

- Use a clean, light, map-first mobile interface.
- Treat the map as the primary visual anchor on Planner/Home and Results.
- Use rounded bottom sheets, compact cards, and soft surfaces.
- Use teal/green or blue-green for the optimized route.
- Use gray dashed styling for the naive/input-order route.
- Use orange/red only for warnings, invalid locations, backend errors, or offline states.
- Use vector icons from one icon family; do not use emoji as structural icons.
- Keep touch targets at least 44pt, with clear pressed and disabled states.
- Respect mobile safe areas for headers, map controls, bottom sheets, tab bars, and CTA bars.

## Navigation Model

First-launch flow:

```text
Splash -> Welcome -> Set Store -> Planner/Home
```

After store setup, the app uses a persistent bottom tab bar with three tabs:

1. Planner
2. Results
3. Settings

The bottom tab bar must not appear on Splash, Welcome, Set Store, or Loading. Loading should behave as a focused transition state after tapping Optimize.

## Screen 1: Splash

Purpose: show quick brand identity while the app initializes.

Required UI:

- RouteLite logo or simple route-pin mark.
- App name: `RouteLite`.
- Subtitle: `Smarter delivery routes for Metro Manila`.
- Loading indicator or subtle route-line animation.

Do not include login, onboarding carousel controls, or bottom tabs.

## Screen 2: Welcome

Purpose: introduce the MVP value and lead first-time users into store setup.

Required UI:

- RouteLite logo/name.
- Map or route illustration.
- Headline: `Plan better delivery routes`.
- Supporting copy: `Add stops, optimize the order, and compare your route against the original input order.`
- Primary CTA: `Get started`.
- Optional secondary CTA: `Try demo route`, only if the demo route is available in implementation.

Do not create an onboarding carousel for MVP. More onboarding screens can be post-MVP.

## Screen 3: Set Store

Purpose: save the rider or business starting point.

Required UI:

- Header: `Set your store location`.
- Search input: `Search store or pickup location`.
- Secondary action: `Use current location`.
- Map preview with selected store pin.
- Selected location card or bottom sheet with:
  - location name
  - address
  - NCR validation status
- Primary CTA: `Save store location`.

Required states:

- Empty state when no location is selected.
- Loading state while searching or checking the location.
- GPS permission denied state.
- Outside NCR or invalid location state.

The screen should be search-first, with a map preview below the search area.

## Screen 4: Planner/Home

Purpose: act as the user's home screen and route draft builder.

Required UI:

- Large or full map area.
- Store pin and delivery stop pins.
- Floating menu/settings button.
- Optional floating recenter and map-layer controls.
- Half-height bottom sheet.
- Home-style greeting inside the sheet, such as `Ready to plan today's route?`.
- Saved store summary under the greeting.
- Stop search input: `Add delivery stop`.
- Route status text:
  - `0 stops`
  - `3 stops - Exact mode`
  - `11 stops - Approximate mode`
- Numbered stop list with stop name/address.
- Remove/reorder affordance if implementation supports it.
- Primary CTA fixed in the sheet: `Optimize route`.
- Secondary/demo action: `Load demo route`, if demo data is available.

Required states:

- Empty route draft.
- Stops added.
- 11+ stop warning that route uses approximate clustered mode when available.
- Invalid or outside-NCR stop.
- Optimize disabled when there are no stops.

Do not include Delivered, Failed, live delivery tracking, wallet, bookings, rewards, or profile widgets.

## Screen 5: Loading

Purpose: show progress while route optimization runs.

Required UI:

- Map or soft route background.
- Title: `Optimizing route`.
- Progress step messages:
  - `Mapping stops`
  - `Calculating shortest paths`
  - `Finding best stop order`
- Small algorithm note: `Using Dijkstra + Branch and Bound`.
- Optional cancel/back control if implementation supports cancelling safely.

Required states:

- Normal loading.
- Slow request message.
- Backend error with retry.
- Offline/no connection message.

Do not show the bottom tab bar while loading.

## Screen 6: Results

Purpose: show the optimized route, compare it with the naive/input-order route, and make the stop order clear.

Required UI:

- Large map with numbered pins.
- Optimized route polyline.
- Naive/input-order route polyline available through toggle.
- Bottom sheet header:
  - `Optimized route`
  - compact stats, such as `18.5 km - 5 stops - 23% saved`
- Segmented route toggle:
  - `Optimized`
  - `Naive`
  - `Compare`
- Ordered stop list:
  - `Start: Store`
  - `1. Stop name / address`
  - `2. Stop name / address`
  - `Return: Store`
- Each stop row may show:
  - optimized order number
  - original input position, such as `Originally 4th`
  - leg distance
- Buttons:
  - `Refine route`
  - `Algorithm details`

The ordered stop list is required. It must be clear that the optimized result may reorder the user's original stops.

### Algorithm Details Sheet

The `Algorithm details` button opens a secondary sheet or modal. It should include:

- Computation mode: exact or clustered.
- Stops processed.
- Distance matrix size.
- Dijkstra runs.
- Branches explored.
- Branches pruned.
- Batches used.
- Exact global optimum: yes/no.
- Computation time.
- Short explanation:
  - Dijkstra computes shortest road paths.
  - Branch and Bound searches for the best stop order.
  - Naive route follows the original input order.

Required states:

- No results yet.
- Successful exact result.
- Approximate clustered result.
- Error/unavailable result.

Do not include Delivered/Failed actions in MVP. Delivery progress controls are post-MVP.

## Screen 7: Settings

Purpose: provide MVP support and demo controls only.

Required UI:

- Store location section:
  - current saved store
  - `Change store location`
- Connection section:
  - backend/API status: connected, demo backend, or cannot reach backend
  - `Test connection`
- Demo section:
  - `Load demo route`
  - `Clear route draft`
- About section:
  - RouteLite
  - `Dijkstra + Branch and Bound`
  - app version if available

Do not include profile/account, wallet, notifications, theme settings, delivery status settings, or route history in MVP settings.

## Reusable Components

The UI dev should design these as reusable pieces:

- App logo/mark.
- Bottom tab bar with Planner, Results, and Settings.
- Map control buttons.
- Search input for store and stop search.
- Bottom sheet shell.
- Primary and secondary buttons.
- Segmented route toggle.
- Store location card.
- Stop row with number, label, address, and optional original order.
- Route stats summary.
- Warning/error chip.
- Loading/progress state.
- Empty state block.
- Algorithm details sheet.

## Out of Scope for MVP

- Firebase auth and user profile.
- Wallet, payments, booking, rewards, or marketplace services.
- Route history.
- Delivered/Failed delivery status controls.
- Live delivery execution workflow.
- Notifications.
- Multi-screen onboarding carousel.
- Start Navigation handoff to Google Maps or Waze.
- Share route.
- Real-time traffic.

## Google Stitch Prompt Direction

Generate a seven-screen mobile app wireframe for RouteLite, a clean map-first route optimization app for Metro Manila delivery riders. Use a light professional style with soft rounded bottom sheets, compact home widgets, numbered map pins, and teal/green optimized-route accents. The app should include Splash, Welcome, Set Store, Planner/Home, Loading, Results, and Settings. The Planner/Home and Results screens should be map-first with half-height bottom sheets. Avoid marketplace, wallet, account, booking, reward, notification, and delivery-status features.

## UI Dev Task Summary

Design all seven MVP screens and the reusable visual components needed by the frontend lead. Start with Planner/Home and Results because they unblock the main route-planning and route-comparison experience. Keep the screens aligned to the current backend API and MVP scope. Mark post-MVP ideas clearly as future work instead of designing them into the current flow.
