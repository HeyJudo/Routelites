# I. SYSTEM DESIGN AND METHODOLOGY

## A. System Architecture Overview

RouteLite is a routing decision-support system for small local businesses that handle their own deliveries within a fixed service area. It accepts a selected store location and several delivery stops, checks whether those inputs are valid, prepares them for road-network computation, and then generates both a naive and an optimized closed route. The architecture brings together user input, shortest-path computation, and route optimization in a workflow suited to small-scale local delivery planning.

The system follows a client-server architecture consisting of three main layers:

1. **Mobile Frontend** — An Expo React Native application (TypeScript) that provides the user interface for inputting delivery stops, selecting optimization preferences, and viewing the route comparison results on an interactive map.
2. **Backend API** — A Python FastAPI server that receives optimization requests, performs all algorithmic computation (Dijkstra, Branch and Bound, K-Means Clustering), and returns structured route results.
3. **Road Graph Data Layer** — A preprocessed OpenStreetMap-based road network for Metro Manila/NCR, stored as an adjacency-list graph with geographic coordinates and road-segment distances.

The processing pipeline is divided into three main stages. The first is **input and validation**, where the selected store and delivery stops are checked to confirm that they are inside the service area, reachable in the prepared road graph, not duplicated, and still within the allowed stop limit. The second is **routing preparation**, where valid locations are matched to their nearest road nodes and processed using Dijkstra's Algorithm to compute pairwise shortest-path distances. The third is **route optimization and result generation**, where RouteLite first computes the naive closed route based on the user-input order, then applies Branch and Bound for the Travelling Salesman Problem to find the optimal closed tour and compare the results. For larger delivery sets (11–150 stops), the system applies K-Means Clustering to partition stops into manageable groups before solving each cluster individually. This structure allows the project to handle both road-level path computation and stop-sequence optimization in a clear and connected way.

*[Image 1. RouteLite Overall System Architecture Flow]*

---

## B. Input and Validation Process

The input and validation stage is the starting point of the workflow. Here, the user selects one store or dispatch point, and several delivery stops from the prepared local dataset within the fixed service area. These selected locations form the routing request, which RouteLite checks before any computation begins. This prevents the project from processing incomplete, invalid, or unreachable inputs.

The following validations are performed:
- **NCR Boundary Check**: Each stop must be within Metro Manila (latitude/longitude bounds).
- **Duplicate Detection**: No two stops may be located at the same or nearly identical coordinates.
- **Stop Limit Enforcement**: The system supports up to 150 delivery stops per request.
- **Distinct Node Mapping**: The store and all stops must map to distinct road nodes in the graph.
- **Mode Validation**: The "fastest in traffic" mode is only available for routes with 10 or fewer stops.

**Where applied in the application:** The `PlannerScreen` in the mobile app performs NCR boundary and duplicate checks when the user adds a stop via map long-press or place search. The backend `POST /api/optimize` endpoint performs final validation (distinct node mapping, stop limit, mode constraints) before computation begins.

---

## C. Routing Preparation Process

Once the inputs pass validation, the workflow moves to routing preparation. This stage converts the selected locations into data that can be used for road-network computation. Because the chosen places are stored as latitude/longitude coordinates rather than direct graph nodes, each one is first snapped to its nearest road node in the preprocessed OpenStreetMap-based road graph using a spatial index (KD-Tree) for efficient nearest-neighbor lookup.

After the selected places have been matched to road nodes, RouteLite runs Dijkstra's Algorithm from each selected node to compute the shortest-path distance to every other selected node. The implementation uses multi-target Dijkstra, meaning each run fans out from one source and settles all other selected targets in a single pass (stopping early once the last target is settled). This is more efficient than running separate point-to-point searches for each pair. These results are used to build the full n×n distance matrix, which becomes the input to the optimization stage. Path data (predecessor chains) is also preserved for later route display.

**Where applied in the application:** The backend `optimizer.py` service module (`build_distance_matrix` function) is called during every optimization request. The `graph.py` module provides the road graph structure and nearest-node lookup.

---

## D. Route Optimization Process

Once the distance matrix is ready, RouteLite moves to route optimization. The system supports two optimization modes depending on the number of delivery stops:

### Exact Mode (1–10 stops)

