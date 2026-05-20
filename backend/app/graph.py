from dataclasses import dataclass
from math import hypot


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
        nearest = min(
            self.nodes.values(),
            key=lambda node: hypot(node.lat - lat, node.lng - lng),
        )
        return nearest.id


def create_demo_graph() -> RoadGraph:
    nodes = [
        GraphNode("store", 14.5995, 120.9842),
        GraphNode("junction", 14.6002, 120.9848),
        GraphNode("stop_a", 14.6010, 120.9850),
        GraphNode("stop_b", 14.6030, 120.9870),
        GraphNode("stop_c", 14.6050, 120.9890),
    ]

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
            GraphEdge("stop_c", 1800),
        ],
        "stop_b": [
            GraphEdge("store", 2100),
            GraphEdge("junction", 950),
            GraphEdge("stop_a", 850),
            GraphEdge("stop_c", 600),
        ],
        "stop_c": [
            GraphEdge("store", 2600),
            GraphEdge("stop_a", 1700),
            GraphEdge("stop_b", 650),
        ],
    }

    return RoadGraph(nodes=nodes, edges=edges)
