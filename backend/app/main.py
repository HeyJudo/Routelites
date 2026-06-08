from __future__ import annotations

import os
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
from app.services.optimizer import (
    RouteResult,
    build_distance_matrix,
    compute_naive_route,
    compute_route_from_tsp_result,
)

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

    if len(request.stops) > 10:
        raise HTTPException(
            status_code=501,
            detail=(
                "Clustered large-route mode is planned next. "
                "Exact mode is currently implemented for 1-10 stops."
            ),
        )

    selected_nodes = [
        graph.nearest_node(request.store.lat, request.store.lng),
        *[
            graph.nearest_node(stop.lat, stop.lng)
            for stop in request.stops
        ],
    ]
    if len(set(selected_nodes)) != len(selected_nodes):
        raise HTTPException(
            status_code=422,
            detail=(
                "Store and stops must map to distinct route nodes in demo mode. "
                "Adjust duplicate or very close coordinates."
            ),
        )

    matrix_result = build_distance_matrix(graph, selected_nodes)
    tsp_result = solve_tsp_branch_bound(matrix_result.distances)
    optimized_route = compute_route_from_tsp_result(matrix_result, tsp_result)
    naive_route = compute_naive_route(matrix_result)
    savings_distance = naive_route.total_distance_m - optimized_route.total_distance_m
    savings_percentage = round(
        (savings_distance / naive_route.total_distance_m) * 100,
        2,
    )
    computation_time_ms = int((perf_counter() - start_time) * 1000)

    places: dict[str, PlaceInfo] = {
        selected_nodes[0]: PlaceInfo(label=request.store.label, address=request.store.address),
    }
    for stop, node_id in zip(request.stops, selected_nodes[1:], strict=True):
        places[node_id] = PlaceInfo(label=stop.label, address=stop.address)

    return OptimizeResponse(
        optimized_route=_to_route_response(graph, optimized_route),
        naive_route=_to_route_response(graph, naive_route),
        savings=SavingsResponse(
            distance_m=savings_distance,
            percentage=savings_percentage,
        ),
        metadata=MetadataResponse(
            mode="exact",
            stops_processed=len(request.stops),
            dijkstra_runs=matrix_result.dijkstra_runs,
            distance_matrix_size=matrix_result.matrix_size,
            branches_explored=tsp_result.branches_explored,
            branches_pruned=tsp_result.branches_pruned,
            batches_used=1,
            exact_global_optimum=True,
            computation_time_ms=computation_time_ms,
        ),
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
            )
            for leg in route.legs
        ],
    )
