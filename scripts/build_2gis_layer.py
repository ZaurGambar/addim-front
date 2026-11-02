"""data-raw/2gis/cells.json -> public/data/twogis_cells.geojson (xəritə səhifəsi üçün).

Toplanmış hər hücrə üçün 2GIS və OSM dəyərləri yan-yana: poi, stops, ən yaxın dayanacaq.
Toplama bitəndən sonra yenidən işə salın: python3 scripts/build_2gis_layer.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "public" / "data"
cells = json.loads((ROOT / "data-raw/2gis/cells.json").read_text())
grid = json.loads((D / "baku_grid.geojson").read_text())["features"]
synth = {f["properties"]["id"]: f["properties"] for f in json.loads((D / "baku_synth.geojson").read_text())["features"]}

feats = []
for f in grid:
    p = f["properties"]
    c = cells.get(str(p["id"]))
    if not c:
        continue
    s = synth.get(p["id"])
    feats.append({
        "type": "Feature",
        "geometry": f["geometry"],
        "properties": {
            "id": p["id"], "rayon": p["rayon"], "pop": p["pop"], "place": s["place"] if s else None,
            "poi": c["poi"], "poi_osm": p["poi"], "stops": c["stops"], "stops_osm": p["stops"],
            "near": c.get("near_stop"), "near_osm": s["transit_m"] if s else None,
        },
    })
out = {"type": "FeatureCollection", "meta": {"source": "2GIS Catalog API", "collected": len(cells), "grid": len(grid), "date": "2026-11-03"}, "features": feats}
(D / "twogis_cells.geojson").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print(len(feats), "hücrə")
