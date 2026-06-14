"""
Tests for per-leg congestion data added in the traffic-aware time mode.

Uses the demo graph (create_demo_graph) which is active when NCR_GRAPH_PATH is absent.
Store = "store" node (14.5995, 120.9842), stops = stop_a / stop_b / stop_c.
"""
from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

STORE_PAYLOAD = {"lat": 14.5995, "lng": 120.9842, "label": "Store", "address": ""}
STOPS_PAYLOAD = [
    {"id": "s1", "lat": 14.6010, "lng": 120.9850, "label": "Stop A", "address": ""},
    {"id": "s2", "lat": 14.6030, "lng": 120.9870, "label": "Stop B", "address": ""},
    {"id": "s3", "lat": 14.6050, "lng": 120.9890, "label": "Stop C", "address": ""},
]

CONGESTION_VALUES = {"low", "moderate", "heavy"}


def _make_client(traffic_mode: str = "mock", tomtom_key: str = "") -> TestClient:
    os.environ["TRAFFIC_MODE"] = traffic_mode
    if tomtom_key:
        os.environ["TOMTOM_API_KEY"] = tomtom_key
    elif "TOMTOM_API_KEY" in os.environ:
        # Clear key so live mode properly falls back when key absent
        pass

    # Re-import app after env vars are set (app reads env at import time for graph,
    # but traffic_mode / api_key are read at request time so no re-import needed).
    from app.main import app
    return TestClient(app)


# ---------------------------------------------------------------------------
# Mock mode — time optimize
# ---------------------------------------------------------------------------

def test_time_mode_mock_legs_have_congestion():
    """Each optimized leg must have time_min (float) and a valid congestion value."""
    os.environ["TRAFFIC_MODE"] = "mock"
    from app.main import app
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={"store": STORE_PAYLOAD, "stops": STOPS_PAYLOAD, "mode": "time"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    legs = data["optimized_route"]["legs"]
    assert len(legs) > 0, "Expected at least one leg"

    congestion_seen = []
    for leg in legs:
        assert "time_min" in leg, f"time_min missing from leg: {leg}"
        assert leg["time_min"] is not None, "time_min should not be None in time mode"
        assert isinstance(leg["time_min"], float), f"time_min should be float, got {type(leg['time_min'])}"
        assert "congestion" in leg, f"congestion missing from leg: {leg}"
        assert leg["congestion"] in CONGESTION_VALUES, (
            f"Invalid congestion value '{leg['congestion']}'; expected one of {CONGESTION_VALUES}"
        )
        congestion_seen.append(leg["congestion"])

    print(f"\nMock mode congestion per leg: {congestion_seen}")


def test_time_mode_mock_total_distance_is_metres():
    """total_distance_m must be integer metres, NOT minutes."""
    os.environ["TRAFFIC_MODE"] = "mock"
    from app.main import app
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={"store": STORE_PAYLOAD, "stops": STOPS_PAYLOAD, "mode": "time"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    total_m = data["optimized_route"]["total_distance_m"]
    # Demo graph edge weights are in the hundreds-thousands of metres range
    # Minutes would be single or double digits — use a sanity floor
    assert isinstance(total_m, int), "total_distance_m must be int"
    assert total_m > 100, (
        f"total_distance_m={total_m} looks suspiciously small — may have been set to minutes"
    )


def test_time_mode_mock_metadata_traffic_as_of():
    """metadata.traffic_as_of must be a non-empty ISO 8601 string."""
    os.environ["TRAFFIC_MODE"] = "mock"
    from app.main import app
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={"store": STORE_PAYLOAD, "stops": STOPS_PAYLOAD, "mode": "time"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    traffic_as_of = data["metadata"].get("traffic_as_of")
    assert traffic_as_of is not None, "metadata.traffic_as_of should not be None in time mode"
    assert isinstance(traffic_as_of, str) and len(traffic_as_of) > 0, (
        "metadata.traffic_as_of should be a non-empty string"
    )
    # Basic ISO format check: contains 'T' and looks like a datetime
    assert "T" in traffic_as_of, f"Expected ISO timestamp with 'T', got: {traffic_as_of}"


# ---------------------------------------------------------------------------
# Distance mode — congestion must be None
# ---------------------------------------------------------------------------

def test_distance_mode_legs_have_no_congestion():
    """Distance mode must not populate congestion or time_min on legs."""
    os.environ["TRAFFIC_MODE"] = "mock"
    from app.main import app
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={"store": STORE_PAYLOAD, "stops": STOPS_PAYLOAD, "mode": "distance"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    for leg in data["optimized_route"]["legs"]:
        assert leg.get("congestion") is None, (
            f"Distance mode leg should have congestion=None, got {leg.get('congestion')}"
        )
        assert leg.get("time_min") is None, (
            f"Distance mode leg should have time_min=None, got {leg.get('time_min')}"
        )

    # traffic_as_of should also be None in distance mode
    assert data["metadata"].get("traffic_as_of") is None, (
        "metadata.traffic_as_of should be None in distance mode"
    )


def test_distance_mode_savings_unaffected():
    """Ensure distance mode still returns valid distance savings."""
    os.environ["TRAFFIC_MODE"] = "mock"
    from app.main import app
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={"store": STORE_PAYLOAD, "stops": STOPS_PAYLOAD, "mode": "distance"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    savings = data["savings"]
    assert isinstance(savings["distance_m"], int)
    assert isinstance(savings["percentage"], float)
    assert savings.get("time_min") is None  # not set in distance mode


# ---------------------------------------------------------------------------
# Live mode — with real API key (falls back to mock if network is down)
# ---------------------------------------------------------------------------

def test_time_mode_live_legs_have_congestion():
    """Live mode (or mock fallback) must still provide per-leg congestion."""
    os.environ["TRAFFIC_MODE"] = "live"
    os.environ["TOMTOM_API_KEY"] = "Q1MEmDtA8z9UqQOJN4zcMdmci4VA3GcP"
    from app.main import app
    client = TestClient(app)

    response = client.post(
        "/api/optimize",
        json={"store": STORE_PAYLOAD, "stops": STOPS_PAYLOAD, "mode": "time"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    traffic_source = data["metadata"]["traffic_source"]
    assert traffic_source in ("live", "mock"), (
        f"Unexpected traffic_source: {traffic_source}"
    )

    legs = data["optimized_route"]["legs"]
    congestion_seen = []
    for leg in legs:
        assert leg["time_min"] is not None, "time_min should not be None in live/mock fallback"
        assert leg["congestion"] in CONGESTION_VALUES, (
            f"Invalid congestion '{leg['congestion']}'"
        )
        congestion_seen.append(leg["congestion"])

    print(f"\nLive mode (source={traffic_source}) congestion per leg: {congestion_seen}")
