"""
Alternative build script: loads NCR road network from a locally downloaded
.osm XML file instead of fetching from the Overpass API.

Use this when build_ncr_graph.py fails with network timeouts.

Step 1 — Get the .osm file (do this in your browser):
    1. Open https://overpass-turbo.eu/
    2. Paste the query below into the editor and click Run:

        [out:xml][timeout:300][bbox:14.35,120.90,14.78,121.15];
        (
          way["highway"]["highway"!~"footway|cycleway|path|pedestrian|steps|track|service"];
        );
        out body;
        >;
        out skel qt;

    3. Click Export → Download as OSM  (saves ncr_roads.osm or map.osm)
    4. Move the file to: backend/data/ncr_roads.osm

Step 2 — Run this script from the backend/ directory:
    python -m scripts.build_ncr_graph_from_file

Output is identical to build_ncr_graph.py: backend/data/ncr_graph.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

OSM_FILE = Path(__file__).parent.parent / "data" / "ncr_roads.osm"
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "ncr_graph.json"


def build() -> None:
    try:
        import osmnx as ox
    except ImportError:
        print("ERROR: osmnx is not installed. Run: pip install osmnx")
        sys.exit(1)

    if not OSM_FILE.exists():
        print(f"ERROR: OSM file not found at {OSM_FILE}")
        print()
        print("Download it from your browser:")
        print("  1. Open https://overpass-turbo.eu/")
        print("  2. Paste this query and click Run:")
        print()
        print("     [out:xml][timeout:300][bbox:14.35,120.90,14.78,121.15];")
        print("     (")
        print('       way["highway"]["highway"!~"footway|cycleway|path|pedestrian|steps|track|service"];')
        print("     );")
        print("     out body;")
        print("     >;")
        print("     out skel qt;")
        print()
        print("  3. Export → Download as OSM")
        print(f"  4. Save to: {OSM_FILE}")
        sys.exit(1)

    size_mb = OSM_FILE.stat().st_size / (1024 * 1024)
    print(f"Loading OSM file: {OSM_FILE} ({size_mb:.1f} MB)")

    G = ox.graph_from_xml(str(OSM_FILE), simplify=True, retain_all=False)

    print(f"  Raw graph: {len(G.nodes)} nodes, {len(G.edges)} edges")
    print("Projecting to UTM for accurate meter distances...")

    G_proj = ox.project_graph(G)

    print("Building adjacency-list export...")

    nodes_list: list[dict] = []
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
