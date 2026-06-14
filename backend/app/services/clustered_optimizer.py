from __future__ import annotations

from dataclasses import dataclass

from app.algorithms.clustering import cluster_stops
from app.algorithms.dijkstra import reconstruct_path, run_dijkstra
from app.algorithms.tsp_branch_bound import solve_tsp_branch_bound
from app.graph import RoadGraph
from app.services.optimizer import RouteLeg, RouteResult, build_distance_matrix


@dataclass(frozen=True)
class ClusteredMetadata:
    num_clusters: int
    branches_explored: int
    branches_pruned: int
    centroid_matrix_size: str  # size of the inter-cluster centroid B&B matrix
    dijkstra_runs: int


@dataclass(frozen=True)
class ClusteredResult:
    route: RouteResult
    metadata: ClusteredMetadata


def solve_clustered(
    graph: RoadGraph,
    store_node: str,
    stop_nodes: list[str],
    cluster_size: int = 8,
) -> ClusteredResult:
    """
    Scale B&B TSP to ~50-100 stops via geographic clustering.

    Strategy:
      1. K-means cluster stops spatially (cluster_size ≈ 8).
      2. B&B over [store + cluster centroids] → inter-cluster visit order.
      3. For each cluster in that order, B&B within the cluster with the
         entry node fixed to the stop nearest the incoming transit point.
      4. Stitch legs with Dijkstra so polylines are road-continuous.

    Returns a ClusteredResult containing a single continuous RouteResult
    (store → all stops → store) and metadata about the solve.
    """
    # ------------------------------------------------------------------ #
    # 1.  Cluster stops spatially                                          #
    # ------------------------------------------------------------------ #
    coords = [(graph.nodes[n].lat, graph.nodes[n].lng) for n in stop_nodes]
    cluster_result = cluster_stops(coords, cluster_size=cluster_size)
    clusters = cluster_result.clusters    # list[list[int]] — indices into stop_nodes
    centroids = cluster_result.centroids
    k = len(clusters)

    total_branches_explored = 0
    total_branches_pruned = 0
    total_dijkstra_runs = 0

    # ------------------------------------------------------------------ #
    # 2.  Inter-cluster B&B over [store + centroid representative nodes]  #
    # ------------------------------------------------------------------ #
    centroid_nodes = [graph.nearest_node(lat, lng) for lat, lng in centroids]
    inter_nodes = [store_node] + centroid_nodes

    inter_matrix = build_distance_matrix(graph, inter_nodes)
    inter_tsp = solve_tsp_branch_bound(inter_matrix.distances)

    total_branches_explored += inter_tsp.branches_explored
    total_branches_pruned += inter_tsp.branches_pruned
    total_dijkstra_runs += inter_matrix.dijkstra_runs

    # inter_tsp.order = [0, c_a, c_b, ..., 0] where 0 = store.
    # Map back to 0-based cluster indices (subtract 1 to skip the store slot).
    cluster_visit_order = [inter_tsp.order[i] - 1 for i in range(1, k + 1)]

    # ------------------------------------------------------------------ #
    # 3 & 4.  Intra-cluster B&B + stitching                               #
    # ------------------------------------------------------------------ #
    all_legs: list[RouteLeg] = []
    route_order: list[str] = [store_node]
    prev_exit_node = store_node

    for cluster_idx in cluster_visit_order:
        cluster_stop_indices = clusters[cluster_idx]
        cluster_nodes_list = [stop_nodes[i] for i in cluster_stop_indices]

        # Build a matrix that includes the incoming transit node so that:
        #   (a) we can find the best entry stop (min road distance from prev_exit)
        #   (b) all intra-cluster distances and paths are pre-computed in one pass.
        full_nodes = [prev_exit_node] + cluster_nodes_list
        full_matrix = build_distance_matrix(graph, full_nodes)
        total_dijkstra_runs += full_matrix.dijkstra_runs

        # Best entry = cluster node with minimum road distance from prev_exit_node.
        # full_matrix.distances[0][j+1] = distance from prev_exit to cluster_nodes_list[j].
        entry_j = min(
            range(len(cluster_nodes_list)),
            key=lambda j: full_matrix.distances[0][j + 1],
        )
        entry_node = cluster_nodes_list[entry_j]

        # Connecting leg: prev_exit_node → entry_node (road-continuous polyline).
        connecting_leg = RouteLeg(
            source=prev_exit_node,
            target=entry_node,
            distance_m=full_matrix.distances[0][entry_j + 1],
            path=full_matrix.paths[(prev_exit_node, entry_node)],
        )
        all_legs.append(connecting_leg)
        route_order.append(entry_node)

        if len(cluster_nodes_list) == 1:
            # Single-stop cluster: nothing more to do inside.
            prev_exit_node = entry_node
            continue

        # Reorder so entry_node is at index 0 (B&B always starts from node 0).
        reordered = [entry_node] + [n for n in cluster_nodes_list if n != entry_node]

        # Reuse distances/paths already in full_matrix — no extra Dijkstra runs.
        full_node_idx = {n: i for i, n in enumerate(full_matrix.node_order)}
        intra_distances = [
            [
                full_matrix.distances[full_node_idx[src]][full_node_idx[tgt]]
                for tgt in reordered
            ]
            for src in reordered
        ]

        # B&B on the cluster sub-matrix.
        intra_tsp = solve_tsp_branch_bound(intra_distances)
        total_branches_explored += intra_tsp.branches_explored
        total_branches_pruned += intra_tsp.branches_pruned

        # Reconstruct node IDs from B&B index order.
        # intra_tsp.order = [0, ..., last, 0] (closed tour starting at entry_node).
        intra_order = [reordered[i] for i in intra_tsp.order]

        # Add all intra-cluster legs EXCEPT the final return-to-entry.
        # zip(intra_order[:-2], intra_order[1:-1]) produces (src, tgt) pairs
        # for the open path: entry_node → ... → last_stop.
        for src, tgt in zip(intra_order[:-2], intra_order[1:-1], strict=True):
            leg = RouteLeg(
                source=src,
                target=tgt,
                distance_m=full_matrix.distances[full_node_idx[src]][full_node_idx[tgt]],
                path=full_matrix.paths[(src, tgt)],
            )
            all_legs.append(leg)
            route_order.append(tgt)

        prev_exit_node = intra_order[-2]  # last stop before the closed-tour return

    # ------------------------------------------------------------------ #
    # 5.  Final return leg: last cluster exit → store                     #
    # ------------------------------------------------------------------ #
    dijkstra_result = run_dijkstra(graph, prev_exit_node, targets={store_node})
    return_distance = int(dijkstra_result.distances[store_node])
    return_path = reconstruct_path(
        dijkstra_result.predecessors, prev_exit_node, store_node
    )
    final_leg = RouteLeg(
        source=prev_exit_node,
        target=store_node,
        distance_m=return_distance,
        path=return_path,
    )
    all_legs.append(final_leg)
    route_order.append(store_node)
    total_dijkstra_runs += 1

    # ------------------------------------------------------------------ #
    # 6.  Assemble result                                                  #
    # ------------------------------------------------------------------ #
    total_distance = sum(leg.distance_m for leg in all_legs)
    route_result = RouteResult(
        order=route_order,
        total_distance_m=total_distance,
        legs=all_legs,
    )

    return ClusteredResult(
        route=route_result,
        metadata=ClusteredMetadata(
            num_clusters=k,
            branches_explored=total_branches_explored,
            branches_pruned=total_branches_pruned,
            centroid_matrix_size=inter_matrix.matrix_size,
            dijkstra_runs=total_dijkstra_runs,
        ),
    )
