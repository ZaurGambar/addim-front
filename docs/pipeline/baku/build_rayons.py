"""OSM relation geometriyasından Bakının 12 rayonunun quru ərazisi poliqonlarını qurur.

OSM rayon sərhədləri Xəzərin dəniz sahəsini də əhatə edir, ona görə sahil xəttindən
quru poliqonu qurulur və rayonlar onunla kəsilir.

Giriş: rayons_geom.json (relation out geom), coast_baku.json (natural=coastline out geom)
Çıxış: ../geojson/rayons.geojson
"""
import json
import math
import os

from shapely.geometry import LineString, MultiPolygon, Point, Polygon, box, mapping
from shapely.ops import linemerge, polygonize, split, unary_union

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "geojson", "rayons.geojson")
BB = box(49.2, 39.85, 50.75, 40.8)
# Quru olduğu bilinən nöqtələr (sahil xətti bbox-u parçalayanda quru hissəni seçmək üçün)
LAND_PTS = [Point(49.8366, 40.3717), Point(49.45, 40.2), Point(50.1, 40.48), Point(49.6, 40.55), Point(50.3, 40.45)]


def lines(el):
    return [(p["lon"], p["lat"]) for p in el["geometry"]]


# --- Quru poliqonu ---
coast = [LineString(lines(e)) for e in json.load(open(os.path.join(HERE, "coast_baku.json"), encoding="utf-8"))["elements"] if len(e["geometry"]) > 1]
merged = linemerge(coast)
merged = list(merged.geoms) if hasattr(merged, "geoms") else [merged]
islands = [Polygon(l.coords) for l in merged if l.is_ring and len(l.coords) > 3]
open_lines = [l for l in merged if not l.is_ring]
pieces = [BB]
for l in open_lines:
    nxt = []
    for p in pieces:
        nxt += list(split(p, l).geoms) if p.intersects(l) else [p]
    pieces = nxt
# Dəniz parçaları: Xəzərdə olduğu bilinən nöqtələri ehtiva edən parçalar
SEA_PTS = [Point(49.95, 40.30), Point(50.3, 40.25), Point(50.6, 40.5), Point(49.7, 40.1), Point(49.9, 40.72), Point(50.5, 40.7)]
sea = [p for p in pieces if any(p.contains(q) for q in SEA_PTS)]
mainland = [p for p in pieces if p not in sea]
land = unary_union(mainland + islands)
print("parça:", len(pieces), "dəniz:", len(sea), "quru:", len(mainland), "ada:", len(islands), "açıq xətt:", len(open_lines))


def area_km2(g):
    c = g.centroid
    kx, ky = 111.32 * math.cos(math.radians(c.y)), 111.32
    from shapely.affinity import scale
    return scale(g, xfact=kx, yfact=ky, origin=(0, 0)).area


feats = []
for rel in json.load(open(os.path.join(HERE, "rayons_geom.json"), encoding="utf-8"))["elements"]:
    if rel["id"] == 2415335:
        continue  # şəhər sərhədi rayonların birləşməsi kimi alınır
    name = rel["tags"]["name"].replace(" rayonu", "")
    segs = [LineString([(p["lon"], p["lat"]) for p in m["geometry"]]) for m in rel["members"] if m["type"] == "way" and m.get("geometry") and len(m["geometry"]) > 1]
    polys = list(polygonize(unary_union(segs)))
    if not polys:
        print("!! poliqon yoxdur:", name)
        continue
    raw = unary_union(polys)
    geom = raw.intersection(land)
    if geom.is_empty:
        print("!! quru hissə yoxdur:", name)
        continue
    if geom.geom_type == "Polygon":
        geom = MultiPolygon([geom])
    elif geom.geom_type == "GeometryCollection":
        geom = MultiPolygon([g for g in geom.geoms if g.geom_type == "Polygon"])
    geom = geom.simplify(0.0003, preserve_topology=True)
    a = area_km2(geom)
    feats.append({"type": "Feature", "geometry": mapping(geom),
                  "properties": {"rayon": name, "osm_id": rel["id"], "area_km2": round(a, 1),
                                 "raw_area_km2": round(area_km2(raw), 1)}})
    print(f"{name:12s} quru {a:8.1f} km²   (sərhəd {area_km2(raw):8.1f} km²)")

with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": feats}, f, ensure_ascii=False, separators=(",", ":"))
print("cəmi quru:", round(sum(f["properties"]["area_km2"] for f in feats), 1), "km²")
