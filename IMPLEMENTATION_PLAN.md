# RouteLite MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` or `subagent-driven-development` before implementing this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a defense-ready DAA-focused mobile route optimizer that compares a naive input-order route against an optimized route computed with Dijkstra's Algorithm and Branch and Bound TSP.

**Architecture:** RouteLite uses an Expo React Native mobile app as a lightweight map-first client and a Python FastAPI backend for all heavy route computation. The backend first proves the algorithm pipeline on a small demo graph, then switches to a preprocessed Metro Manila/NCR OpenStreetMap road graph with nearest-node snapping and NCR boundary validation.

**Tech Stack:** Expo React Native, TypeScript, Google Maps, Google Places, Python 3.11+, FastAPI, custom Dijkstra, custom Branch and Bound TSP, OpenStreetMap, OSMnx, Railway, local FastAPI fallback.

---

## 1. Locked MVP Scope

RouteLite's MVP is a polished algorithm demonstration wrapped in a usable mobile interface. It is not a complete production logistics platform.

### MVP Includes

- Expo React Native mobile app.
- Google Maps display.
- Google Places search.
- Store location setup.
- Delivery stop input by search or map tap.
- NCR boundary validation.
- FastAPI backend.
- `GET /health`.
- `POST /api/optimize`.
- Demo graph for early algorithm proof.
- Preprocessed NCR OSM road graph for final demo.
- Custom Dijkstra implementation.
- Custom Branch and Bound TSP implementation.
- Naive input-order route baseline.
- Optimized route result.
- Exact mode and clustered mode labels.
- Algorithm details panel for defense metadata.
- Local backend fallback for defense.
- Fixed demo stops and backup screenshots/recording.

### Post-MVP Only

- Firebase Authentication.
- Route history.
- Saved/favorite stops.
- Google Maps/Waze navigation handoff.
- Route sharing.
- Real-time traffic.
- Cloud-synced user data.

---

## 2. Stop Count and Exactness Policy

RouteLite separates **road graph nodes** from **delivery stops**.

- Road graph nodes are OSM intersections/road points. The backend may load tens of thousands of road graph nodes because Dijkstra is designed for large graphs.
- Delivery stops are user-selected destinations. Exact Branch and Bound is limited by factorial growth.

### MVP Policy

| Input Size | Mode | Claim |
|---:|---|---|
| 1-10 delivery stops | Exact mode | Full-set Branch and Bound; exact global optimum for the selected distance matrix |
| 11-20 delivery stops | Clustered mode | Optimized approximate route; not globally exact |
| 21+ delivery stops | Large-route clustered mode | Accepted as approximate/batched optimization; not globally exact and not part of the initial performance guarantee |

### Post-Test Policy

The MVP performance target is 20 delivery stops, but this is not a hard product input cap. The final product should accept larger stop counts through large-route clustered mode, with exactness and runtime limitations clearly disclosed. A 50-stop demo target should be attempted only after clustered mode is benchmarked and tested.

Defense wording:

> RouteLite can load a large road graph for Metro Manila, but exact global TSP optimization is only claimed up to the tested Branch and Bound threshold. For larger stop sets, RouteLite accepts the input through clustered Branch and Bound and labels the result as approximate.

---

## 3. Roles

The roles are defined but not fully assigned yet.

| Role | Primary Scope | Notes |
|---|---|---|
| Lead Developer / Backend Lead | System architecture, FastAPI, algorithms, graph pipeline, API contract, integration decisions | Currently owned by Jude |
| Frontend Lead | Expo app, navigation, state, API integration, map events, route rendering | To assign |
| UI/UX Developer | Screens, styling, layout, pins, bottom sheets, loading/results visuals, error states | To assign |
| QA + Docs / Backend Support | Testing, fixed demo data, defense script, screenshots, README commands, backend support | To assign |

---

## 4. Dependencies

### Backend MVP Dependencies

Create `backend/requirements.txt` with:

