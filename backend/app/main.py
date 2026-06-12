from __future__ import annotations

import os
from datetime import datetime
from time import perf_counter

from fastapi import FastAPI, HTTPException

from app.algorithms.tsp_branch_bound import solve_tsp_branch_bound
from app.graph import RoadGraph, create_demo_graph, load_ncr_graph
from app.models import (
    MetadataResponse,
    OptimizeRequest,
    OptimizeResponse,
    PlaceInfo,
    RouteLegResponse,
    RoutePathPoint,
    RouteResponse,
    SavingsResponse,
)
from app.services.clustered_optimizer import solve_clustered
from app.services.optimizer import (
    RouteResult,
    build_distance_matrix,
    build_naive_route_sequential,
    compute_naive_route,
    compute_route_from_tsp_result,
    compute_route_from_tsp_result_time,
)
from app.services.traffic import build_time_matrix

app = FastAPI(title="RouteLite API")

_GRAPH_PATH = os.getenv("NCR_GRAPH_PATH", "data/ncr_graph.json")

if os.path.exists(_GRAPH_PATH):
    print(f"Loading NCR road graph from {_GRAPH_PATH} ...")
    graph = load_ncr_graph(_GRAPH_PATH)
    _graph_mode = "ncr"
    print(f"NCR graph loaded: {len(graph.nodes)} nodes")
else:
    print("NCR graph file not found — using demo graph. Run scripts/build_ncr_graph.py to build it.")
    graph = create_demo_graph()
    _graph_mode = "demo"

_EXACT_THRESHOLD = 10
_MAX_STOPS = 150


@app.get("/health")
def health_check() -> dict[str, bool | str]:
    return {
        "status": "ok",
        "graph_loaded": True,
        "graph_mode": _graph_mode,
    }


