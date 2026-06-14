from app.graph import create_demo_graph
from app.services.optimizer import (
    build_distance_matrix,
    compute_naive_route,
)


def test_build_distance_matrix_runs_dijkstra_for_each_selected_node():
    graph = create_demo_graph()

    matrix_result = build_distance_matrix(
        graph,
        ["store", "stop_a", "stop_b"],
    )

    assert matrix_result.node_order == ["store", "stop_a", "stop_b"]
    assert matrix_result.dijkstra_runs == 3  # one multi-target Dijkstra per source
    assert matrix_result.matrix_size == "3x3"
    assert matrix_result.distances == [
        [0, 900, 1400],
        [1100, 0, 700],
        [1600, 850, 0],
    ]


def test_compute_naive_route_preserves_input_order_and_returns_to_store():
    graph = create_demo_graph()
    matrix_result = build_distance_matrix(
        graph,
        ["store", "stop_a", "stop_b", "stop_c"],
    )

    route = compute_naive_route(matrix_result)

    assert route.order == ["store", "stop_a", "stop_b", "stop_c", "store"]
    assert route.total_distance_m == 4450
    assert [(leg.source, leg.target, leg.distance_m) for leg in route.legs] == [
        ("store", "stop_a", 900),
        ("stop_a", "stop_b", 700),
        ("stop_b", "stop_c", 600),
        ("stop_c", "store", 2250),
    ]
    assert route.legs[0].path == ["store", "junction", "stop_a"]
    assert route.legs[3].path == ["stop_c", "stop_b", "junction", "store"]
