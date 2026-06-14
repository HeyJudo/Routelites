from __future__ import annotations

import logging
import math
import os
from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal

import httpx

if TYPE_CHECKING:
    from app.graph import RoadGraph

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class TimeMatrixResult:
    node_order: list[str]
    times_min: list[list[int]]  # square, INTEGER minutes; self-pairs = 0
    delays_min: list[list[float]]  # traffic delay vs free-flow, float, display-only; diagonal 0
    source: Literal["live", "mock"]


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return approximate distance in metres between two lat/lng points."""
    R = 6_371_000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _build_live(coords: list[tuple[float, float]]) -> tuple[list[list[int]], list[list[float]]]:
    """
    Call TomTom Matrix Routing v2 synchronously and return an n×n integer-minutes matrix
    and an n×n float delays_min matrix.
    Raises on any error (caller falls back to mock).
    """
    api_key = os.getenv("TOMTOM_API_KEY", "")
    if not api_key:
        raise ValueError("TOMTOM_API_KEY is not set")

    n = len(coords)
    points = [{"point": {"latitude": lat, "longitude": lng}} for lat, lng in coords]

    body = {
        "origins": points,
        "destinations": points,
        "options": {
            "routeType": "fastest",
            "traffic": "live",
            "travelMode": "car",
            "departAt": "now",
        },
    }

    url = f"https://api.tomtom.com/routing/matrix/2?key={api_key}"
    response = httpx.post(url, json=body, timeout=10.0)

    if response.status_code != 200:
        raise RuntimeError(
            f"TomTom Matrix API returned HTTP {response.status_code}: {response.text[:200]}"
        )

    data = response.json()

    # TomTom v2 returns {"data": [...]} where each element has
    # originIndex, destinationIndex, routeSummary.travelTimeInSeconds
    LARGE_PENALTY = 9999  # minutes — used for missing/no-route pairs

    matrix: list[list[int]] = [[LARGE_PENALTY] * n for _ in range(n)]
    delays: list[list[float]] = [[0.0] * n for _ in range(n)]
    for i in range(n):
        matrix[i][i] = 0
        delays[i][i] = 0.0

    raw_data = data.get("data", [])
    for item in raw_data:
        i = item.get("originIndex")
        j = item.get("destinationIndex")
        if i is None or j is None:
            continue
        summary = item.get("routeSummary")
        if summary is None:
            continue
        seconds = summary.get("travelTimeInSeconds")
        if seconds is None:
            continue
        minutes = int(round(seconds / 60))
        matrix[i][j] = minutes
        delay_seconds = summary.get("trafficDelayInSeconds", 0) or 0
        delays[i][j] = delay_seconds / 60.0

    # Ensure diagonal is 0
    for i in range(n):
        matrix[i][i] = 0
        delays[i][i] = 0.0

    return matrix, delays


BASELINE_KMH = 20.0  # free-flow baseline speed used in mock traffic simulation


def _build_mock(
    coords: list[tuple[float, float]],
    distances: list[list[int]] | None,
) -> tuple[list[list[int]], list[list[float]]]:
    """
    Build a synthetic time matrix deterministically — no random(), no Date.now().
    Uses distances (metres) if provided; falls back to haversine.
    Assumes BASELINE_KMH free-flow with a per-cell congestion multiplier derived from
    (i * 7 + j * 13) % 9 to keep it reproducible.

    Returns (times_min, delays_min):
      times_min[i][j] = int(round(free_flow_min * multiplier))  — INTEGER
      delays_min[i][j] = max(0.0, travel_min_float - free_flow_min)  — FLOAT
    """
    n = len(coords)
    matrix: list[list[int]] = []
    delays: list[list[float]] = []

    for i in range(n):
        row: list[int] = []
        delay_row: list[float] = []
        for j in range(n):
            if i == j:
                row.append(0)
                delay_row.append(0.0)
                continue

            if distances is not None:
                metres = distances[i][j]
            else:
                lat1, lng1 = coords[i]
                lat2, lng2 = coords[j]
                metres = _haversine_m(lat1, lng1, lat2, lng2)

            # Free-flow time at baseline speed
            free_flow_min = (metres / 1000.0) / BASELINE_KMH * 60.0

            # Deterministic congestion multiplier in [1.0, 1.8]
            # Using integer index arithmetic — no randomness, no Date
            factor_step = (i * 7 + j * 13) % 9  # 0..8
            multiplier = 1.0 + factor_step * (0.8 / 8.0)  # 1.0..1.8

            travel_min_float = free_flow_min * multiplier
            minutes = max(1, int(round(travel_min_float)))
            delay = max(0.0, travel_min_float - free_flow_min)

            row.append(minutes)
            delay_row.append(delay)

        matrix.append(row)
        delays.append(delay_row)

    return matrix, delays


def build_time_matrix(
    graph: RoadGraph,
    selected_nodes: list[str],
    *,
    traffic_mode: str,
    distances: list[list[int]] | None = None,
) -> TimeMatrixResult:
    """
    Build a travel-time matrix (integer minutes) for selected_nodes.

    node_order is identical to selected_nodes so times_min[i][j] aligns
    with the same stop indices as the distance matrix.

    traffic_mode: "live" -> try TomTom API, fall back to mock on any failure.
                  anything else -> mock directly.
    """
    coords: list[tuple[float, float]] = [
        (graph.nodes[n].lat, graph.nodes[n].lng) for n in selected_nodes
    ]
    node_order = list(selected_nodes)

    if traffic_mode == "live":
        try:
            times_min, delays_min = _build_live(coords)
            return TimeMatrixResult(
                node_order=node_order,
                times_min=times_min,
                delays_min=delays_min,
                source="live",
            )
        except Exception as exc:
            logger.warning(
                "TomTom live matrix failed (%s: %s) — falling back to mock.",
                type(exc).__name__,
                exc,
            )
            times_min, delays_min = _build_mock(coords, distances)
            return TimeMatrixResult(
                node_order=node_order,
                times_min=times_min,
                delays_min=delays_min,
                source="mock",
            )
    else:
        times_min, delays_min = _build_mock(coords, distances)
        return TimeMatrixResult(
            node_order=node_order,
            times_min=times_min,
            delays_min=delays_min,
            source="mock",
        )
