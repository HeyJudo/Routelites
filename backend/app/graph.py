from __future__ import annotations

import json
from dataclasses import dataclass, field
from math import hypot
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass


@dataclass(frozen=True)
class GraphNode:
    id: str
    lat: float
    lng: float


@dataclass(frozen=True)
class GraphEdge:
    target: str
    distance_m: int


class RoadGraph:
    def __init__(self, nodes: list[GraphNode], edges: dict[str, list[GraphEdge]]) -> None:
        self.nodes = {node.id: node for node in nodes}
        self._edges = edges
        self._node_ids: list[str] = []
        self._kdtree = None
        self._build_spatial_index(nodes)

    def _build_spatial_index(self, nodes: list[GraphNode]) -> None:
        try:
            from scipy.spatial import KDTree
            coords = [(node.lat, node.lng) for node in nodes]
            self._node_ids = [node.id for node in nodes]
            self._kdtree = KDTree(coords)
        except ImportError:
            # scipy not available — fall back to linear scan
            self._kdtree = None

    def neighbors(self, node_id: str) -> list[tuple[str, int]]:
        return [
            (edge.target, edge.distance_m)
            for edge in self._edges.get(node_id, [])
        ]

    def edge_distance(self, source: str, target: str) -> int | None:
        for edge in self._edges.get(source, []):
            if edge.target == target:
                return edge.distance_m
        return None

    def nearest_node(self, lat: float, lng: float) -> str:
        if self._kdtree is not None:
            _, idx = self._kdtree.query([lat, lng])
            return self._node_ids[idx]
        # Linear fallback (used when scipy is absent or graph is tiny)
        nearest = min(
            self.nodes.values(),
            key=lambda node: hypot(node.lat - lat, node.lng - lng),
        )
        return nearest.id


def load_ncr_graph(path: str) -> RoadGraph:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    nodes = [
        GraphNode(id=n["id"], lat=n["lat"], lng=n["lng"])
        for n in data["nodes"]
    ]
    edges: dict[str, list[GraphEdge]] = {
        node_id: [
            GraphEdge(target=e["target"], distance_m=e["distance_m"])
            for e in edge_list
        ]
        for node_id, edge_list in data["edges"].items()
    }
    return RoadGraph(nodes=nodes, edges=edges)


def create_demo_graph() -> RoadGraph:
    nodes = [
        GraphNode("store", 14.5995, 120.9842),
        GraphNode("junction", 14.6002, 120.9848),
        GraphNode("stop_a", 14.6010, 120.9850),
        GraphNode("stop_b", 14.6030, 120.9870),
        GraphNode("stop_c", 14.6050, 120.9890),
    ]

    # Asymmetric directed graph — edge weights differ by direction (one-way roads).
    # Shortest paths (used by tests):
    #   store→stop_a = 900 (via junction: 500+400)
    #   store→stop_b = 1400 (via junction: 500+900)
    #   stop_a→store = 1100 (via junction: 450+650)
    #   stop_b→store = 1600 (via junction: 950+650)
    #   stop_c→store = 2250 (via stop_b→junction: 650+950+650)
    edges = {
        "store": [
            GraphEdge("junction", 500),
            GraphEdge("stop_a", 1200),
            GraphEdge("stop_b", 2200),
        ],
        "junction": [
            GraphEdge("store", 650),
            GraphEdge("stop_a", 400),
            GraphEdge("stop_b", 900),
        ],
        "stop_a": [
            GraphEdge("store", 1500),
            GraphEdge("junction", 450),
            GraphEdge("stop_b", 700),
            GraphEdge("stop_c", 1300),
        ],
        "stop_b": [
            GraphEdge("store", 2100),
            GraphEdge("junction", 950),
            GraphEdge("stop_a", 850),
            GraphEdge("stop_c", 600),
        ],
        "stop_c": [
            GraphEdge("store", 2600),
            GraphEdge("stop_a", 1500),
            GraphEdge("stop_b", 650),
        ],
    }

    return RoadGraph(nodes=nodes, edges=edges)
