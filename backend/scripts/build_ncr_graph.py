"""
One-time preprocessing script: downloads the NCR (Metro Manila) drivable road
network from OpenStreetMap via osmnx and saves a compact adjacency-list JSON
to backend/data/ncr_graph.json.

Run from the backend/ directory:
    python -m scripts.build_ncr_graph

The output file is loaded by the backend at startup (see app/main.py).
It is large (~50-100 MB) and should not be committed to git — add it to
.gitignore and distribute separately (e.g. bundled with the Railway deploy or
downloaded on first run).
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# NCR (Metro Manila) bounding box — north, south, east, west
NCR_BBOX = (14.78, 14.35, 121.15, 120.90)

OUTPUT_PATH = Path(__file__).parent.parent / "data" / "ncr_graph.json"


def build() -> None:
    try:
        import osmnx as ox
    except ImportError:
        print("ERROR: osmnx is not installed. Run: pip install osmnx")
        sys.exit(1)

    # Public Overpass API mirrors — tried in order until one succeeds
    OVERPASS_ENDPOINTS = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    ]

    print("Downloading NCR drivable road network from OpenStreetMap...")
    print(f"  Bounding box: N={NCR_BBOX[0]} S={NCR_BBOX[1]} E={NCR_BBOX[2]} W={NCR_BBOX[3]}")

    G = None
    last_error: Exception | None = None
    for endpoint in OVERPASS_ENDPOINTS:
        try:
            print(f"  Trying endpoint: {endpoint}")
            ox.settings.overpass_endpoint = endpoint
            G = ox.graph_from_bbox(
                bbox=NCR_BBOX,
                network_type="drive",
                simplify=True,
                retain_all=False,
            )
            print(f"  Connected via {endpoint}")
            break
        except Exception as e:
            print(f"  Failed ({type(e).__name__}): {e}")
            last_error = e

    if G is None:
        print("\nERROR: All Overpass API endpoints failed. Check your internet connection or try again later.")
        if last_error:
            raise last_error
        sys.exit(1)

    print(f"  Raw graph: {len(G.nodes)} nodes, {len(G.edges)} edges")
    print("Projecting to UTM for accurate meter distances...")

    G_proj = ox.project_graph(G)

    print("Building adjacency-list export...")

    nodes_list: list[dict] = []
    # Map OSM node ID (int) -> string ID used in our graph
    node_id_map: dict[int, str] = {}

    G_unprojected = ox.project_graph(G_proj, to_crs="EPSG:4326")

    for osm_id, data in G_unprojected.nodes(data=True):
        str_id = str(osm_id)
        node_id_map[osm_id] = str_id
        nodes_list.append({
            "id": str_id,
            "lat": round(data["y"], 7),
            "lng": round(data["x"], 7),
        })

    edges_dict: dict[str, list[dict]] = {n["id"]: [] for n in nodes_list}

    for u, v, data in G_proj.edges(data=True):
        src = node_id_map.get(u)
        tgt = node_id_map.get(v)
        if src is None or tgt is None:
            continue
        length_m = data.get("length", 0)
        edges_dict[src].append({
            "target": tgt,
            "distance_m": max(1, round(length_m)),
        })

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    print(f"Writing to {OUTPUT_PATH} ...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"nodes": nodes_list, "edges": edges_dict}, f, separators=(",", ":"))

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"\nDone.")
    print(f"  Nodes: {len(nodes_list)}")
    print(f"  Edges: {sum(len(v) for v in edges_dict.values())}")
    print(f"  File:  {OUTPUT_PATH} ({size_mb:.1f} MB)")
    print("\nNext step: start the backend — it will auto-load this graph.")


if __name__ == "__main__":
    build()