```txt
fastapi
uvicorn[standard]
pydantic
pytest
httpx
ruff
```

### Backend Graph/Data Dependencies

Add these when Phase 4 starts:

```txt
osmnx
networkx
geopandas
shapely
numpy
scipy
scikit-learn
```

### Frontend MVP Dependencies

Install through Expo/npm:

```txt
expo
react-native
typescript
react-native-maps
react-native-google-places-autocomplete
@react-native-async-storage/async-storage
@react-navigation/native
@react-navigation/native-stack
react-native-safe-area-context
react-native-screens
@gorhom/bottom-sheet
react-native-gesture-handler
react-native-reanimated
```

### External Services

- Google Maps SDK for Android.
- Google Maps SDK for iOS.
- Google Places API.
- Railway for deployed backend.
- Local FastAPI backend for defense fallback.

### Post-MVP Dependencies

```txt
firebase
expo-linking
expo-sharing
expo-file-system
```

Optional traffic integrations:

```txt
TomTom Routing API
Google Routes API
httpx
APScheduler
Redis
Celery
```

Traffic remains Post-MVP. The backend stays Python/FastAPI if TomTom is added.

---

## 5. API Contract

### `GET /health`

Response:

```json
{
  "status": "ok",
  "graph_loaded": true,
  "graph_mode": "demo"
}
```

### `POST /api/optimize`

Request:

```json
{
  "store": {
    "lat": 14.5995,
    "lng": 120.9842,
    "label": "Store"
  },
  "stops": [
    {
      "id": "stop_1",
      "lat": 14.601,
      "lng": 120.985,
      "label": "Stop 1"
    }
  ]
}
```

Response:

```json
{
  "optimized_route": {
    "order": ["store", "stop_1", "store"],
    "total_distance_m": 2400,
    "legs": [
      {
        "from": "store",
        "to": "stop_1",
        "distance_m": 1200,
        "path": [
          { "lat": 14.5995, "lng": 120.9842 },
          { "lat": 14.601, "lng": 120.985 }
        ]
      }
    ]
  },
  "naive_route": {
    "order": ["store", "stop_1", "store"],
    "total_distance_m": 2400,
    "legs": []
  },
  "savings": {
    "distance_m": 0,
    "percentage": 0
  },
  "metadata": {
    "mode": "exact",
    "stops_processed": 1,
    "dijkstra_runs": 2,
    "distance_matrix_size": "2x2",
    "branches_explored": 1,
    "branches_pruned": 0,
    "batches_used": 1,
    "exact_global_optimum": true,
    "computation_time_ms": 18
  }
}
```

---

## 6. Timeline Baseline

Current planning date: May 20, 2026.

| Dates | Target |
|---|---|
| May 20-21 | Phase 0 and Phase 1A-1B |
| May 22-23 | Phase 1C-1E |
| May 24-25 | Phase 2 |
| May 26-27 | Phase 3 |
| May 28-30 | Phase 4 |
| May 31-June 2 | Phase 5 |
| June 3-4 | Buffer, rehearsal, docs, slides, fixes |

Implementation status as of the latest work:

- Phase 0: implemented.
- Phase 1: implemented on the demo graph; backend tests pass.
- Phase 2A: implemented.
- Phase 2B: implemented with `react-native-maps`, demo NCR data, numbered stop markers, long-press map stop creation, and a custom draggable Planner sheet. Sheet now supports 3 snap levels (peek/collapsed/expanded) for full-map viewing.
- Phase 2C: implemented with persisted route draft state, store persistence, stop add/remove/reorder, local validation, and settings actions. Stop deletion is now available directly from the Planner sheet stop list.
- Phase 2D: implemented for the stack flow with `mockOptimizeResponse`, Loading progress steps, and Results rendering mock route data and metadata.
- Google Places Autocomplete: implemented as a full-screen search modal (`PlacesSearchModal`) with Philippines/NCR-biased results, inline "Added" confirmation, NCR boundary validation, duplicate stop prevention, and request race-condition handling. The `PlacesSearchInput` inline component also exists but the modal is the primary UX.
- The `Results` tab itself still shows an empty state until Phase 3 adds shared/live integration.
- Current next target: Phase 3A (API client to wire real backend optimization).
- Phase 3B/3C and Phase 4+ are not implemented yet.

