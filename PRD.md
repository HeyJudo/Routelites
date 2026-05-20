# RouteLite — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** April 30, 2026
**Author:** Group 12 — BSCS 2-4, Polytechnic University of the Philippines
**Status:** Draft — Pending Team Review

---

## 1. Product Overview

### 1.1 What is RouteLite?

RouteLite is a cross-platform mobile application that optimizes delivery routes for riders and small local businesses operating within Metro Manila (NCR). Users input their delivery stops, and the app generates an optimized route plan using **Dijkstra's Algorithm** and **Branch & Bound TSP**, minimizing total travel distance compared to the naive input-order route.

For smaller route sets, RouteLite computes an exact optimal route using Branch & Bound. For larger route sets, RouteLite uses clustered optimization to keep computation practical while still producing one continuous route for the rider.

### 1.2 Problem Statement

Small local businesses — water refilling stations, laundry shops, small food sellers — handle daily deliveries but plan routes by gut feel or input order. This results in roughly 30% more distance traveled due to inefficient route sequences (Bambi NEMT, 2025). Enterprise logistics platforms (Shopee, Lalamove) offer optimization but charge 15-25% commission fees that are prohibitive for small vendors.

RouteLite fills this gap: **free, simple, algorithm-powered route planning** for riders who just need to know the best order to visit their stops.

### 1.3 Target Users

| Persona | Description | Pain Point |
|---------|-------------|------------|
| **Independent Delivery Rider** | Freelance rider doing 5-30 deliveries/day across NCR | Plans routes manually, wastes fuel and time on inefficient sequences |
| **Small Business Owner** | Operates a water refilling station, laundry shop, or food business with self-managed delivery | Can't afford commercial logistics platforms, uses input-order routing |

### 1.4 Course Context

This project is submitted in partial fulfillment of **COSC 203 — Design and Analysis of Algorithms** at PUP-CCIS. The core academic deliverable is the implementation and analysis of:

- **Dijkstra's Algorithm** (Greedy paradigm) — shortest-path computation
- **Branch & Bound: TSP** (Backtracking/B&B paradigm) — optimal route sequencing

---

## 2. Core Algorithms

### 2.1 Dijkstra's Algorithm

**Purpose:** Compute shortest-path road distances between all selected routing nodes.

**How it's used in RouteLite:**
1. Each delivery stop and the store are snapped to their nearest road node in the NCR graph.
2. Dijkstra runs from each selected node to every other selected node.
3. Results form an N×N **distance matrix** (where N = number of stops + store).
4. Path predecessor data is preserved for drawing road-level route lines on the map.

**Complexity:** O((V + E) log V) per source node with a priority queue, where V = graph nodes (~50-100k for NCR) and E = graph edges (~100-200k).

### 2.2 Branch & Bound: Travelling Salesman Problem

**Purpose:** Find the optimal closed tour — the stop order that minimizes total travel distance, starting and ending at the store.

**How it's used in RouteLite:**
1. Takes the distance matrix from Dijkstra as input.
2. Explores the state-space tree of all possible stop orderings.
3. Uses a lower-bound estimate to prune branches that cannot improve on the best known solution.
4. Returns the exact optimal route and its total cost when the stop count is within the Branch & Bound threshold.

**Complexity:** Worst-case O(n!) but aggressive pruning reduces practical runtime to manageable levels for small stop sets. RouteLite's initial tested exact-mode target is 10 delivery stops, with the option to raise the threshold after benchmarking.

**Asymmetric distance note:** Because RouteLite respects one-way roads, the shortest distance from A to B may differ from B to A. The B&B implementation must therefore support an asymmetric distance matrix unless the team explicitly documents a simplifying assumption for the defense build.

### 2.3 Batching Layer (for large stop sets)

When the user inputs more delivery stops than the tested exact-mode threshold, a clustering layer activates. The MVP performance target is exact mode up to 10 stops and clustered mode for at least 11-20 stops. Larger valid stop sets should continue through large-route clustered mode rather than being rejected only because of count.

1. Stops are partitioned into geographic clusters using k-medoids on the distance matrix.
2. B&B runs independently on each cluster.
3. Clusters are chained in a distance-efficient inter-cluster order.
4. The final route is stitched into **one continuous tour**.

**Key rule:** Batching is **invisible to the user.** They see a single optimized route regardless of how many stops they entered.

**Important note:** Batched routes are optimized but not guaranteed to be globally optimal across all stops. Exact optimality is guaranteed only when B&B runs on the full stop set.

