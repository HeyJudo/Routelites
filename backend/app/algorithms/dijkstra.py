from dataclasses import dataclass
from heapq import heappop, heappush
from math import inf

from app.graph import RoadGraph


@dataclass(frozen=True)
class DijkstraResult:
    distances: dict[str, float]
    predecessors: dict[str, str]


def run_dijkstra(graph: RoadGraph, source: str) -> DijkstraResult:
    distances = {node_id: inf for node_id in graph.nodes}
    predecessors: dict[str, str] = {}
    distances[source] = 0

    queue: list[tuple[float, str]] = [(0, source)]

    while queue:
        current_distance, current_node = heappop(queue)

        if current_distance > distances[current_node]:
            continue

        for neighbor, edge_distance in graph.neighbors(current_node):
            candidate_distance = current_distance + edge_distance

            if candidate_distance < distances[neighbor]:
                distances[neighbor] = candidate_distance
                predecessors[neighbor] = current_node
                heappush(queue, (candidate_distance, neighbor))

    return DijkstraResult(distances=distances, predecessors=predecessors)


def reconstruct_path(
    predecessors: dict[str, str],
    source: str,
    target: str,
) -> list[str]:
    if source == target:
        return [source]

    if target not in predecessors:
        return []

    path = [target]
    current = target

    while current != source:
        current = predecessors.get(current, "")
        if not current:
            return []
        path.append(current)

    path.reverse()
    return path