---

## 7. Phase 0: Project Setup

**Goal:** Make the repo buildable and give every teammate a clear place to work.

**Owner:** Lead Developer / Backend Lead with support from Frontend Lead.

### Phase 0A: Backend Scaffold

**Files:**

- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/__init__.py`

Steps:

- [ ] Create the `backend/` folder structure.
- [ ] Add backend MVP dependencies to `backend/requirements.txt`.
- [ ] Create a FastAPI app in `backend/app/main.py`.
- [ ] Add `GET /health`.
- [ ] Run `python -m venv .venv` from `backend/`.
- [ ] Run `.venv\Scripts\activate` on Windows PowerShell.
- [ ] Run `pip install -r requirements.txt`.
- [ ] Run `uvicorn app.main:app --reload`.
- [ ] Visit `http://127.0.0.1:8000/health`.

Expected health response:

```json
{
  "status": "ok",
  "graph_loaded": true,
  "graph_mode": "demo"
}
```

### Phase 0B: Frontend Scaffold

**Files:**

- Create: `mobile/`
- Create: `mobile/app.json`
- Create: `mobile/package.json`
- Create: `mobile/src/`

Steps:

- [ ] Create the Expo app under `mobile/`.
- [ ] Install TypeScript.
- [ ] Install React Navigation.
- [ ] Install map and UI dependencies.
- [ ] Add `.env.example` with API URL and Google API key variable names.
- [ ] Run `npx expo start`.

Environment variables:

```txt
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=replace_with_google_maps_key
```

### Phase 0C: Shared Project Commands

**Files:**

- Create or modify: `README.md`

Steps:

- [ ] Add backend setup commands.
- [ ] Add frontend setup commands.
- [ ] Add local defense commands.
- [ ] Add warning that optimization is backend-owned, not Google Routes-owned.

---

## 8. Phase 1: Algorithm Backend on Demo Graph

**Goal:** Prove the DAA core before dealing with real NCR road data.

**Owner:** Lead Developer / Backend Lead.

### Phase 1A: Graph Model and Demo Graph

**Files:**

- Create: `backend/app/graph.py`
- Test: `backend/tests/test_graph.py`

Steps:

- [ ] Define a simple adjacency-list graph.
- [ ] Add demo nodes with `id`, `lat`, and `lng`.
- [ ] Add directed weighted edges in meters.
- [ ] Add a helper that maps demo coordinates to demo nodes for Phase 1.
- [ ] Test that demo graph loads with expected node and edge counts.

Acceptance:

- Demo graph is deterministic.
- Demo graph supports asymmetric distances.
- Demo graph has at least one case where optimized route beats naive route.

### Phase 1B: Dijkstra

**Files:**

- Create: `backend/app/algorithms/dijkstra.py`
- Test: `backend/tests/test_dijkstra.py`

Steps:

- [ ] Write a failing test for shortest distance on the demo graph.
- [ ] Implement Dijkstra using Python `heapq`.
- [ ] Return both distances and predecessor data.
- [ ] Add path reconstruction.
- [ ] Test unreachable-node behavior.
- [ ] Run `pytest backend/tests/test_dijkstra.py -v`.

Acceptance:

- Dijkstra returns the correct shortest distance.
- Dijkstra reconstructs the expected path.
- Dijkstra does not use `networkx.shortest_path` or external shortest-path helpers.

### Phase 1C: Distance Matrix and Naive Route

**Files:**

- Create: `backend/app/services/optimizer.py`
- Test: `backend/tests/test_optimizer.py`

