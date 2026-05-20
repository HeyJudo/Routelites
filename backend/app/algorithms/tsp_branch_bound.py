from dataclasses import dataclass


@dataclass(frozen=True)
class TspResult:
    order: list[int]
    total_distance: int
    branches_explored: int
    branches_pruned: int


def solve_tsp_branch_bound(distances: list[list[int]]) -> TspResult:
    _validate_distance_matrix(distances)

    node_count = len(distances)
    if node_count == 1:
        return TspResult(
            order=[0, 0],
            total_distance=0,
            branches_explored=1,
            branches_pruned=0,
        )

    if node_count == 2:
        return TspResult(
            order=[0, 1, 0],
            total_distance=distances[0][1] + distances[1][0],
            branches_explored=1,
            branches_pruned=0,
        )

    best_order = list(range(node_count)) + [0]
    best_cost = _route_cost(distances, best_order)
    branches_explored = 0
    branches_pruned = 0

    min_outgoing = _min_outgoing_edges(distances)

    def search(path: list[int], unvisited: set[int], cost_so_far: int) -> None:
        nonlocal best_cost
        nonlocal best_order
        nonlocal branches_explored
        nonlocal branches_pruned

        branches_explored += 1

        if not unvisited:
            total_cost = cost_so_far + distances[path[-1]][0]
            if total_cost < best_cost:
                best_cost = total_cost
                best_order = [*path, 0]
            return

        lower_bound = cost_so_far + min_outgoing[path[-1]]
        lower_bound += sum(min_outgoing[node] for node in unvisited)

        if lower_bound >= best_cost:
            branches_pruned += 1
            return

        for next_node in sorted(unvisited):
            search(
                [*path, next_node],
                unvisited - {next_node},
                cost_so_far + distances[path[-1]][next_node],
            )

    search([0], set(range(1, node_count)), 0)

    return TspResult(
        order=best_order,
        total_distance=best_cost,
        branches_explored=branches_explored,
        branches_pruned=branches_pruned,
    )


def _validate_distance_matrix(distances: list[list[int]]) -> None:
    if not distances:
        raise ValueError("distance matrix must not be empty")

    expected_size = len(distances)
    if any(len(row) != expected_size for row in distances):
        raise ValueError("distance matrix must be square")


def _route_cost(distances: list[list[int]], order: list[int]) -> int:
    total = 0
    for source, target in zip(order[:-1], order[1:], strict=True):
        total += distances[source][target]
    return total


def _min_outgoing_edges(distances: list[list[int]]) -> list[int]:
    min_edges: list[int] = []

    for source, row in enumerate(distances):
        cheapest = min(
            distance
            for target, distance in enumerate(row)
            if target != source
        )
        min_edges.append(cheapest)

    return min_edges
