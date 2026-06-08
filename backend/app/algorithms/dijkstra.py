from __future__ import annotations

from dataclasses import dataclass
from heapq import heappop, heappush
from math import inf

from app.graph import RoadGraph


@dataclass(frozen=True)
class DijkstraResult:
    distances: dict[str, float]
    predecessors: dict[str, str]


def run_dijkstra(
    graph: RoadGraph,
    source: str,
    targets: set[str] | None = None,
) -> DijkstraResult:
    distances: dict[str, float] = {source: 0}
    predecessors: dict[str, str] = {}

    queue: list[tuple[float, str]] = [(0, source)]
    settled: set[str] = set()

    while queue:
        current_distance, current_node = heappop(queue)

        if current_node in settled:
            continue
        settled.add(current_node)

        # Stop early once all target nodes are settled
        if targets is not None and targets.issubset(settled):
            break

        for neighbor, edge_distance in graph.neighbors(current_node):
            candidate_distance = current_distance + edge_distance

            if candidate_distance < distances.get(neighbor, inf):
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
