from fastapi.testclient import TestClient

from app.main import app


def test_optimize_returns_exact_mode_demo_route():
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={
            "store": {
                "lat": 14.5995,
                "lng": 120.9842,
                "label": "Store",
            },
            "stops": [
                {
                    "id": "stop_c",
                    "lat": 14.6050,
                    "lng": 120.9890,
                    "label": "Stop C",
                },
                {
                    "id": "stop_a",
                    "lat": 14.6010,
                    "lng": 120.9850,
                    "label": "Stop A",
                },
                {
                    "id": "stop_b",
                    "lat": 14.6030,
                    "lng": 120.9870,
                    "label": "Stop B",
                },
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()

    optimized_order = body["optimized_route"]["order"]
    assert optimized_order[0] == "store"
    assert optimized_order[-1] == "store"
    assert set(optimized_order[1:-1]) == {"stop_a", "stop_b", "stop_c"}
    assert body["optimized_route"]["total_distance_m"] == 4450
    assert body["naive_route"]["order"] == [
        "store",
        "stop_c",
        "stop_a",
        "stop_b",
        "store",
    ]
    assert body["naive_route"]["total_distance_m"] == 5800
    assert body["savings"] == {
        "distance_m": 1350,
        "percentage": 23.28,
    }
    assert body["metadata"]["mode"] == "exact"
    assert body["metadata"]["stops_processed"] == 3
    assert body["metadata"]["dijkstra_runs"] == 4
    assert body["metadata"]["distance_matrix_size"] == "4x4"
    assert body["metadata"]["batches_used"] == 1
    assert body["metadata"]["exact_global_optimum"] is True
    assert body["metadata"]["branches_explored"] > 0


def test_optimize_rejects_empty_stop_list():
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={
            "store": {
                "lat": 14.5995,
                "lng": 120.9842,
                "label": "Store",
            },
            "stops": [],
        },
    )

    assert response.status_code == 422


def test_optimize_rejects_locations_that_snap_to_same_demo_node():
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={
            "store": {
                "lat": 14.5995,
                "lng": 120.9842,
                "label": "Store",
            },
            "stops": [
                {
                    "id": "duplicate_store",
                    "lat": 14.5995,
                    "lng": 120.9842,
                    "label": "Duplicate Store",
                }
            ],
        },
    )

    assert response.status_code == 422
    assert response.json() == {
        "detail": (
            "Store and stops must map to distinct route nodes in demo mode. "
            "Adjust duplicate or very close coordinates."
        )
    }


def test_optimize_rejects_more_than_150_stops():
    client = TestClient(app)

    stops = [
        {
            "id": f"stop_{index}",
            "lat": 14.6010 + index * 0.001,
            "lng": 120.9850 + index * 0.001,
            "label": f"Stop {index}",
        }
        for index in range(151)
    ]

    response = client.post(
        "/api/optimize",
        json={
            "store": {"lat": 14.5995, "lng": 120.9842, "label": "Store"},
            "stops": stops,
        },
    )

    assert response.status_code == 422
    assert "150" in response.json()["detail"]
    assert "151" in response.json()["detail"]