**No-limit interpretation:** RouteLite may accept larger stop sets, but exact global B&B is not claimed for unlimited stops. For large inputs, Dijkstra still computes road-network shortest paths, and B&B is applied as a subroutine inside smaller clustered groups.

### 2.4 Naive Route (Baseline)

The naive route follows the **exact order the user entered their stops.** It serves as the baseline comparison to demonstrate the value of algorithmic optimization. This is NOT a heuristic — it is simply the unoptimized input sequence.

---

## 3. Features & Requirements

### 3.1 Feature Priority Matrix

#### MVP (Minimum Viable Product)

These features define the core product and **must ship by defense day.**

| Priority | Feature | Description | Release |
|----------|---------|-------------|--------|
| **P0 — Must Have** | Route optimization engine | Dijkstra + B&B TSP on NCR road graph | **MVP** |
| **P0** | Map-based route planner | Google Maps with stop pins and route polyline | **MVP** |
| **P0** | Stop input (search + map tap) | Google Places Autocomplete + long-press pin drop | **MVP** |
| **P0** | Results with comparison | Naive vs. optimized route toggle on map + stats card | **MVP** |
| **P0** | Algorithm details panel | Defense-focused computation stats and exact/clustered mode metadata | **MVP** |
| **P0** | NCR hard boundary | Reject stops outside Metro Manila | **MVP** |
| **P0** | Onboarding + store setup | One-time store location setup on first launch | **MVP** |
| **P1** | Contextual loading animation | Step-by-step progress during computation | **MVP** |

#### Post-MVP

These features enhance the product but are not required for a successful defense.

| Priority | Feature | Description | Release |
|----------|---------|-------------|--------|
| **P1** | Email/password account | Firebase Auth for user identity if time permits or instructor requires accounts | Post-MVP / Optional |
| **P1** | Route history | Locally cached past routes (keyed by user ID) | Post-MVP |
| **P1** | Start Navigation handoff | Open Google Maps/Waze with optimized waypoints, subject to waypoint limits | Post-MVP |
| **P2** | Share route | Export stop list via messaging apps | Post-MVP |
| **P2** | Saved/favorite stops | Quick-add frequent delivery addresses | Post-MVP |
| **P3 — Stretch** | Real-time traffic option | Add traffic-aware ETA or optional traffic-based routing using TomTom/Google | Stretch |

### 3.2 Functional Requirements

#### FR-01: Onboarding
- First-launch MVP flow: Welcome screen → Set Store Location → Route Planner.
- Optional auth flow, if enabled: Welcome screen → Register/Login → Set Store Location → Route Planner.
- Store location is persisted and reused across sessions.
- Store location can be changed later in Settings.

#### FR-02: Stop Input
- **Search bar** (primary): Powered by Google Places Autocomplete. User types address, place name, or landmark. Results filtered to NCR.
- **Map tap** (secondary): Long-press on map drops a pin at that location.
- Added stops appear as numbered pins on the map and in a collapsible bottom-sheet list.
- Swipe-to-delete on any stop in the list.
- Stop count badge visible on the bottom sheet header.
- Minimum stops to optimize: **1** (comparison view is most useful at ≥2).
- MVP performance target: **20 delivery stops**.
- Exact global optimization mode: **up to the tested B&B threshold** (initial target: 10 stops).
- Large-route mode: **above the tested threshold**, using clustered B&B. For the MVP, 11-20 stops must be tested; larger valid stop sets should be accepted through approximate large-route mode when clustering is implemented.
- Post-test demo target: **50 delivery stops**, only after clustered mode is benchmarked and tested.

#### FR-03: NCR Boundary Enforcement
- A polygon defining Metro Manila's 17 LGUs is enforced.
- Any stop placed outside this boundary is **rejected** with a clear error message.
- Map may display a subtle boundary overlay to communicate the service area.

#### FR-04: Route Optimization
- User taps "Optimize Route" to trigger computation.
- App sends stop coordinates to the Python backend.
- Backend snaps to graph nodes, runs Dijkstra, builds distance matrix, and runs B&B.
- If stop count exceeds the exact B&B threshold, backend clusters stops, runs B&B per cluster, and stitches the route into one continuous tour.
- Returns: optimized stop order, naive stop order, per-leg distances, total distances, distance saved, computation mode, and defense metadata.

