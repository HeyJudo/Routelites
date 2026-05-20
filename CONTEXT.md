# RouteLite Context

## Purpose

RouteLite is a cross-platform mobile route optimization app for delivery riders and small local businesses operating within Metro Manila, also known as the National Capital Region (NCR). The project is built for COSC 203: Design and Analysis of Algorithms at the Polytechnic University of the Philippines, College of Computer and Information Sciences.

The academic purpose of RouteLite is to demonstrate a real-world application of Dijkstra's Algorithm and Branch and Bound for the Travelling Salesman Problem (TSP). The product purpose is to help riders compare their original input-order route against an optimized delivery route.

## Product Positioning

RouteLite should be treated as a DAA-focused mobile route optimizer, not a complete production logistics platform. The strongest version of the project is a polished algorithm demonstration wrapped in a usable mobile interface.

The core product promise is:

> Given a store location and a set of delivery stops in Metro Manila, RouteLite computes road-network shortest-path distances, finds a better stop order, and shows the distance saved compared with the user's original input order.

## Primary Users

### Independent Delivery Rider

A rider who handles multiple daily deliveries and currently decides route order manually. The rider needs a simple way to know which stop to visit first, next, and last.

### Small Business Owner

A local business owner, such as a water refilling station, laundry shop, or small food seller, who manages deliveries without enterprise logistics software.

## Academic Scope

The required algorithmic focus is:

- Dijkstra's Algorithm for shortest-path computation on a road graph.
- Branch and Bound TSP for route sequencing.
- Naive input-order route as the baseline comparison.

RouteLite must not use Nearest Neighbor as a required algorithm or primary comparison baseline. Nearest Neighbor was removed from the final scope.

## MVP Scope

The MVP should prioritize defense-ready algorithm correctness and demonstration value.

Required MVP capabilities:

- Mobile app built with Expo React Native and TypeScript.
- Map-first route planner.
- Store location setup.
- Stop input by search or map tap.
- NCR boundary validation.
- FastAPI backend route optimization endpoint.
- Preprocessed OSM road graph loaded by the backend.
- Custom Dijkstra implementation.
- Custom Branch and Bound TSP implementation.
- Naive route versus optimized route comparison.
- Results display with map route, stop order, distance totals, and savings.
- Algorithm details panel for defense.
- Local backend fallback for defense.

Optional or Post-MVP capabilities:

- Firebase email/password authentication.
- Route history.
- Saved or favorite stops.
- Share route.
- Google Maps or Waze navigation handoff.
- Real-time traffic.
- Advanced analytics beyond the defense metadata panel.

## Core Route Computation Model

1. The user sets a store location.
2. The user adds delivery stops.
3. The app validates that stops are inside Metro Manila and are usable by the route engine.
4. The backend snaps the store and stops to nearest road graph nodes.
5. The backend runs Dijkstra from each selected graph node.
6. Dijkstra outputs shortest-path distances and path predecessor data.
7. The backend builds a distance matrix.
8. For small stop sets, Branch and Bound solves the full TSP exactly.
9. For large stop sets, the backend clusters stops, runs Branch and Bound per cluster, chains clusters, and stitches one continuous route.
10. The backend computes the naive input-order route for comparison.
11. The app displays optimized route, naive route, distance saved, and computation metadata.

## Exactness Rules

Exact global optimality is guaranteed only when Branch and Bound runs on the full stop set.

For larger stop sets, RouteLite may still accept the stops, but it must not claim exact global optimization. In large-route mode, Dijkstra is still used to compute shortest road distances, and Branch and Bound is used as a subroutine inside smaller clustered groups.

Required result labels:

- `exact`: full-set Branch and Bound was used; the global optimum is claimed for the selected distance matrix.
- `clustered`: clustered Branch and Bound was used; the route is optimized but approximate, not globally exact.

## Technical Architecture

### Frontend

- Expo React Native
- TypeScript
- `react-native-maps` with Google Maps provider
- Google Places Autocomplete for address/place search
- AsyncStorage or MMKV for local settings and optional route history

### Backend

- Python 3.11+
- FastAPI
- Custom adjacency-list graph representation
- Custom Dijkstra implementation
- Custom Branch and Bound TSP implementation
- Optional clustering layer for larger stop sets
- Railway deployment plus local backend fallback

### Data Sources

- OpenStreetMap road data, preprocessed with `osmnx`.
- Metro Manila/NCR boundary polygon, preferably stored as a checked-in GeoJSON file.
- Fixed demo locations for defense reliability.

## Implementation Boundaries

The backend owns all heavy computation. The mobile app is a lightweight client responsible for collecting user input, displaying map state, calling the backend, and presenting results.

The app should not compute Dijkstra or Branch and Bound on-device for the MVP.

The route should be a closed tour: it starts at the store and returns to the store.

Batching must be invisible in the normal rider UI, but visible in the algorithm details panel for defense purposes.

## Defense Metadata Requirements

Every optimization response should include enough metadata to prove the algorithmic work during defense.

Recommended metadata:

- Computation mode: `exact` or `clustered`
- Number of stops processed
- Number of Dijkstra runs
- Distance matrix size
- Branch and Bound branches explored
- Branch and Bound branches pruned
- Number of batches/clusters used
- Whether global exactness is claimed
- Total computation time in milliseconds

## Definition of Terms

### Algorithm Details Panel

A result-screen panel or drawer that exposes computation metadata for academic defense. It should show how many Dijkstra runs were performed, how large the distance matrix was, whether exact or clustered mode was used, and how Branch and Bound behaved.

