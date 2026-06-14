"""
benchmark_dijkstra.py

Prints wall-clock comparison of unidirectional vs bidirectional Dijkstra
for increasing stop counts on the NCR graph.

Usage (from backend/):
    python scripts/benchmark_dijkstra.py
    NCR_GRAPH_PATH=data/ncr_graph.json python scripts/benchmark_dijkstra.py
"""
from __future__ import annotations

import os
import random
import sys
import time
from pathlib import Path

# Allow running from backend/ without installing the package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.algorithms.dijkstra import (
    reconstruct_path,
    run_bidirectional_dijkstra,
    run_dijkstra,
)
from app.graph import RoadGraph, load_ncr_graph

NCR_GRAPH_PATH = os.environ.get(
    "NCR_GRAPH_PATH",
    str(Path(__file__).resolve().parent.parent / "data" / "ncr_graph.json"),
)

STOP_COUNTS = [5, 10, 20, 30, 50]
SEED = 42


def sample_nodes(graph: RoadGraph, n: int, rng: random.Random) -> list[str]:
    return rng.sample(list(graph.nodes.keys()), n)


def bench_unidirectional(graph: RoadGraph, nodes: list[str]) -> float:
    """Time one full unidirectional Dijkstra matrix build (n full runs)."""
    t0 = time.perf_counter()
    targets = set(nodes)
    for source in nodes:
        result = run_dijkstra(graph, source, targets=targets)
        for target in nodes:
            if source != target:
                reconstruct_path(result.predecessors, source, target)
    return time.perf_counter() - t0


def bench_bidirectional(graph: RoadGraph, nodes: list[str]) -> float:
    """Time n² point-to-point bidirectional Dijkstra runs."""
    t0 = time.perf_counter()
    for source in nodes:
        for target in nodes:
            if source != target:
                run_bidirectional_dijkstra(graph, source, target)
    return time.perf_counter() - t0


def main() -> None:
    if not Path(NCR_GRAPH_PATH).exists():
        print(f"NCR graph not found at {NCR_GRAPH_PATH}")
        print("Run: python scripts/build_ncr_graph.py  (or set NCR_GRAPH_PATH)")
        sys.exit(1)

    print(f"Loading NCR graph from {NCR_GRAPH_PATH} …", flush=True)
    graph = load_ncr_graph(NCR_GRAPH_PATH)
    print(f"  {len(graph.nodes):,} nodes loaded\n")

    rng = random.Random(SEED)

    header = f"{'Stops':>6}  {'Uni (s)':>9}  {'Bi (s)':>9}  {'Speedup':>8}"
    print(header)
    print("-" * len(header))

    for n in STOP_COUNTS:
        nodes = sample_nodes(graph, n + 1, rng)  # +1 for store node

        uni_time = bench_unidirectional(graph, nodes)
        bi_time = bench_bidirectional(graph, nodes)
        speedup = uni_time / bi_time if bi_time > 0 else float("inf")

        print(f"{n:>6}  {uni_time:>9.3f}  {bi_time:>9.3f}  {speedup:>7.2f}x")

    print()
    print("Speedup > 1x means bidirectional is faster.")


if __name__ == "__main__":
    main()
