from app.graph import create_demo_graph


def test_demo_graph_has_expected_nodes():
    graph = create_demo_graph()

    assert set(graph.nodes) == {
        "store",
        "stop_a",
        "stop_b",
        "stop_c",
        "junction",
    }


def test_demo_graph_returns_outgoing_edges():
    graph = create_demo_graph()

    outgoing_edges = graph.neighbors("store")

    assert outgoing_edges == [
        ("junction", 500),
        ("stop_a", 1200),
        ("stop_b", 2200),
    ]


def test_demo_graph_preserves_asymmetric_distances():
    graph = create_demo_graph()

    assert graph.edge_distance("store", "stop_a") == 1200
    assert graph.edge_distance("stop_a", "store") == 1500


def test_demo_graph_coordinates_map_to_nearest_demo_node():
    graph = create_demo_graph()

    nearest_node = graph.nearest_node(14.5996, 120.9843)

    assert nearest_node == "store"
