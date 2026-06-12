from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal

from app.algorithms.dijkstra import reconstruct_path, run_dijkstra
from app.algorithms.tsp_branch_bound import TspResult
from app.graph import RoadGraph

if TYPE_CHECKING:
    from app.services.traffic import TimeMatrixResult


@dataclass(frozen=True)
class DistanceMatrixResult:
    node_order: list[str]
    distances: list[list[int]]
    paths: dict[tuple[str, str], list[str]]
    dijkstra_runs: int
    matrix_size: str


@dataclass(frozen=True)
class RouteLeg:
    source: str
    target: str
    distance_m: int
    path: list[str]
    time_min: float | None = None
    congestion: Literal["low", "moderate", "heavy"] | None = None


@dataclass(frozen=True)
class RouteResult:
    order: list[str]
    total_distance_m: int
    legs: list[RouteLeg]


def build_distance_matrix(
    graph: RoadGraph,
    selected_nodes: list[str],
) -> DistanceMatrixResult:
    """
    Build a full n×n distance matrix using one multi-target Dijkstra per source.

    Each Dijkstra run fans out from a source and settles ALL selected targets in a
    single pass, stopping as soon as the last target is settled.  This is O(n) runs
    and is more efficient than n² individual point-to-point searches for matrix
    building because the traversal cost is amortised across all targets at once.
    """
    distances: list[list[int]] = []
    paths: dict[tuple[str, str], list[str]] = {}

    targets = set(selected_nodes)
    for source in selected_nodes:
        dijkstra_result = run_dijkstra(graph, source, targets=targets)
        row: list[int] = []

        for target in selected_nodes:
            distance = dijkstra_result.distances[target]
            row.append(int(distance))
            paths[(source, target)] = reconstruct_path(
                dijkstra_result.predecessors,
                source,
                target,
            )

        distances.append(row)

    size = len(selected_nodes)
    return DistanceMatrixResult(
        node_order=selected_nodes,
        distances=distances,
        paths=paths,
        dijkstra_runs=size,
        matrix_size=f"{size}x{size}",
    )


def build_naive_route_sequential(
    graph: RoadGraph,
    node_sequence: list[str],
) -> RouteResult:
    """
    Build a naive (input-order) route for an arbitrary node sequence by
    running one Dijkstra per consecutive pair.  O(n) Dijkstra runs instead
    of O(n²) — used for the clustered savings baseline.

    node_sequence must include the store at both ends, e.g.
      [store, stop1, stop2, ..., stopN, store]
    """
    legs: list[RouteLeg] = []
    total_distance = 0

    for source, target in zip(node_sequence[:-1], node_sequence[1:], strict=True):
        result = run_dijkstra(graph, source, targets={target})
        distance = int(result.distances[target])
        path = reconstruct_path(result.predecessors, source, target)
        legs.append(RouteLeg(source=source, target=target, distance_m=distance, path=path))
        total_distance += distance

    return RouteResult(
        order=node_sequence,
        total_distance_m=total_distance,
        legs=legs,
    )


def compute_naive_route(matrix_result: DistanceMatrixResult) -> RouteResult:
    route_order = [*matrix_result.node_order, matrix_result.node_order[0]]
    legs: list[RouteLeg] = []
    total_distance = 0

    for source, target in zip(route_order[:-1], route_order[1:], strict=True):
        source_index = matrix_result.node_order.index(source)
        target_index = matrix_result.node_order.index(target)
        distance = matrix_result.distances[source_index][target_index]
        total_distance += distance
        legs.append(
            RouteLeg(
                source=source,
                target=target,
                distance_m=distance,
                path=matrix_result.paths[(source, target)],
            )
        )

    return RouteResult(
        order=route_order,
        total_distance_m=total_distance,
        legs=legs,
    )


def compute_route_from_tsp_result(
    matrix_result: DistanceMatrixResult,
    tsp_result: TspResult,
) -> RouteResult:
    route_order = [
        matrix_result.node_order[node_index]
        for node_index in tsp_result.order
    ]
    legs: list[RouteLeg] = []

    for source, target in zip(route_order[:-1], route_order[1:], strict=True):
        source_index = matrix_result.node_order.index(source)
        target_index = matrix_result.node_order.index(target)
        distance = matrix_result.distances[source_index][target_index]
        legs.append(
            RouteLeg(
                source=source,
                target=target,
                distance_m=distance,
                path=matrix_result.paths[(source, target)],
            )
        )

    return RouteResult(
        order=route_order,
        total_distance_m=tsp_result.total_distance,
        legs=legs,
    )


def compute_route_from_tsp_result_time(
    matrix_result: DistanceMatrixResult,
    tsp_result: TspResult,
    time_result: TimeMatrixResult,
) -> RouteResult:
    """
    Assemble a RouteResult whose visit ORDER comes from a time-based TSP solve,
    but whose distance_m values (per-leg and total) come from the distance matrix.

    This is used in "time" mode where tsp_result.total_distance is in minutes —
    we must never assign that value to total_distance_m (which is metres).
    Polyline geometry (leg.path) also comes from the Dijkstra distance matrix.

    Per-leg time_min and congestion are populated from time_result.
    """
    assert matrix_result.node_order == time_result.node_order, (
        "Distance and time matrix node orders must match"
    )

    route_order = [
        matrix_result.node_order[node_index]
        for node_index in tsp_result.order
    ]
    legs: list[RouteLeg] = []
    total_distance = 0

    for source, target in zip(route_order[:-1], route_order[1:], strict=True):
        source_index = matrix_result.node_order.index(source)
        target_index = matrix_result.node_order.index(target)
        distance = matrix_result.distances[source_index][target_index]
        total_distance += distance

        leg_time_min = float(time_result.times_min[source_index][target_index])
        delay = time_result.delays_min[source_index][target_index]
        free_flow = leg_time_min - delay
        ratio = leg_time_min / free_flow if free_flow > 0 else 1.0
        if ratio < 1.25:
            congestion: Literal["low", "moderate", "heavy"] = "low"
        elif ratio < 1.6:
            congestion = "moderate"
        else:
            congestion = "heavy"

        legs.append(
            RouteLeg(
                source=source,
                target=target,
                distance_m=distance,
                path=matrix_result.paths[(source, target)],
                time_min=leg_time_min,
                congestion=congestion,
            )
        )

    return RouteResult(
        order=route_order,
        total_distance_m=total_distance,
        legs=legs,
    )