#### FR-05: Results Display
- **Map view:** Optimized route drawn as a solid teal/green polyline. Naive route available via toggle as a gray dashed line.
- **Toggle control:** [ Naive ] / [ Optimized ] tabs at top of results view to switch map overlays.
- **Bottom sheet:** Stats card with total distances and savings percentage, ordered stop list with per-leg distances.
- **Algorithm details:** A defense-focused panel or drawer shows computation mode, Dijkstra runs, distance matrix size, B&B branches explored/pruned, batches used, and computation time.
- **Post-MVP "Start Navigation" button:** Opens Google Maps/Waze with optimized waypoints, subject to provider waypoint limits.

#### FR-06: Route History (Post-MVP)
- Past optimized routes are saved to device local storage (AsyncStorage/MMKV).
- Keyed by the user's Firebase UID.
- Accessible from the Route History screen.
- Each entry shows: date, number of stops, total optimized distance, store location.

#### FR-07: Authentication (Optional / Post-MVP)
- Firebase Authentication with email/password registration and login.
- Register fields: full name, email, password, confirm password.
- Login fields: email and password.
- Forgot Password flow sends a reset email through Firebase.
- User profile = Firebase UID, full name, and email.
- Sign-out available in Settings.
- Authentication is not required for the core DAA defense unless mandated by the instructor.

#### FR-08: Offline Handling
- If no internet connection is detected, display a clean offline state: "No internet connection. Connect to optimize your route."
- No offline computation mode in MVP.

### 3.3 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Route computation time (≤10 stops, exact mode) | < 3 seconds |
| Route computation time (11-20 stops, clustered mode) | < 10 seconds |
| Route computation time (21+ stops, large-route clustered mode) | Best effort; must be labeled approximate and may take longer |
| Exactness disclosure | Exact mode and clustered mode are shown in metadata/results |
| App cold start time | < 2 seconds |
| Supported platforms | iOS 14+ / Android 10+ |
| Map tile provider | Google Maps (free tier: 28,500 loads/month) |
| Backend availability during defense | Railway deployment + local backend fallback |
| Defense fallback assets | Prepared graph file, fixed demo addresses, local backend command, and backup screenshots/recording |

---

## 4. Technical Architecture

### 4.1 System Diagram

```
┌────────────────────────────┐          ┌────────────────────────────────┐
│     React Native App       │          │     Python FastAPI Backend      │
│                            │  HTTPS   │                                │
│  ● Google Maps view        │ ◄──────► │  ● NCR road graph (OSM)        │
│  ● Stop input (search/tap) │          │  ● Dijkstra engine             │
│  ● Results display         │          │  ● B&B TSP engine              │
│  ● Optional Firebase Auth  │          │  ● Clustering/batching layer   │
│  ● Local settings/cache    │          │  ● Route computation API       │
│  ● Google Places search    │          │                                │
└────────────────────────────┘          └────────────────────────────────┘
         │                                          │
         ▼                                          ▼
┌─────────────────┐                      ┌──────────────────────┐
│  Optional Auth   │                      │  Railway.app hosting  │
│  (Post-MVP)      │                      │  + local fallback     │
└─────────────────┘                      └──────────────────────┘
```

### 4.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Expo React Native + TypeScript | Faster cross-platform development and easier builds |
| **Map** | `react-native-maps` + Google Maps provider | Battle-tested, familiar to Filipino users |
| **Search** | Google Places Autocomplete API | Superior search quality for Filipino addresses |
| **Auth** | Firebase Authentication (Email/Password) | Optional/Post-MVP identity layer if time permits or instructor requires accounts |
| **Local Storage** | AsyncStorage or MMKV | Store setup, settings, route preferences, and optional route history persistence |
| **Backend** | Python 3.11+ with FastAPI | Clean async API, strong graph library ecosystem |
| **Graph Processing** | `osmnx` preprocessing + custom adjacency list | OSM road extraction while keeping Dijkstra implementation owned by the team |
| **Algorithms** | Custom Dijkstra + custom B&B TSP | Required for DAA implementation and defense; B&B must support asymmetric distance matrices or document any simplification |
| **Hosting** | Railway.app + local fallback | Simple deployment with a safer defense backup |

### 4.3 Road Data Pipeline

