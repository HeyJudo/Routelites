"""
Alternative build script: downloads the Philippines OSM PBF from Geofabrik
(a static file server, not the Overpass API) and extracts the NCR road network
locally using pyrosm. Use this if build_ncr_graph.py fails with timeouts.

Run from the backend/ directory:
    python -m scripts.build_ncr_graph_local

The PBF file (~200 MB) is cached at backend/data/philippines-latest.osm.pbf
and reused on subsequent runs. The final output is identical to build_ncr_graph.py.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

NCR_BBOX_PYROSM = [120.90, 14.35, 121.15, 14.78]  # [west, south, east, north]

OUTPUT_PATH = Path(__file__).parent.parent / "data" / "ncr_graph.json"
PBF_PATH = Path(__file__).parent.parent / "data" / "philippines-latest.osm.pbf"
PBF_URL = "https://download.geofabrik.de/asia/philippines-latest.osm.pbf"


def download_pbf() -> None:
    import requests

    PBF_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading Philippines OSM data from Geofabrik...")
    print(f"  URL: {PBF_URL}")
    print(f"  Saving to: {PBF_PATH}")
    print(f"  (~200 MB — may take several minutes depending on your connection)")

    with requests.get(PBF_URL, stream=True, timeout=600) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        downloaded = 0
        with open(PBF_PATH, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        pct = downloaded / total * 100
                        mb = downloaded / (1024 * 1024)
                        total_mb = total / (1024 * 1024)
                        print(f"\r  {mb:.1f} / {total_mb:.1f} MB ({pct:.0f}%)", end="", flush=True)
    print("\n  Download complete.")


def build() -> None:
    try:
        import pyrosm
    except ImportError:
        print("ERROR: pyrosm is not installed. Run: pip install pyrosm")
        sys.exit(1)

    if not PBF_PATH.exists():
        download_pbf()
    else:
        size_mb = PBF_PATH.stat().st_size / (1024 * 1024)
        print(f"Using cached PBF: {PBF_PATH} ({size_mb:.0f} MB)")

    print("Parsing OSM data for NCR bounding box (this may take 1-2 minutes)...")
    osm = pyrosm.OSM(str(PBF_PATH), bounding_box=NCR_BBOX_PYROSM)

    print("Extracting drivable road network...")
    nodes, edges = osm.get_network(nodes=True, network_type="driving")

    if nodes is None or edges is None or len(nodes) == 0:
        print("ERROR: No road network found in the NCR bounding box.")
        sys.exit(1)

    print(f"  Raw: {len(nodes)} nodes, {len(edges)} edges")

    # Build node list — pyrosm nodes are indexed by OSM node ID
    nodes_list: list[dict] = []
    node_id_map: dict = {}

    for osm_id, row in nodes.iterrows():
        str_id = str(osm_id)
        node_id_map[osm_id] = str_id
        nodes_list.append({
            "id": str_id,
            "lat": round(float(row.geometry.y), 7),
            "lng": round(float(row.geometry.x), 7),
        })

    edges_dict: dict[str, list[dict]] = {n["id"]: [] for n in nodes_list}

    for _, row in edges.iterrows():
        src = node_id_map.get(row["u"])
        tgt = node_id_map.get(row["v"])
        if src is None or tgt is None:
            continue
        length_m = row.get("length") or 0
        if src in edges_dict:
            edges_dict[src].append({
                "target": tgt,
                "distance_m": max(1, round(float(length_m))),
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
