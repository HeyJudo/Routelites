"""
Tests for the clustered B&B orchestrator (Phase 3.2).

A synthetic 7x7 grid graph (49 nodes) is used so tests are self-contained
and do not require the NCR graph to be present.

Grid layout:
  - Nodes labelled "r{row}c{col}" (row 0-6, col 0-6).
  - Bidirectional edges connecting each node to its N/S/E/W neighbours.
  - Edge weight = 1000 m for horizontal, 1200 m for vertical (asymmetry for
    realism; Dijkstra is bidirectional so the graph is navigable throughout).
  - Store = "r0c0"; stop nodes drawn from the rest of the grid.
"""

import pytest

from app.graph import GraphEdge, GraphNode, RoadGraph
from app.services.clustered_optimizer import solve_clustered


# ---------------------------------------------------------------------------
# Shared synthetic graph
# ---------------------------------------------------------------------------

ROWS = 7
COLS = 7
H_DIST = 1000   # horizontal edge weight (metres)
V_DIST = 1200   # vertical edge weight (metres)


def _node_id(r: int, c: int) -> str:
    return f"r{r}c{c}"


def _build_grid_graph() -> RoadGraph:
    nodes = [
        GraphNode(id=_node_id(r, c), lat=14.5 + r * 0.01, lng=121.0 + c * 0.01)
        for r in range(ROWS)
        for c in range(COLS)
    ]

    edges: dict[str, list[GraphEdge]] = {_node_id(r, c): [] for r in range(ROWS) for c in range(COLS)}

    for r in range(ROWS):
        for c in range(COLS):
            src = _node_id(r, c)
            # East
            if c + 1 < COLS:
                edges[src].append(GraphEdge(target=_node_id(r, c + 1), distance_m=H_DIST))
            # West
            if c - 1 >= 0:
                edges[src].append(GraphEdge(target=_node_id(r, c - 1), distance_m=H_DIST))
            # South
            if r + 1 < ROWS:
                edges[src].append(GraphEdge(target=_node_id(r + 1, c), distance_m=V_DIST))
            # North
            if r - 1 >= 0:
                edges[src].append(GraphEdge(target=_node_id(r - 1, c), distance_m=V_DIST))

    return RoadGraph(nodes=nodes, edges=edges)


@pytest.fixture(scope="module")
def grid_graph() -> RoadGraph:
    return _build_grid_graph()


def _grid_stop_nodes(n: int, skip_store: bool = True) -> list[str]:
    """Return n node IDs from the grid, skipping the store (r0c0) by default."""
    nodes = [
        _node_id(r, c)
        for r in range(ROWS)
        for c in range(COLS)
        if not (skip_store and r == 0 and c == 0)
    ]
    return nodes[:n]


STORE = _node_id(0, 0)


# ---------------------------------------------------------------------------
# Correctness: valid tour
# ---------------------------------------------------------------------------

def _is_valid_tour(route_order: list[str], store: str, stop_nodes: list[str]) -> bool:
    """
    Checks that the returned order is a valid closed tour:
      - Starts and ends at the store.
      - Visits every stop exactly once.
    """
    if route_order[0] != store or route_order[-1] != store:
        return False
    interior = route_order[1:-1]
    return sorted(interior) == sorted(stop_nodes)


def test_40_stops_valid_tour(grid_graph):
    stop_nodes = _grid_stop_nodes(40)
    result = solve_clustered(grid_graph, STORE, stop_nodes)

    assert _is_valid_tour(result.route.order, STORE, stop_nodes), (
        "Route must start/end at store and visit every stop exactly once."
    )


def test_legs_are_continuous(grid_graph):
    """Each leg's target must equal the next leg's source."""
    stop_nodes = _grid_stop_nodes(40)
    result = solve_clustered(grid_graph, STORE, stop_nodes)
    legs = result.route.legs

    for i in range(len(legs) - 1):
        assert legs[i].target == legs[i + 1].source, (
            f"Leg {i} target '{legs[i].target}' != leg {i+1} source '{legs[i+1].source}'"
        )


def test_total_distance_matches_leg_sum(grid_graph):
    stop_nodes = _grid_stop_nodes(40)
    result = solve_clustered(grid_graph, STORE, stop_nodes)

    leg_sum = sum(leg.distance_m for leg in result.route.legs)
    assert result.route.total_distance_m == leg_sum


def test_all_legs_have_non_empty_polyline(grid_graph):
    stop_nodes = _grid_stop_nodes(40)
    result = solve_clustered(grid_graph, STORE, stop_nodes)

    for leg in result.route.legs:
        assert len(leg.path) >= 2, f"Leg {leg.source}→{leg.target} has no path."
        assert leg.path[0] == leg.source
        assert leg.path[-1] == leg.target


# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------

def test_metadata_num_clusters(grid_graph):
    import math
    stop_nodes = _grid_stop_nodes(40)
    result = solve_clustered(grid_graph, STORE, stop_nodes, cluster_size=8)

    expected_k = math.ceil(40 / 8)  # 5
    assert result.metadata.num_clusters == expected_k


def test_metadata_branches_explored_positive(grid_graph):
    stop_nodes = _grid_stop_nodes(16)
    result = solve_clustered(grid_graph, STORE, stop_nodes)

    assert result.metadata.branches_explored > 0


def test_metadata_dijkstra_runs_positive(grid_graph):
    stop_nodes = _grid_stop_nodes(16)
    result = solve_clustered(grid_graph, STORE, stop_nodes)

    assert result.metadata.dijkstra_runs > 0


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

def test_single_stop(grid_graph):
    stop_nodes = [_node_id(3, 3)]
    result = solve_clustered(grid_graph, STORE, stop_nodes)

    assert _is_valid_tour(result.route.order, STORE, stop_nodes)
    assert len(result.route.legs) == 2   # store→stop, stop→store
    assert result.metadata.num_clusters == 1


def test_exactly_one_cluster(grid_graph):
    stop_nodes = _grid_stop_nodes(6)
    result = solve_clustered(grid_graph, STORE, stop_nodes, cluster_size=8)

    assert _is_valid_tour(result.route.order, STORE, stop_nodes)
    assert result.metadata.num_clusters == 1


def test_60_stops_valid_tour(grid_graph):
    """Stress test: 60 stops → ~8 clusters; still produces a valid tour."""
    stop_nodes = _grid_stop_nodes(48)  # grid has 49 nodes; 48 after skipping store
    result = solve_clustered(grid_graph, STORE, stop_nodes)

    assert _is_valid_tour(result.route.order, STORE, stop_nodes)