For small delivery sets, RouteLite applies the full Branch and Bound method for the Travelling Salesman Problem on the complete distance matrix. This guarantees finding the globally optimal stop-visit sequence — the shortest possible closed tour from the store through all delivery points and back. It first computes the naive closed route based on the order in which the user entered the delivery stops, then compares it against the optimized result.

### Clustered Mode (11–150 stops)

For larger delivery sets, RouteLite applies a hierarchical strategy:
1. **K-Means Clustering** partitions the delivery stops into spatially compact groups (target ≈ 8 stops per cluster) using geographic coordinates. The algorithm uses K-Means++ initialization to spread initial centroids and reduce poor convergence.
2. **Inter-cluster Branch and Bound** determines the optimal order in which to visit the clusters by running B&B on a smaller matrix of cluster centroids plus the store.
3. **Intra-cluster Branch and Bound** optimizes the stop order within each cluster, with the entry point fixed to the stop nearest the previous cluster's exit.
4. **Dijkstra Stitching** connects the clusters with road-continuous legs to produce a single complete route.

This approach is not globally exact but provides a high-quality approximate route while keeping computation tractable for larger delivery sets.

### Traffic-Aware Mode (Time Optimization, ≤10 stops)

When the user selects "Fastest in traffic" mode, RouteLite builds a separate time matrix (travel time in minutes per pair of stops) in addition to the distance matrix. The time matrix can be sourced from:
- **Live traffic data** — via the TomTom Matrix Routing API (real-time travel times).
- **Simulated traffic** — a deterministic mock that applies congestion multipliers based on distance.

The TSP Branch and Bound then runs on the time matrix to determine the visit order that minimizes total travel time. Per-leg congestion levels (low, moderate, heavy) are computed from the ratio of actual travel time to free-flow time and displayed on the results map.

**Where applied in the application:** The `LoadingScreen` shows the optimization in progress with three steps ("Mapping stops", "Calculating shortest paths", "Finding best stop order"). The `ResultsScreen` displays the optimized route, naive route, savings percentage, and per-leg details including congestion coloring for time-mode results.

*[Image 3. Branch and Bound - Traveling Salesman Problem Main Flow]*
*[Image 4. Branch and Bound Recursive Search Flow]*

---

## E. Output and Result Presentation

After the user selects the store and delivery stops, RouteLite generates an output that explains the recommended delivery route and the basis of the result. The main output includes:

- **Optimized delivery sequence** — the order in which the delivery unit should visit the selected stops before returning to the store.
- **Naive input-order route** — the route that follows the original order in which the user entered the delivery stops.
- **Total distance** of each route (in kilometers).
- **Estimated distance saved** — the difference between the naive and optimized route distances.
- **Savings percentage** — the proportion of distance saved relative to the naive route.
- **Road-level path** for each route segment — the actual road polyline between consecutive stops.
- **Algorithm metadata** — Dijkstra runs performed, distance matrix size, branches explored, branches pruned, computation time, and whether the result is globally exact.
- **Batch/cluster grouping information** — when clustered mode is used, showing the number of clusters.
- **Traffic information** (time mode only) — per-leg travel time, congestion level, traffic source (live/simulated), and total time saved.

The `ResultsScreen` in the mobile app displays these results with an interactive map showing color-coded polylines, numbered stop markers, a segmented control to toggle between Optimized/Naive/Compare views, and animated statistics. An Algorithm Details modal provides full transparency into the computation process.

---

## F. Methodology for Algorithm Implementation

RouteLite uses three main algorithms: Dijkstra's Algorithm for shortest-path computation, Branch and Bound for route optimization, and K-Means Clustering for spatial partitioning of large delivery sets.

### Dijkstra's Algorithm

Dijkstra's Algorithm is applied during routing preparation after the selected places have been matched to their nearest road nodes. The implementation uses a min-heap priority queue for efficient extraction of the node with the smallest tentative distance. For each selected node, the algorithm initializes the distance values to infinity, sets the source node distance to zero, and inserts it into the priority queue. It then repeatedly extracts the node with the smallest distance, marks it as settled, and relaxes all outgoing edges. When a shorter path to a neighbor is found, the distance and predecessor are updated and the neighbor is inserted into the priority queue. The implementation includes early termination: when all target nodes have been settled, the search stops without exploring the entire graph.

