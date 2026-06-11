import math

from app.algorithms.clustering import cluster_stops


def _all_stops_assigned_exactly_once(clusters: list[list[int]], n: int) -> bool:
    assigned = sorted(idx for group in clusters for idx in group)
    return assigned == list(range(n))


def test_30_stops_produce_around_4_clusters_all_assigned():
    # 30 evenly spaced stops in a 6x5 lat/lng grid.
    coords = [(14.0 + i * 0.01, 121.0 + j * 0.01) for i in range(6) for j in range(5)]
    assert len(coords) == 30

    result = cluster_stops(coords, cluster_size=8)

    expected_k = math.ceil(30 / 8)  # 4
    assert len(result.clusters) == expected_k
    assert all(len(c) <= 10 for c in result.clusters), "No cluster should exceed ~10 stops"
    assert _all_stops_assigned_exactly_once(result.clusters, 30)
    assert len(result.centroids) == expected_k


def test_cluster_count_scales_with_stop_count():
    coords = [(14.0 + i * 0.005, 121.0 + i * 0.005) for i in range(50)]

    result = cluster_stops(coords, cluster_size=8)

    expected_k = math.ceil(50 / 8)  # 7
    assert len(result.clusters) == expected_k
    assert _all_stops_assigned_exactly_once(result.clusters, 50)


def test_small_input_below_cluster_size_stays_as_one_cluster():
    coords = [(14.0 + i * 0.01, 121.0) for i in range(5)]

    result = cluster_stops(coords, cluster_size=8)

    assert len(result.clusters) == 1
    assert _all_stops_assigned_exactly_once(result.clusters, 5)


def test_exact_cluster_size_boundary():
    # 16 stops with cluster_size=8 → exactly 2 clusters.
    coords = [(14.0 + i * 0.01, 121.0) for i in range(16)]

    result = cluster_stops(coords, cluster_size=8)

    assert len(result.clusters) == 2
    assert _all_stops_assigned_exactly_once(result.clusters, 16)


def test_empty_input_returns_empty():
    result = cluster_stops([], cluster_size=8)

    assert result.clusters == []
    assert result.centroids == []


def test_single_stop_returns_one_cluster():
    result = cluster_stops([(14.5, 121.0)], cluster_size=8)

    assert result.clusters == [[0]]
    assert len(result.centroids) == 1


def test_centroids_are_within_coord_bounding_box():
    coords = [(14.0 + i * 0.01, 121.0 + i * 0.01) for i in range(24)]

    result = cluster_stops(coords, cluster_size=8)

    min_lat = min(c[0] for c in coords)
    max_lat = max(c[0] for c in coords)
    min_lng = min(c[1] for c in coords)
    max_lng = max(c[1] for c in coords)

    for lat, lng in result.centroids:
        assert min_lat <= lat <= max_lat
        assert min_lng <= lng <= max_lng


def test_result_is_deterministic_with_same_seed():
    coords = [(14.0 + i * 0.007, 121.0 + j * 0.007) for i in range(6) for j in range(5)]

    r1 = cluster_stops(coords, cluster_size=8, seed=0)
    r2 = cluster_stops(coords, cluster_size=8, seed=0)

    assert r1.clusters == r2.clusters
    assert r1.centroids == r2.centroids