Steps:

- [ ] Build a selected-node list: store first, then stops.
- [ ] Run Dijkstra from each selected node.
- [ ] Build an asymmetric distance matrix.
- [ ] Compute naive closed tour distance: store -> stops in input order -> store.
- [ ] Return per-leg distances and paths.
- [ ] Test that naive route order preserves user input order.

Acceptance:

- Matrix size is `(stops + 1) x (stops + 1)`.
- Dijkstra run count is `stops + 1`.
- Naive route always starts and ends at `store`.

### Phase 1D: Branch and Bound TSP

**Files:**

- Create: `backend/app/algorithms/tsp_branch_bound.py`
- Test: `backend/tests/test_tsp_branch_bound.py`

Steps:

- [ ] Write a small known distance matrix test.
- [ ] Implement Branch and Bound for a closed tour starting at index `0`.
- [ ] Support asymmetric distance matrices.
- [ ] Track `branches_explored`.
- [ ] Track `branches_pruned`.
- [ ] Return best order and total distance.
- [ ] Run `pytest backend/tests/test_tsp_branch_bound.py -v`.

Acceptance:

- Branch and Bound returns the known optimal route for a small matrix.
- Result starts and ends at index `0`.
- No nearest-neighbor optimization is used as the main algorithm.
- Metadata counts explored and pruned branches.

### Phase 1E: `/api/optimize`

**Files:**

- Create: `backend/app/models.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_api_optimize.py`

Steps:

- [ ] Define Pydantic request and response models.
- [ ] Add input validation: require at least 1 stop and reject invalid coordinates, but do not hard-reject valid routes only because they exceed 20 stops.
- [ ] Use exact mode for 1-10 stops.
- [ ] Temporarily return `501 Not Implemented` for clustered mode if clustering is not ready yet, with a clear message that exact mode is implemented first and large-route mode is next.
- [ ] Return the agreed response shape for exact mode.
- [ ] Add API tests using `httpx`.
- [ ] Run `pytest -v`.

Acceptance:

- `GET /health` passes.
- `POST /api/optimize` returns exact-mode response for 1-10 stops.
- More than 10 stops does not claim exact global optimality.
- More than 20 stops is accepted by the final product path through large-route clustered mode once clustering is implemented.
- Metadata includes mode, stops processed, Dijkstra runs, matrix size, branches explored/pruned, batches used, exactness, and computation time.

---

## 9. Phase 2: Mobile Planner Skeleton

**Goal:** Let users set a store, add stops, and trigger a mock optimization flow.

**Owner:** Frontend Lead with UI/UX Developer support.

### MVP Screen Count

The MVP targets 7 screens:

1. Splash Screen
2. Welcome Screen
3. Set Store Location Screen
4. Route Planner Screen
5. Loading Screen
6. Results Screen
7. Settings Screen

Post-MVP screens:

8. Login/Register Screen
9. Route History Screen
10. Saved Stops Screen
11. Share/Export Screen or Modal

### Phase 2A: Navigation and Screens

**Files:**

- Create: `mobile/src/navigation/AppNavigator.tsx`
- Create: `mobile/src/screens/SplashScreen.tsx`
- Create: `mobile/src/screens/WelcomeScreen.tsx`
- Create: `mobile/src/screens/SetStoreScreen.tsx`
- Create: `mobile/src/screens/RoutePlannerScreen.tsx`
- Create: `mobile/src/screens/ResultsScreen.tsx`
- Create: `mobile/src/screens/SettingsScreen.tsx`

Steps:

- [ ] Add native stack navigation.
- [ ] Route first-launch users to store setup.
- [ ] Route returning users to planner if store is saved.
- [ ] Keep auth screens out of MVP.

Acceptance:

- App opens to the correct first screen.
- User can move from Welcome -> Set Store -> Route Planner.

### Phase 2B: Map Display

**Files:**

- Create: `mobile/src/components/RouteMap.tsx`