```
OSM Planet File (Philippines)
        │
        ▼  osmnx: filter to NCR bounding box
NCR Drivable Road Network
  Bounding box: ~14.35–14.78°N, 120.90–121.15°E
  Filter: drive-only roads, respect one-way
        │
        ▼  export as adjacency list
Graph File (JSON or pickle)
  ~50,000–100,000 nodes
  ~100,000–200,000 edges
  Edge weight = road distance in meters
        │
        ▼  loaded into backend memory at startup
In-Memory Graph (custom adjacency list)
        │
        ▼  per-request computation
Distance Matrix → B&B TSP / Clustered B&B → Optimized Route
```

### 4.4 API Contract

#### `POST /api/optimize`

**Request:**
```json
{
  "store": { "lat": 14.5995, "lng": 120.9842 },
  "stops": [
    { "lat": 14.6010, "lng": 120.9850, "label": "Stop 1" },
    { "lat": 14.6030, "lng": 120.9870, "label": "Stop 2" }
  ]
}
```

**Response:**
```json
{
  "optimized_route": {
    "order": ["store", "stop_2", "stop_1", "store"],
    "total_distance_m": 4200,
    "legs": [
      { "from": "store", "to": "stop_2", "distance_m": 1800, "path": [] },
      { "from": "stop_2", "to": "stop_1", "distance_m": 1100, "path": [] },
      { "from": "stop_1", "to": "store", "distance_m": 1300, "path": [] }
    ]
  },
  "naive_route": {
    "order": ["store", "stop_1", "stop_2", "store"],
    "total_distance_m": 5800,
    "legs": []
  },
  "savings": {
    "distance_m": 1600,
    "percentage": 27.6
  },
  "metadata": {
    "computation_time_ms": 1340,
    "stops_processed": 2,
    "mode": "exact",
    "dijkstra_runs": 3,
    "distance_matrix_size": "3x3",
    "batches_used": 1,
    "branches_explored": 6,
    "branches_pruned": 2,
    "exact_global_optimum": true
  }
}
```

---

## 5. User Flow

### 5.1 First Launch

```
App Opens → Splash → Welcome → Set Store → Route Planner
```

### 5.2 Returning User

```
App Opens → Splash → Route Planner (store already set)
```

### 5.3 Route Planning Flow

```
Route Planner (store pinned, search bar at top)
    ▼
User adds stops (search or long-press map)
    ▼
User taps [ Optimize Route ]
    ▼
Loading ("Mapping stops..." → "Calculating distances..." → "Finding best route...")
    ▼
Results Screen (map + toggle + stats + stop list)
    ▼
[ Start Navigation ] → opens Google Maps/Waze with waypoints (Post-MVP)
```

### 5.4 Navigation Map

```
Splash → Onboarding → Set Store
                                     ↓
          Settings ← ─ ─ ─ ─  Route Planner (Main)
                                ↓
       Route History (Post-MVP) ← ─ ─  Optimize → Loading → Results
                                                  ↓      ↓
                                      Navigate (Post-MVP)   Share (Post-MVP)
```

---

## 6. Screen Inventory

| # | Screen | Key Elements |
|---|--------|-------------|
| 1 | **Splash** | App logo, brief loading indicator |
| 2 | **Welcome** | Value prop illustration, "Get Started" CTA |
| 3 | **Register/Login** | Optional/Post-MVP email account creation, login, forgot password |
| 4 | **Set Store Location** | Map + search bar, "Confirm Store" button |
| 5 | **Route Planner** | Map (store pinned), search bar, stop list bottom sheet, "Optimize Route" button |
| 6 | **Loading** | Contextual step-by-step animation |
| 7 | **Results** | Map with route polyline, naive/optimized toggle, stats card, stop list |
| 8 | **Route History** | List of past routes (date, stops, distance) — Post-MVP |
| 9 | **Settings** | Change store location, account info, sign out |

---

## 7. Design Principles

1. **Map-first layout.** The map is always the hero. UI chrome stays in bottom sheets and overlays.
2. **Frictionless input.** Adding a stop should take < 5 seconds.
3. **Obvious value.** Savings comparison visible within 1 second of seeing results.
4. **No clutter.** Computation details hidden by default.
5. **Familiar patterns.** Follow Grab/Google Maps conventions.

**Design inspiration:** Circuit Route Planner — map-first layout with numbered stops and scrollable stop list.

**Color direction:** Clean whites/light grays, teal/green accent for optimized routes, gray for naive routes.

---

## 8. Team Structure & Roles

