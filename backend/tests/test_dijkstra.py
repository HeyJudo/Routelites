from app.algorithms.dijkstra import reconstruct_path, run_dijkstra
from app.graph import create_demo_graph


def test_dijkstra_finds_shorter_path_through_junction():
    graph = create_demo_graph()

    result = run_dijkstra(graph, "store")

    assert result.distances["stop_a"] == 900
    assert reconstruct_path(result.predecessors, "store", "stop_a") == [
        "store",
        "junction",
        "stop_a",
    ]


def test_dijkstra_preserves_asymmetric_shortest_paths():
    graph = create_demo_graph()

    from_store = run_dijkstra(graph, "store")
    from_stop_a = run_dijkstra(graph, "stop_a")

    assert from_store.distances["stop_a"] == 900
    assert from_stop_a.distances["store"] == 1100


def test_reconstruct_path_returns_empty_list_for_unreachable_target():
    predecessors = {"stop_a": "junction", "junction": "store"}

    assert reconstruct_path(predecessors, "store", "missing") == []
