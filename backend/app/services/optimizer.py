from dataclasses import dataclass

from app.algorithms.dijkstra import reconstruct_path, run_dijkstra
from app.graph import RoadGraph


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


@dataclass(frozen=True)
class RouteResult:
    order: list[str]
    total_distance_m: int
    legs: list[RouteLeg]


def build_distance_matrix(
    graph: RoadGraph,
    selected_nodes: list[str],
) -> DistanceMatrixResult:
    distances: list[list[int]] = []
    paths: dict[tuple[str, str], list[str]] = {}

    for source in selected_nodes:
        dijkstra_result = run_dijkstra(graph, source)
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