### Approximate Route

A route that is optimized by a reasonable method but is not guaranteed to be the global shortest possible route. In RouteLite, clustered large-route mode produces an approximate route.

### Asymmetric Distance Matrix

A distance matrix where the distance from A to B may differ from the distance from B to A. This can happen in RouteLite because the road graph respects one-way streets.

### Backend

The FastAPI service responsible for loading road graph data, computing shortest paths, solving route order, and returning route results to the mobile app.

### Batching Layer

The large-route handling layer that splits many stops into smaller groups, solves each group using Branch and Bound, and stitches the result into one continuous route.

### Branch and Bound

A search technique that explores possible solutions while pruning branches that cannot beat the best known solution. RouteLite uses Branch and Bound to solve the TSP route-ordering problem for small stop sets or clustered subproblems.

### Closed Tour

A route that starts and ends at the same location. In RouteLite, the route starts at the store, visits all stops, and returns to the store.

### Clustered Mode

The route computation mode used when the stop count exceeds the tested Branch and Bound threshold. Stops are grouped into smaller clusters, Branch and Bound runs per cluster, and the final route is stitched together. This mode is optimized but not globally exact.

### Dijkstra's Algorithm

A greedy shortest-path algorithm used to compute the shortest road distance from one selected graph node to other selected graph nodes. RouteLite uses Dijkstra to build the distance matrix used by Branch and Bound.

### Distance Matrix

A table of shortest-path distances between the store and all selected delivery stops. If there are `N` selected locations including the store, the matrix is `N x N`.

### Exact Mode

The route computation mode where Branch and Bound runs on the full stop set. In this mode, RouteLite may claim exact global optimality for the selected distance matrix.

### Exact Global Optimality

The guarantee that no other valid stop order has a lower total route distance for the same distance matrix. RouteLite may claim this only in exact mode.

### Frontend

The Expo React Native mobile app used by the rider or business owner. It handles screens, map interaction, stop input, loading states, and result presentation.

### Graph Edge

A connection between two road graph nodes. In RouteLite, an edge usually represents a drivable road segment and has a distance weight in meters.

### Graph Node

A point in the road graph, such as an intersection or road geometry point. Delivery stops and the store are snapped to nearby graph nodes before path computation.

### Input-Order Route

The route that follows the exact order in which the user entered stops. This is RouteLite's baseline route and should also be called the naive route.

### K-Medoids

A clustering method that groups points around representative existing points called medoids. RouteLite may use k-medoids on the distance matrix to group large stop sets into smaller subproblems.

### Large-Route Mode

Another name for clustered mode. It applies when the stop count exceeds the tested exact Branch and Bound threshold.

### Metro Manila / NCR

The National Capital Region of the Philippines. RouteLite's MVP service area is limited to Metro Manila's 17 local government units.

### Naive Route

The unoptimized baseline route that follows the user's input order. It is not a heuristic and should not be described as an algorithmic route optimization method.

### NCR Boundary

The geographic polygon used to determine whether a store or stop is inside Metro Manila. Stops outside this boundary must be rejected in the MVP.

### OSM

OpenStreetMap, the open geographic data source used for the road network.

### OSMnx

A Python library used to download, filter, and preprocess OpenStreetMap road network data.

### Polyline

A sequence of coordinates drawn on the map to represent a route path.

### Predecessor Data

Path reconstruction data produced during shortest-path computation. RouteLite preserves predecessor data so the backend can reconstruct road-level paths for map polylines.

### Priority Queue

A data structure used by efficient Dijkstra implementations to repeatedly process the next nearest graph node.

### Road Graph

A graph representation of roads, where graph nodes represent road points and graph edges represent drivable road segments.

### Snapping

The process of matching a real-world latitude/longitude coordinate to the nearest usable road graph node.

### Stop

A delivery destination entered by the user. Stops are numbered and included in the route optimization request.

### Store Location

The route's start and end point. It represents the business base, pickup point, or rider starting point.

### TSP

The Travelling Salesman Problem. Given a set of locations and pairwise distances, TSP asks for the shortest route that visits each location and returns to the start.

### Waypoint

A point used in a route or navigation sequence. In RouteLite, the store and delivery stops are waypoints.

## Writing and Naming Standards

Use the following terms consistently:

- Use "naive route" or "input-order route" for the baseline.
- Use "optimized route" for the RouteLite output.
- Use "exact mode" only when full-set Branch and Bound is used.
- Use "clustered mode" for large stop sets.
- Use "approximate" for clustered large-route results.
- Use "NCR" and "Metro Manila" interchangeably only after defining them.

Avoid the following claims:

- Do not claim exact global optimization for unlimited stops.
- Do not describe the naive route as a heuristic.
- Do not mention Nearest Neighbor as part of the final algorithm scope.
- Do not imply Firebase Auth is required for the MVP unless the instructor requires accounts.

## Defense Readiness Notes

The team should prepare:

- A local backend command.
- A preprocessed graph file.
- Fixed demo stops inside NCR.
- Expected route result screenshots.
- A short backup recording of the complete optimization flow.
- A clear explanation of exact mode versus clustered mode.

## Related Documents

- `PRD.md`: Product requirements and feature scope.
- `AGENT.md`: Agent-facing implementation guidance.
- `ROUTELITE_AUDIT_SUGGESTIONS.md`: Scope and defense-readiness audit notes.
