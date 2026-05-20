# RouteLite Agent Context

## Project
RouteLite is a cross-platform mobile route optimization app for delivery riders and small local businesses in Metro Manila (NCR). It is the DAA final project for COSC 203 at PUP-CCIS (Group 12, BSCS 2-4). The full PRD is in `PRD.md`.

## Final Scope
- **Cross-platform mobile app** built with Expo React Native + TypeScript (iOS + Android).
- **Python FastAPI backend** hosts the NCR road graph and runs all computation.
- **Real road network** from OpenStreetMap, pre-processed via `osmnx`, scoped to NCR bounding box (~14.35–14.78°N, 120.90–121.15°E).
- **Hard NCR boundary** — stops outside Metro Manila's 17 LGUs are rejected.
- **MVP performance target: 20 delivery stops, not a hard product input cap.** Exact B&B is initially targeted up to 10 stops, then batching/clustering partitions larger stop sets into manageable clusters for B&B. Batching is invisible to the user. The final product should accept larger valid stop sets through approximate large-route clustered mode, and a 50-stop demo target can be attempted only after clustered mode is benchmarked and tested.
- **Single continuous tour** — rider does not return to store between batches. One optimized loop.
- **One delivery unit** only.
- Uses **drivable roads only** and respects **one-way roads**.
- Because one-way roads can make A→B distance different from B→A distance, the B&B implementation must support asymmetric distance matrices or clearly document any simplification.
- **Defense metadata is MVP**: results must expose exact vs clustered mode, Dijkstra runs, distance matrix size, B&B branches explored/pruned, batches used, and computation time.

## Core Algorithms
- **Dijkstra's Algorithm**: compute shortest-path distances between selected routing nodes on the NCR graph. Builds the N×N distance matrix.
- **Branch & Bound: TSP**: compute the exact optimal closed tour using the distance matrix when the stop count is within the B&B threshold. Pruning via lower-bound estimation.
- **Batching layer**: k-medoids clustering on the distance matrix when stops exceed the B&B threshold. B&B runs per cluster, clusters are chained in a distance-efficient order, then stitched into one route.
- **Exactness rule**: exact global optimality is guaranteed only when B&B runs on the full stop set. Batched routes are optimized but not guaranteed globally optimal across all stops.
- **No-limit interpretation**: the app may accept larger stop sets, but it must not claim exact global B&B for unlimited stops. For large inputs, Dijkstra is still used and B&B is applied as a subroutine inside clustered groups.
- **Do NOT use Nearest Neighbor.** It was removed from the final scope.
- **Naive route** = user's input order. This is the baseline comparison, NOT a heuristic.

## Tech Stack
- **Frontend**: Expo React Native + TypeScript + `react-native-maps` (Google Maps provider)
- **Search**: Google Places Autocomplete API
- **Auth**: Firebase Authentication (Email/Password) is optional/Post-MVP unless the instructor requires accounts
- **Local Storage**: AsyncStorage or MMKV (store setup, settings, route preferences, and optional route history)
- **Backend**: Python 3.11+ with FastAPI
- **Graph Processing**: `osmnx` preprocessing + custom adjacency list
- **Algorithms**: custom Dijkstra + custom B&B TSP
- **Hosting**: Railway.app + local backend fallback for defense

## RouteLite Flow
1. User completes MVP onboarding (one-time): welcome → set store location. Optional auth may add register/login before store setup.
2. Returning user lands directly on Route Planner with store already pinned.
3. User adds delivery stops via search bar (Google Places) or long-press map tap.
4. Stops validated: inside NCR boundary, reachable, no duplicates.
5. User taps "Optimize Route" → request sent to Python backend.
6. Backend snaps stops to nearest road nodes.
7. Backend runs Dijkstra from each selected node → builds distance matrix.
8. If stops > threshold, backend clusters stops via k-medoids.
9. Backend runs B&B TSP on each cluster (or full set if small enough).
10. Backend computes naive route (input order) for comparison.
11. Backend returns: optimized order, naive order, per-leg distances, total distances, savings, road paths, computation mode, and defense metadata.
12. App displays results: map with route polyline, naive/optimized toggle overlay, stats card, stop list, and algorithm details panel.
13. Post-MVP: user can tap "Start Navigation" to hand off to Google Maps/Waze with optimized waypoints, subject to provider waypoint limits.
14. Post-MVP: route is cached locally for history.

## Important Alignment Rules
- The comparison is **optimized route vs naive input-order route**. No heuristic comparison.
- Remove any text that says **exact vs heuristic** or mentions **Nearest Neighbor**.
- The route is a **closed tour** that returns to the store.
- Batching is **invisible to the user** — they always see one unified route.
- Do not claim batched routes are globally optimal. Exact optimality applies only to full-set B&B within the threshold.
- Always label the result mode: **exact** for full-set B&B, **clustered** for batched B&B.
- Do not claim B&B supports unlimited exact optimization. Use clustered B&B for large stop sets.
- Treat algorithm details as MVP because this is a DAA defense project.
- Firebase Auth, route history, navigation handoff, sharing, and real-time traffic are optional/Post-MVP unless explicitly required.
- The **backend** handles all heavy computation. The app is a lightweight UI client.
- Real-time traffic is Post-MVP. Start with traffic-aware ETA overlay before considering traffic-based optimization.

## App Screens (MVP + Optional)
1. Splash
2. Welcome (onboarding)
3. Set Store Location
4. Route Planner (main screen)
5. Loading (contextual animation)
6. Results (map + toggle + stats + algorithm details)
7. Settings
8. Register/Login (Optional/Post-MVP)
9. Route History (Post-MVP)

## Defense Fallback Requirements
- Keep a local FastAPI backend command ready.
- Use a prepared/preprocessed NCR graph file for the demo route area.
- Prepare fixed NCR demo stops that are known to be reachable.
- Keep backup screenshots or a short recording of the successful route optimization flow.
- Be ready to explain exact mode vs clustered mode clearly.

## Project Files
- `PRD.md` — full Product Requirements Document
- `introduction` — paper introduction and related works
- `routelite-concepts/` — system architecture docs, flowcharts, pseudocode, mockup prompts
- `routelite-concepts/routelite_concept.txt` — **OUTDATED**, contains Nearest Neighbor references. Refer to PRD.md instead.

## Team
- Bargamento, Ronil D.
- Espadilla, Darwin V.
- Sangalang, Jude Louis C.
- Teston, Michelle B.

## Deadline
First week of June 2026 (~5 weeks from April 30).