@app.post("/api/optimize", response_model=OptimizeResponse)
def optimize_route(request: OptimizeRequest) -> OptimizeResponse:
    start_time = perf_counter()

    n_stops = len(request.stops)

    if n_stops > _MAX_STOPS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Route optimisation supports up to {_MAX_STOPS} stops. "
                f"Received {n_stops}. Split your run into smaller batches."
            ),
        )

    store_node = graph.nearest_node(request.store.lat, request.store.lng)
    stop_nodes = [graph.nearest_node(stop.lat, stop.lng) for stop in request.stops]
    selected_nodes = [store_node] + stop_nodes

    if len(set(selected_nodes)) != len(selected_nodes):
        raise HTTPException(
            status_code=422,
            detail=(
                "Store and stops must map to distinct route nodes in demo mode. "
                "Adjust duplicate or very close coordinates."
            ),
        )

    mode = "exact" if n_stops <= _EXACT_THRESHOLD else "clustered"

    # Fastest-in-traffic only supports the exact regime; reject larger routes so a
    # time request never silently falls through to the distance-only clustered branch.
    if request.mode == "time" and n_stops > _EXACT_THRESHOLD:
        raise HTTPException(
            status_code=422,
            detail="Fastest-in-traffic is available for up to 10 stops.",
        )

    if mode == "exact":
        # Always build the distance matrix first — needed for polylines and metres.
        matrix_result = build_distance_matrix(graph, selected_nodes)

        if request.mode == "time":
            time_result = build_time_matrix(
                graph,
                selected_nodes,
                traffic_mode=os.getenv("TRAFFIC_MODE", "mock"),
                distances=matrix_result.distances,
            )

            # TSP runs on the integer-minutes matrix to determine visit ORDER.
            tsp_result = solve_tsp_branch_bound(time_result.times_min)

            # Assemble route: order from time TSP, metres/polylines from distance matrix.
            optimized_route = compute_route_from_tsp_result_time(matrix_result, tsp_result, time_result)
            naive_route = compute_naive_route(matrix_result)

            # Compute time totals using the time matrix.
            # tsp_result.order is a list of indices into time_result.node_order
            # (which equals selected_nodes). Walk optimized and naive orders.
            def _tour_time(order_indices: list[int]) -> float:
                total = 0.0
                for a, b in zip(order_indices[:-1], order_indices[1:], strict=True):
                    total += time_result.times_min[a][b]
                return total

            optimized_time_min = _tour_time(tsp_result.order)

            # Naive order: [0, 1, 2, ..., n, 0] (input order, returning to start)
            n_nodes = len(selected_nodes)
            naive_order_indices = list(range(n_nodes)) + [0]
            naive_time_min = _tour_time(naive_order_indices)

            savings_time = naive_time_min - optimized_time_min
            if naive_time_min > 0:
                savings_time_pct = round((savings_time / naive_time_min) * 100, 2)
            else:
                savings_time_pct = 0.0

            savings_distance = naive_route.total_distance_m - optimized_route.total_distance_m
            if naive_route.total_distance_m > 0:
                savings_pct = round(
                    (savings_distance / naive_route.total_distance_m) * 100, 2
                )
            else:
                savings_pct = 0.0

            places: dict[str, PlaceInfo] = {
                store_node: PlaceInfo(label=request.store.label, address=request.store.address),
            }
            for stop, node_id in zip(request.stops, stop_nodes, strict=True):
                places[node_id] = PlaceInfo(label=stop.label, address=stop.address)

            return OptimizeResponse(
                optimized_route=_to_route_response(graph, optimized_route),
                naive_route=_to_route_response(graph, naive_route),
                savings=SavingsResponse(
                    distance_m=savings_distance,
                    percentage=savings_pct,
                    time_min=savings_time,
                ),
                metadata=MetadataResponse(
                    mode="exact",
                    stops_processed=n_stops,
                    dijkstra_runs=matrix_result.dijkstra_runs,
                    distance_matrix_size=matrix_result.matrix_size,
                    branches_explored=tsp_result.branches_explored,
                    branches_pruned=tsp_result.branches_pruned,
                    batches_used=1,
                    exact_global_optimum=True,
                    computation_time_ms=int((perf_counter() - start_time) * 1000),
                    objective="time",
                    traffic_source=time_result.source,
                    optimized_time_min=optimized_time_min,
                    naive_time_min=naive_time_min,
                    traffic_as_of=datetime.now().isoformat(),
                ),
                places=places,
            )

        # --- distance mode (unchanged) ---
        tsp_result = solve_tsp_branch_bound(matrix_result.distances)
        optimized_route = compute_route_from_tsp_result(matrix_result, tsp_result)
        naive_route = compute_naive_route(matrix_result)

        metadata = MetadataResponse(
            mode="exact",
            stops_processed=n_stops,
            dijkstra_runs=matrix_result.dijkstra_runs,
            distance_matrix_size=matrix_result.matrix_size,
            branches_explored=tsp_result.branches_explored,
            branches_pruned=tsp_result.branches_pruned,
            batches_used=1,
            exact_global_optimum=True,
            computation_time_ms=int((perf_counter() - start_time) * 1000),
        )
    else:
        clustered = solve_clustered(graph, store_node, stop_nodes)
        optimized_route = clustered.route
        naive_route = build_naive_route_sequential(
            graph, [store_node] + stop_nodes + [store_node]
        )

        metadata = MetadataResponse(
            mode="clustered",
            stops_processed=n_stops,
            dijkstra_runs=clustered.metadata.dijkstra_runs,
            distance_matrix_size=clustered.metadata.centroid_matrix_size,
            branches_explored=clustered.metadata.branches_explored,
            branches_pruned=clustered.metadata.branches_pruned,
            batches_used=clustered.metadata.num_clusters,
            exact_global_optimum=False,
            computation_time_ms=int((perf_counter() - start_time) * 1000),
        )

    savings_distance = naive_route.total_distance_m - optimized_route.total_distance_m
    savings_percentage = round(
        (savings_distance / naive_route.total_distance_m) * 100,
        2,
    )

    places: dict[str, PlaceInfo] = {
        store_node: PlaceInfo(label=request.store.label, address=request.store.address),
    }
    for stop, node_id in zip(request.stops, stop_nodes, strict=True):
        places[node_id] = PlaceInfo(label=stop.label, address=stop.address)

    return OptimizeResponse(
        optimized_route=_to_route_response(graph, optimized_route),
        naive_route=_to_route_response(graph, naive_route),
        savings=SavingsResponse(
            distance_m=savings_distance,
            percentage=savings_percentage,
        ),
        metadata=metadata,
        places=places,
    )


def _to_route_response(graph: RoadGraph, route: RouteResult) -> RouteResponse:
    return RouteResponse(
        order=route.order,
        total_distance_m=route.total_distance_m,
        legs=[
            RouteLegResponse(
                source=leg.source,
                target=leg.target,
                distance_m=leg.distance_m,
                path=[
                    RoutePathPoint(
                        lat=graph.nodes[node_id].lat,
                        lng=graph.nodes[node_id].lng,
                    )
                    for node_id in leg.path
                    if node_id in graph.nodes
                ],
                time_min=leg.time_min,
                congestion=leg.congestion,
            )
            for leg in route.legs
        ],
    )