Steps:

- [ ] Render Google map centered on Metro Manila.
- [ ] Add store marker.
- [ ] Add numbered stop markers.
- [ ] Add long-press map tap to create a stop.
- [ ] Keep optimization logic out of the frontend.

Acceptance:

- Map loads on device/emulator.
- Markers do not overlap critical controls.
- Stop markers are numbered.

Current implementation note:

- Planner uses a custom draggable sheet using React Native `Animated` and `PanResponder`.
- `@gorhom/bottom-sheet` is installed but not used in Planner because Expo Go produced a Reanimated/Worklets native mismatch during testing.

### Phase 2C: Store and Stop State

**Files:**

- Create: `mobile/src/state/routeDraftStore.ts`
- Create: `mobile/src/types/route.ts`

Steps:

- [ ] Define `LatLng`, `Stop`, `StoreLocation`, and `RouteDraft` types.
- [ ] Persist store location using AsyncStorage or MMKV.
- [ ] Add stop add/remove/reorder state functions.
- [ ] Show a warning after 20 stops that the route will use large-route clustered mode and may take longer, but do not block valid stop input only because it exceeds 20.

Acceptance:

- Store persists after app restart.
- Stops can be added and removed.
- UI allows valid stops beyond 20 and labels them as large-route clustered mode; exact global optimality is not claimed for those routes.

### Phase 2D: Mock Optimize Flow

**Files:**

- Create: `mobile/src/mocks/mockOptimizeResponse.ts`

Steps:

- [ ] Add a mock response matching `/api/optimize`.
- [ ] Route user to Results screen after tapping Optimize.
- [ ] Render total distance, savings, stop order, and metadata from mock response.

Acceptance:

- Results screen can be developed before backend integration is complete.
- Mock response field names match the backend API contract.

---

## 10. Phase 3: Frontend-Backend Integration

**Goal:** Replace mock optimization with the real local backend.

**Owner:** Frontend Lead and Lead Developer / Backend Lead.

### Phase 3A: API Client

**Files:**

- Create: `mobile/src/api/client.ts`
- Create: `mobile/src/api/routes.ts`

Steps:

- [ ] Read `EXPO_PUBLIC_API_BASE_URL`.
- [ ] Add `getHealth()`.
- [ ] Add `optimizeRoute(request)`.
- [ ] Map backend errors to user-facing messages.
- [ ] Test against local backend.

Acceptance:

- App can call `GET /health`.
- App can call `POST /api/optimize`.
- Backend validation errors are visible in the UI.

### Phase 3B: Loading and Results

**Files:**

- Create: `mobile/src/screens/LoadingScreen.tsx`
- Modify: `mobile/src/screens/RoutePlannerScreen.tsx`
- Modify: `mobile/src/screens/ResultsScreen.tsx`

Steps:

- [ ] Show loading states: mapping stops, calculating distances, finding best route.
- [ ] Navigate to Results with backend response.
- [ ] Show fallback error state if backend is offline.

Acceptance:

- Full local demo works on demo graph.
- Offline backend shows a clear error instead of crashing.

### Phase 3C: Route Rendering

**Files:**

- Modify: `mobile/src/components/RouteMap.tsx`
- Create: `mobile/src/components/RouteToggle.tsx`
- Create: `mobile/src/components/RouteStatsSheet.tsx`
- Create: `mobile/src/components/AlgorithmDetailsPanel.tsx`

Steps:

- [ ] Draw optimized route as a solid teal/green polyline.
- [ ] Draw naive route as a gray dashed polyline.
- [ ] Add segmented toggle: Naive / Optimized.
- [ ] Show total distance and savings percentage.
- [ ] Show algorithm metadata in a collapsible panel.

Acceptance:

- User can compare naive and optimized route visually.
- Algorithm details are visible for defense.

---

## 11. Phase 4: NCR Graph and Boundary