One run produces the shortest-path distances and path information from one selected node to all others. Running the same process for all selected nodes allows RouteLite to build the complete distance matrix needed for route optimization.

*[Image 2. Dijkstra's Algorithm Flowchart]*

### Branch and Bound for TSP

Branch and Bound is applied after the distance matrix has been formed. In RouteLite, each partial route is treated as a state, with the algorithm tracking the current path, the remaining unvisited stops, and the current route cost. The algorithm uses depth-first search with backtracking:

1. It first checks whether all stops have already been visited. If they have, the tour is closed by returning to the starting store, and the full route cost is compared with the best solution found so far.
2. If the route is still incomplete, the algorithm computes a **lower bound** for the current state. The lower bound is calculated as the current accumulated cost plus the minimum outgoing edge cost for the current node plus the sum of minimum outgoing edge costs for all unvisited nodes.
3. When that lower bound is already greater than or equal to the best recorded cost, the branch is **pruned** — the algorithm skips this entire subtree of the search.
4. Otherwise, the algorithm explores candidate next stops in **sorted order** (by increasing edge cost from the current node), recursively evaluating only the states that remain promising.

The initial best cost is set to the cost of a sequential tour (input order), providing an upper bound from the start. This allows RouteLite to avoid checking every possible route permutation and focus instead on the strongest candidates.

### K-Means Clustering

K-Means Clustering is applied before Branch and Bound when the delivery set exceeds 10 stops. The algorithm partitions stops into k groups (where k = ⌈n / cluster_size⌉) based on geographic proximity:

1. **K-Means++ Initialization** — The first centroid is chosen randomly. Each subsequent centroid is selected with probability proportional to the squared distance from the nearest existing centroid. This spreads initial centroids to reduce poor convergence.
2. **Assignment Step** — Each stop is assigned to the nearest centroid based on Euclidean distance in latitude/longitude space.
3. **Update Step** — Each centroid is recomputed as the mean coordinate of all stops assigned to it.
4. Steps 2–3 repeat until assignments converge (no change) or the maximum iteration count (100) is reached.

The resulting clusters are then processed hierarchically: inter-cluster ordering via B&B, intra-cluster ordering via B&B, and road-continuous stitching via Dijkstra.

---

## G. Pseudocode

The pseudocode below summarizes the main logic of RouteLite and the three algorithms used in the system.

### Overall RouteLite Pseudocode

```
BEGIN RouteLite
    LOAD road graph (NCR OSM adjacency list)
    
    GET store location and delivery stop inputs from user
    
    IF store or stops are outside NCR boundary THEN
        SHOW error message
        STOP current process
    END IF
    
    IF duplicate stops exist THEN
        SHOW error message
        STOP current process
    END IF
    
    IF number of stops exceeds 150 THEN
        SHOW error message
        STOP current process
    END IF
    
    SNAP store to nearest road node using KD-Tree
    FOR each delivery stop
        SNAP stop to nearest road node using KD-Tree
    END FOR
    
    SET selected_nodes = [store_node] + [all stop_nodes]
    
    IF number of stops ≤ 10 THEN
        // EXACT MODE
        FOR each node in selected_nodes
            RUN multi-target Dijkstra from the current node
            STORE shortest distances and predecessor paths
        END FOR
        BUILD n×n distance matrix from Dijkstra results
        
        IF mode is "time" THEN
            BUILD n×n time matrix (live traffic or simulated)
            RUN Branch and Bound TSP on time matrix
        ELSE
            RUN Branch and Bound TSP on distance matrix
        END IF
        
        COMPUTE naive route based on input order
        COMPUTE optimized route from TSP result
        
    ELSE
        // CLUSTERED MODE
        EXTRACT coordinates of all stop nodes
        RUN K-Means Clustering on stop coordinates
        
        BUILD inter-cluster distance matrix (store + centroids)
        RUN Branch and Bound TSP on inter-cluster matrix
        GET cluster visit order
        
        FOR each cluster in visit order
            BUILD intra-cluster distance matrix
            RUN Branch and Bound TSP within cluster
            STITCH cluster legs using Dijkstra paths
        END FOR
        
        BUILD final return leg (last cluster exit → store)
        COMPUTE naive route (input order with Dijkstra legs)
    END IF
    
    COMPUTE savings = naive_distance - optimized_distance
    COMPUTE savings_percentage = (savings / naive_distance) × 100
    
    DISPLAY optimized route order
    DISPLAY naive route order
    DISPLAY total distance of each route
    DISPLAY distance saved and savings percentage
    DISPLAY road-level path for each route leg
    DISPLAY algorithm metadata (Dijkstra runs, branches explored/pruned)
END RouteLite
```

### Dijkstra's Algorithm Pseudocode (Multi-Target with Early Termination)

```
DIJKSTRA(Graph, Source, Targets)
    FOR each node v in Graph
        dist[v] = INFINITY
        prev[v] = null
    END FOR
    
    dist[Source] = 0
    priority_queue = [(0, Source)]
    settled = empty set
    
    WHILE priority_queue is not empty
        (current_distance, u) = EXTRACT_MIN(priority_queue)
        
        IF u is already in settled THEN
            CONTINUE
        END IF
        
        ADD u to settled
        
        // Early termination: stop when all targets are settled
        IF Targets is not null AND Targets ⊆ settled THEN
            BREAK
        END IF
        
        FOR each neighbor v of u with edge weight w
            candidate = dist[u] + w
            IF candidate < dist[v] THEN
                dist[v] = candidate
                prev[v] = u
                INSERT (candidate, v) into priority_queue
            END IF
        END FOR
    END WHILE
    
    RETURN dist, prev
END
```

### Branch and Bound TSP Pseudocode

```
BRANCH_AND_BOUND_TSP(Matrix, n)
    // Initialize with sequential tour as upper bound
    bestCost = cost of sequential tour [0, 1, 2, ..., n-1, 0]
    bestRoute = [0, 1, 2, ..., n-1, 0]
    branches_explored = 0
    branches_pruned = 0
    
    // Precompute minimum outgoing edge for each node
    FOR each node i in [0..n-1]
        min_outgoing[i] = MIN(Matrix[i][j]) for all j ≠ i
    END FOR
    
    SEARCH([0], {1, 2, ..., n-1}, 0)
    
    RETURN bestRoute, bestCost, branches_explored, branches_pruned
END

SEARCH(path, unvisited, currentCost)
    branches_explored = branches_explored + 1
    
    IF unvisited is empty THEN
        // Close the tour by returning to start
        fullCost = currentCost + Matrix[last node in path][0]
        IF fullCost < bestCost THEN
            bestCost = fullCost
            bestRoute = path + [0]
        END IF
        RETURN
    END IF
    
    // Compute lower bound for pruning
    lowerBound = currentCost
                 + min_outgoing[last node in path]
                 + SUM(min_outgoing[node]) for each node in unvisited
    
    IF lowerBound ≥ bestCost THEN
        branches_pruned = branches_pruned + 1
        RETURN    // Prune this branch
    END IF
    
    // Explore candidates in sorted order (increasing edge cost)
    FOR each candidate in SORTED(unvisited)
        nextCost = currentCost + Matrix[last node in path][candidate]
        SEARCH(path + [candidate], unvisited - {candidate}, nextCost)
    END FOR
END
```

### K-Means Clustering Pseudocode (with K-Means++ Initialization)

```
KMEANS_CLUSTER(coordinates, cluster_size, max_iterations)
    n = number of coordinates
    k = CEILING(n / cluster_size)
    
    // K-Means++ Initialization
    centroids = [random coordinate from input]
    FOR i = 2 to k
        FOR each coordinate c
            dist[c] = MIN distance from c to any chosen centroid
        END FOR
        SELECT next centroid with probability proportional to dist[c]²
        ADD selected coordinate to centroids
    END FOR
    
    assignments = array of size n (initially all 0)
    
    // Iterative refinement
    FOR iteration = 1 to max_iterations
        // Assignment step
        FOR each coordinate i
            new_assignments[i] = index of nearest centroid to coordinate[i]
        END FOR
        
        IF new_assignments equals assignments THEN
            BREAK    // Converged
        END IF
        
        assignments = new_assignments
        
        // Update step
        FOR each cluster j in [0..k-1]
            IF cluster j has members THEN
                centroids[j] = mean coordinate of all members
            END IF
        END FOR
    END FOR
    
    // Build final cluster groups
    clusters = group coordinate indices by assignment
    REMOVE empty clusters
    
    RETURN clusters, centroids
END
```

---

## H. Image Documentation: Where Algorithms Are Found and Applied

This section provides image evidence showing (1) where each algorithm is implemented in the source code, and (2) where its effect is visible in the running application.

---

### 1. Dijkstra's Algorithm

**Where it is found in the code:**

File: `backend/app/algorithms/dijkstra.py`
Function: `run_dijkstra(graph, source, targets)`

This function implements Dijkstra's shortest-path algorithm using a min-heap priority queue with multi-target early termination. It computes the shortest road distances from one source node to all other selected nodes in a single pass.

*[IMAGE PLACEHOLDER: Screenshot of code editor showing `dijkstra.py` — the `run_dijkstra()` function with the priority queue initialization, the while loop extracting minimum-distance nodes, the early termination check (`if targets is not None and targets.issubset(settled): break`), and the neighbor relaxation logic.]*

**Where it is applied in the application:**

The Dijkstra results are used to draw the road-level polylines on the Results screen map. Each colored line segment between two stops follows the actual shortest road path computed by this algorithm.

*[IMAGE PLACEHOLDER: Screenshot of the ResultsScreen in the mobile app showing the optimized route drawn as polylines on the Google Map, with numbered stop markers connected by road-following green lines.]*

---

### 2. Branch and Bound — Travelling Salesman Problem

**Where it is found in the code:**

File: `backend/app/algorithms/tsp_branch_bound.py`
Function: `solve_tsp_branch_bound(distances)`

This function implements the Branch and Bound algorithm for TSP. It uses recursive depth-first search with a lower-bound pruning strategy (sum of minimum outgoing edges) to find the optimal stop-visit order without exhaustively checking all permutations.

*[IMAGE PLACEHOLDER: Screenshot of code editor showing `tsp_branch_bound.py` — the `solve_tsp_branch_bound()` function showing the initial best cost setup and the nested `search()` function with the lower bound computation (`lower_bound = cost_so_far + min_outgoing[path[-1]] + sum(min_outgoing[node] for node in unvisited)`) and the pruning condition (`if lower_bound >= best_cost: branches_pruned += 1; return`).]*

**Where it is applied in the application:**

The Branch and Bound result determines the optimized stop order displayed in the Results screen. The Algorithm Details modal shows the number of branches explored and pruned, proving the pruning strategy reduced the search space.

*[IMAGE PLACEHOLDER: Screenshot of the ResultsScreen showing the optimized stop sequence (numbered markers in optimized order), AND a screenshot of the Algorithm Details modal showing "Branches explored: X", "Branches pruned: Y", "Mode: exact", "Global optimum: true".]*

---

### 3. K-Means Clustering

**Where it is found in the code:**

File: `backend/app/algorithms/clustering.py`
Function: `cluster_stops(coords, cluster_size, max_iter, seed)`

This function implements K-Means clustering with K-Means++ initialization to partition delivery stops into spatially compact groups. It is used when the number of stops exceeds 10, enabling the system to scale Branch and Bound to larger delivery sets.

*[IMAGE PLACEHOLDER: Screenshot of code editor showing `clustering.py` — the `cluster_stops()` function showing the K-Means++ initialization call (`_kmeans_plus_plus_init`), the iterative assignment and update steps, and the convergence check (`if new_assignments == assignments: break`).]*

**Where it is applied in the application:**

When the user adds more than 10 stops, the Planner screen shows a "Clustered" chip indicating the system will use clustering. The Results screen metadata shows the number of batches (clusters) used.

*[IMAGE PLACEHOLDER: Screenshot of the PlannerScreen showing 11+ stops with the green "Clustered" chip visible next to the stop count. AND/OR a screenshot of the ResultsScreen Algorithm Details modal showing "Mode: clustered", "Batches used: X".]*

---

### 4. Distance Matrix Construction (Multi-Target Dijkstra)

**Where it is found in the code:**

File: `backend/app/services/optimizer.py`
Function: `build_distance_matrix(graph, selected_nodes)`

This function runs one multi-target Dijkstra per selected node to build the complete n×n distance matrix. Each Dijkstra run fans out from a source and settles all other selected targets in a single pass, making it more efficient than n² individual searches.

*[IMAGE PLACEHOLDER: Screenshot of code editor showing `optimizer.py` — the `build_distance_matrix()` function showing the loop over `selected_nodes`, calling `run_dijkstra()` for each source, building the row of distances, and storing path data.]*

**Where it is applied in the application:**

The Loading screen's second step ("Calculating shortest paths") corresponds to this function executing. The resulting matrix size (e.g., "6×6") is shown in the Algorithm Details modal.

*[IMAGE PLACEHOLDER: Screenshot of the LoadingScreen showing the "Calculating shortest paths" step highlighted/active with a checkmark on "Mapping stops" above it.]*

---

### 5. Clustered Optimizer (Hierarchical Strategy)

**Where it is found in the code:**

File: `backend/app/services/clustered_optimizer.py`
Function: `solve_clustered(graph, store_node, stop_nodes, cluster_size)`

This function orchestrates the full clustered optimization pipeline: (1) K-Means clustering, (2) inter-cluster B&B on centroids, (3) intra-cluster B&B for each group, (4) Dijkstra stitching between clusters.

*[IMAGE PLACEHOLDER: Screenshot of code editor showing `clustered_optimizer.py` — the `solve_clustered()` function showing the step comments ("1. Cluster stops spatially", "2. Inter-cluster B&B", "3 & 4. Intra-cluster B&B + stitching", "5. Final return leg") and the calls to `cluster_stops()`, `build_distance_matrix()`, and `solve_tsp_branch_bound()`.]*

**Where it is applied in the application:**

For routes with 11–150 stops, the backend uses this clustered strategy instead of full exact B&B. The Results screen shows the complete stitched route covering all clusters, and metadata indicates the optimization was approximate (not globally exact).

*[IMAGE PLACEHOLDER: Screenshot of the ResultsScreen for a large route (11+ stops) showing the full optimized polyline covering many stops, with the Algorithm Details modal showing "Mode: clustered", "Global optimum: false", "Batches used: 3" (or similar).]*

---

### 6. Traffic/Time Matrix (Time-Aware Optimization)

**Where it is found in the code:**

File: `backend/app/services/traffic.py`
Function: `build_time_matrix(graph, selected_nodes, traffic_mode, distances)`

This function builds a travel-time matrix (integer minutes) for all selected nodes. It supports two sources: live traffic data from the TomTom Matrix Routing API, or a deterministic mock simulation that applies congestion multipliers.

*[IMAGE PLACEHOLDER: Screenshot of code editor showing `traffic.py` — the `build_time_matrix()` function showing the traffic_mode check ("live" vs mock), the TomTom API call structure in `_build_live()`, and the mock congestion multiplier logic in `_build_mock()`.]*

**Where it is applied in the application:**

When the user selects "Fastest in traffic" mode, the Results screen displays congestion-colored polylines: green (low traffic), amber (moderate), red (heavy). Traffic badges show whether the data is live or simulated.

*[IMAGE PLACEHOLDER: Screenshot of the ResultsScreen in time mode showing multi-colored polylines (green/amber/red segments), the "Live traffic" or "Simulated traffic" badge, the "Traffic as of [time]" label, and the congestion chip (e.g., "Heavy traffic on 2 legs").]*

---

### Summary of Screenshots Needed

| # | Algorithm/Component | Code Screenshot | App Screenshot |
|---|---|---|---|
| 1 | Dijkstra's Algorithm | `dijkstra.py` → `run_dijkstra()` | ResultsScreen — road polylines on map |
| 2 | Branch and Bound TSP | `tsp_branch_bound.py` → `solve_tsp_branch_bound()` + `search()` | ResultsScreen — optimized order + Algorithm Details modal |
| 3 | K-Means Clustering | `clustering.py` → `cluster_stops()` | PlannerScreen — "Clustered" chip (11+ stops) |
| 4 | Distance Matrix | `optimizer.py` → `build_distance_matrix()` | LoadingScreen — "Calculating shortest paths" step |
| 5 | Clustered Optimizer | `clustered_optimizer.py` → `solve_clustered()` | ResultsScreen — large route + "clustered" metadata |
| 6 | Traffic/Time Matrix | `traffic.py` → `build_time_matrix()` | ResultsScreen — congestion-colored polylines + traffic badge |