| Role | Primary Scope | Secondary Scope |
|------|--------------|----------------|
| **🎨 Frontend Lead** | Expo React Native app logic, navigation, state management, API integration, Google Maps + Places wiring | Documentation (technical sections: system architecture, tech stack) |
| **🧠 Backend Lead** | Python FastAPI, Dijkstra implementation, B&B TSP implementation, batching/clustering logic, OSM data pipeline, Railway deployment | Documentation (algorithm/methodology sections of the paper) |
| **🎯 UI/UX Developer** | Screen design (Figma/Stitch), React Native visual layer (StyleSheets, component styling, animations, loading states, color system, empty/error states), app icon + splash | QA (edge-case testing on real devices) |
| **🔧 Backend Sub-lead** | Supports Backend Lead on algorithm implementation, API contract enforcement (frontend ↔ backend integration), environment configs, build pipeline, and optional Firebase setup | QA + Documentation (intro, related works, objectives, conclusion, defense slides, demo rehearsal) |

### Frontend Lead ↔ UI/UX Developer Boundary

| Frontend Lead builds | UI/UX Developer builds |
|---------------------|----------------------|
| Navigation/routing (React Navigation) | Design system (colors, typography, spacing tokens) |
| State management | Component styling (StyleSheet objects) |
| API calls to backend | Loading animation component |
| Map logic (markers, polylines, events) | Bottom sheet look & feel |
| Google Places integration | Onboarding screen visuals |
| Post-MVP route history storage logic | Results card / stats card design |
| "Optimize Route" button logic | Map overlay styling (route colors, pins) |
| | Empty states, error states, offline state |

---

## 9. Timeline (5 Weeks)

| Week | Dates | Milestone | Deliverables |
|------|-------|-----------|-------------|
| **1** | May 1–7 | Foundation | Expo RN init, FastAPI scaffold, NCR graph extracted, Railway/local backend setup |
| **2** | May 8–14 | Core Engine | Dijkstra + B&B working, basic map screen, `/api/optimize` functional |
| **3** | May 15–21 | Integration | Frontend ↔ Backend connected, route on map, stop input functional, algorithm details visible |
| **4** | May 22–28 | Polish | Toggle comparison, loading animation, edge cases, UX refinement |
| **5** | May 29–Jun 4 | Ship | Paper finalized, defense slides, demo rehearsed, deployment verified |

---

## 10. Risks & Mitigations

### 10.1 Defense Fallback Plan

Defense reliability is part of the MVP. The team should prepare:

- A local backend command that starts FastAPI with the preprocessed NCR graph.
- A checked-in or bundled graph file for the demo route area.
- Fixed NCR demo stops that are known to be reachable.
- Backup screenshots or a short recording of the successful route optimization flow.
- A prepared explanation of exact mode vs clustered mode.

| Risk | Mitigation |
|------|-----------|
| B&B too slow for 20+ stops | Use exact B&B only up to tested threshold; clustered B&B above threshold with clear approximate-mode metadata |
| Google Places API cost overrun | Restrict usage during testing; prepare fixed demo addresses |
| NCR graph too large for backend memory | Prune minor roads, compress graph |
| Railway free tier limits | Test deployment early, keep local backend command ready, and prepare fixed demo stops/screenshots |
| React Native map lag on low-end Android | Limit polyline detail, lazy-load tiles |
| Traffic API cost or rate limits | Keep traffic as Post-MVP; start with ETA overlay only |

---

## 11. Stretch Goals (Post-MVP)

1. Real-time traffic option (Google Routes API or TomTom Routing API)
2. Saved/favorite stops for repeat deliveries
3. Multi-trip mode with vehicle capacity limits
4. Backend-persisted trip history (Firestore)
5. Route sharing via deep link or image export
6. Advanced analytics dashboard beyond the MVP defense metadata panel

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Optimized route equal to or shorter than naive | 100% of cases (≥3 stops) |
| Average distance savings | ≥15% |
| Computation time (≤10 stops, exact mode) | < 3 seconds |
| Exactness labeling | 100% of results identify exact vs clustered mode |
| Defense demo crash rate | 0 |

---

## 13. Open Decisions

| Item | Status |
|------|--------|
| Exact B&B threshold (12 vs 15) | Determined by runtime testing and displayed in defense metadata |
| NCR boundary polygon source | Prefer a checked-in GeoJSON file derived from OSM/NAMRIA/admin boundaries |
| B&B lower bound function | Algorithm Engineer decides; must work with asymmetric distance matrices or document simplification |
| Team member role assignments | Team decides |

---

*This document is a living artifact. Update as decisions are made during development.*