**Goal:** Move from demo graph to real Metro Manila data.

**Owner:** Lead Developer / Backend Lead with QA + Docs / Backend Support.

### Phase 4A: NCR Boundary

**Files:**

- Create: `backend/data/ncr_boundary.geojson`
- Create: `backend/app/geo/boundary.py`
- Test: `backend/tests/test_boundary.py`

Steps:

- [ ] Choose a checked-in NCR boundary GeoJSON source.
- [ ] Add point-in-polygon validation using `shapely`.
- [ ] Reject store or stops outside NCR.
- [ ] Add tests with one inside-NCR and one outside-NCR coordinate.

Acceptance:

- Backend rejects outside-NCR coordinates.
- Boundary file is checked in or clearly documented if too large.

### Phase 4B: OSMnx Graph Extraction

**Files:**

- Create: `backend/scripts/build_ncr_graph.py`
- Create: `backend/data/README.md`

Steps:

- [ ] Use OSMnx to download/filter drivable Metro Manila roads.
- [ ] Respect one-way streets.
- [ ] Export a backend-loadable graph file.
- [ ] Record graph node and edge counts.
- [ ] Document the command used to rebuild the graph.

Acceptance:

- Graph is built before defense day.
- Backend does not fetch OSM live during the defense demo.

### Phase 4C: Graph Loading and Snapping

**Files:**

- Create: `backend/app/graph_loader.py`
- Create: `backend/app/geo/snapping.py`
- Test: `backend/tests/test_snapping.py`

Steps:

- [ ] Load preprocessed graph once at backend startup.
- [ ] Build nearest-node lookup.
- [ ] Snap store and stops to graph nodes.
- [ ] Return snapped node IDs in debug logs or metadata if useful for defense.

Acceptance:

- Real NCR coordinates map to reachable graph nodes.
- Backend startup clearly reports graph mode: `ncr`.

### Phase 4D: Real Coordinate Optimization

**Files:**

- Modify: `backend/app/services/optimizer.py`
- Test: `backend/tests/test_real_demo_route.py`

Steps:

- [ ] Replace demo coordinate mapping with snapping in NCR mode.
- [ ] Run Dijkstra on the NCR graph.
- [ ] Reconstruct road-level path coordinates.
- [ ] Test with fixed demo stops.

Acceptance:

- Fixed NCR demo route returns optimized and naive routes.
- Response still matches the same API contract.

---

## 12. Phase 5: Defense Polish and Reliability

**Goal:** Make the MVP stable, explainable, and demo-safe.

**Owner:** Everyone, coordinated by Lead Developer.

### Phase 5A: Algorithm Details Panel

**Owner:** UI/UX Developer and Frontend Lead.

Steps:

- [ ] Display computation mode: exact or clustered.
- [ ] Display stop count.
- [ ] Display Dijkstra run count.
- [ ] Display distance matrix size.
- [ ] Display branches explored and pruned.
- [ ] Display batches used.
- [ ] Display computation time.
- [ ] Display whether exact global optimum is claimed.

Acceptance:

- Panel can be opened during defense.
- Panel uses the same exactness language as `CONTEXT.md`.

### Phase 5B: Fixed Demo Data

**Owner:** QA + Docs / Backend Support.

**Files:**

- Create: `backend/data/demo_routes.json`
- Create: `docs/DEFENSE_SCRIPT.md`

Steps:

- [ ] Prepare a 3-stop exact demo.
- [ ] Prepare a 6-10 stop exact demo.
- [ ] Prepare an 11-20 stop clustered demo if clustered mode is implemented.
- [ ] Save expected screenshots.
- [ ] Save expected distance/savings values.

Acceptance:

- Team can run a known-good route without relying on live search.

### Phase 5C: Local Fallback and Deployment

**Owner:** Lead Developer / Backend Lead and QA + Docs / Backend Support.

Steps:

- [ ] Deploy backend to Railway.
- [ ] Keep local backend command ready.
- [ ] Add `.env.example` for local and Railway URLs.
- [ ] Test mobile app against Railway.
- [ ] Test mobile app against local backend.

Acceptance:

- If Railway fails, local backend can run the demo.

### Phase 5D: Rehearsal

**Owner:** Everyone.

Steps:

- [ ] Rehearse exact-mode demo.
- [ ] Rehearse clustered-mode explanation.
- [ ] Explain why Google Maps is display/search only.
- [ ] Explain why Python/FastAPI was chosen.
- [ ] Explain why exact B&B cannot be unlimited.
- [ ] Record backup video.

Acceptance:

- Every presenter can explain exact mode vs clustered mode.
- Backup video exists before defense day.

---

## 13. Post-MVP Phases

Start these only after MVP is stable.

### Phase 6: Route History

- Save completed route summaries locally.
- Show date, stop count, optimized distance, and savings.
- Keep cloud sync out unless Firebase is already added.

### Phase 7: Navigation Handoff

- Use `expo-linking`.
- Open Google Maps or Waze with optimized waypoints.
- Document waypoint limits.
- Keep backend optimization unchanged.

### Phase 8: Firebase Auth

- Add email/password registration and login.
- Add forgot password.
- Key route history by Firebase UID if cloud history is added.
- Do not make auth required for algorithm demo.

### Phase 9: Saved Stops and Sharing

- Add favorite stops.
- Add shareable route summary.
- Add export image or text summary.

### Phase 10: Real-Time Traffic

- Keep backend as Python/FastAPI.
- Add TomTom or Google Routes only as an external data source.
- First show traffic-aware ETA.
- Only later experiment with traffic-aware edge weights.
- Never replace the DAA explanation with a third-party route optimizer.

---

## 14. First-Night Backend Checklist

**Owner:** Jude / Lead Developer / Backend Lead.

Target date: May 20, 2026.

Create:

```txt
backend/
  app/
    __init__.py
    main.py
    models.py
    graph.py
    algorithms/
      __init__.py
      dijkstra.py
      tsp_branch_bound.py
    services/
      __init__.py
      optimizer.py
  tests/
    __init__.py
    test_dijkstra.py
    test_tsp_branch_bound.py
    test_optimizer.py
    test_api_optimize.py
  requirements.txt
```

Steps:

- [ ] Create backend folder structure.
- [ ] Add `requirements.txt`.
- [ ] Add `GET /health`.
- [ ] Add `POST /api/optimize`.
- [ ] Build tiny demo graph.
- [ ] Implement Dijkstra with priority queue.
- [ ] Implement path reconstruction.
- [ ] Implement distance matrix builder.
- [ ] Implement naive closed tour.
- [ ] Stub or start Branch and Bound.
- [ ] Return the agreed response shape.
- [ ] Add Dijkstra test.
- [ ] Add naive route test.
- [ ] Run `pytest -v`.
- [ ] Run `uvicorn app.main:app --reload`.

Definition of done:

- `GET /health` works.
- `pytest -v` passes for the tests created tonight.
- `/api/optimize` returns a response shaped like the API contract, even if B&B is still partial.

---

## 15. Defense Talking Points

- RouteLite is a DAA-focused mobile route optimizer.
- Google Maps is used for visualization.
- Google Places is used for user-friendly search.
- The backend computes optimization using OSM road data.
- Dijkstra computes shortest road distances between selected graph nodes.
- Branch and Bound solves exact stop ordering for small stop sets.
- Naive route means the user's input order.
- Exact mode means full-set Branch and Bound.
- Clustered mode means approximate optimization for larger accepted stop sets.
- The MVP performance target is 20 delivery stops, but the final product should not hard-reject valid larger stop sets only because of count.
- Exact global optimality is initially targeted up to 10 delivery stops.
- Larger stop sets use clustered/large-route mode and must be labeled approximate.
- A 50-stop demo target can be attempted only after testing.
