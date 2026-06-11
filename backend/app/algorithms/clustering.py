from __future__ import annotations

import math
import random
from dataclasses import dataclass


@dataclass(frozen=True)
class ClusterResult:
    clusters: list[list[int]]
    centroids: list[tuple[float, float]]


def cluster_stops(
    coords: list[tuple[float, float]],
    cluster_size: int = 8,
    max_iter: int = 100,
    seed: int = 42,
) -> ClusterResult:
    """
    Partition stops into spatially compact groups using k-means on (lat, lng).

    Args:
        coords: List of (lat, lng) for each stop (index matches stop index).
        cluster_size: Target max stops per cluster; k = ceil(n / cluster_size).
        max_iter: Maximum k-means iterations before declaring convergence.
        seed: RNG seed for reproducible centroid initialisation.

    Returns:
        ClusterResult with index groups (all stops assigned exactly once)
        and final centroid coordinates.
    """
    n = len(coords)
    if n == 0:
        return ClusterResult(clusters=[], centroids=[])

    k = math.ceil(n / cluster_size)
    if k >= n:
        # Each stop is its own cluster when n <= cluster_size threshold.
        return ClusterResult(
            clusters=[[i] for i in range(n)],
            centroids=list(coords),
        )

    rng = random.Random(seed)
    centroids = _kmeans_plus_plus_init(coords, k, rng)

    assignments: list[int] = [0] * n

    for _ in range(max_iter):
        # Assignment step.
        new_assignments = [_nearest_centroid(c, centroids) for c in coords]

        if new_assignments == assignments:
            break  # Converged.

        assignments = new_assignments

        # Update step — recompute centroids; keep old centroid if a cluster empties.
        sums: list[list[float]] = [[0.0, 0.0] for _ in range(k)]
        counts: list[int] = [0] * k
        for idx, cluster_id in enumerate(assignments):
            sums[cluster_id][0] += coords[idx][0]
            sums[cluster_id][1] += coords[idx][1]
            counts[cluster_id] += 1

        for j in range(k):
            if counts[j] > 0:
                centroids[j] = (sums[j][0] / counts[j], sums[j][1] / counts[j])

    # Build index groups from final assignments.
    clusters: list[list[int]] = [[] for _ in range(k)]
    for idx, cluster_id in enumerate(assignments):
        clusters[cluster_id].append(idx)

    # Drop empty clusters (can happen with k > distinct points).
    clusters = [c for c in clusters if c]
    final_centroids = [_mean_coord([coords[i] for i in group]) for group in clusters]

    return ClusterResult(clusters=clusters, centroids=final_centroids)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _kmeans_plus_plus_init(
    coords: list[tuple[float, float]],
    k: int,
    rng: random.Random,
) -> list[tuple[float, float]]:
    """K-means++ seeding: spread initial centroids to reduce bad starts."""
    chosen = [rng.choice(coords)]

    for _ in range(k - 1):
        dists = [min(_sq_dist(c, centroid) for centroid in chosen) for c in coords]
        total = sum(dists)
        if total == 0:
            chosen.append(rng.choice(coords))
            continue
        threshold = rng.random() * total
        cumulative = 0.0
        for coord, d in zip(coords, dists):
            cumulative += d
            if cumulative >= threshold:
                chosen.append(coord)
                break
        else:
            chosen.append(coords[-1])

    return list(chosen)


def _nearest_centroid(
    coord: tuple[float, float],
    centroids: list[tuple[float, float]],
) -> int:
    return min(range(len(centroids)), key=lambda j: _sq_dist(coord, centroids[j]))


def _sq_dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def _mean_coord(coords: list[tuple[float, float]]) -> tuple[float, float]:
    lat = sum(c[0] for c in coords) / len(coords)
    lng = sum(c[1] for c in coords) / len(coords)
    return (lat, lng)
