"""Sahil və bulvar əlçatanlığı: Bakı dənizə nə qədər açıqdır?

Göstəricilər:
  coast_km          Bakı rayonlarının quru sahil xətti (adalar daxil), km
  promenade_km      sahildən 100 m zolaqda piyada yolları (footway, pedestrian, path, steps), km
  longest_km        ən uzun fasiləsiz promenad (birləşən piyada yolları), km
  public_share_pct  sahil xəttinin ictimai açıq məkan (park, çimərlik) 100 m-dən yaxın olan payı, %
  pop_10min_pct     əhalinin sahilə 10 dəqiqəlik (800 m) piyada yolu ilə çatan payı, % (rayon və şəhər)
  pop_800_straight_pct  müqayisə: sahilə düz xəttlə 800 m-də yaşayan əhali, %
  bulvar_cross_m    mərkəzdə (Səbail–Xətai, Bayıl–Ağ şəhər) sahilə paralel magistraldan sahilə
                    yerüstü keçidlər arası orta məsafə, m

Giriş:  data-raw/osm/coastline.json, coast_ped_ways.json, walk_ways.json.gz, rayons_land.geojson,
        public/data/public_spaces.geojson, zoning_blocks.geojson, crossings.geojson
Çıxış:  baku_analysis.json (city.coast, rayonlara coast_10min_pct), baku_rayons.geojson

  python3 scripts/coast_access.py
"""
import gzip
import json
import math
from collections import defaultdict
from pathlib import Path

import networkx as nx
from shapely.affinity import scale
from shapely.geometry import LineString, Point, shape
from shapely.ops import linemerge, unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw" / "osm"
DATA = ROOT / "public" / "data"
KX, KY = 111_320 * math.cos(math.radians(40.4)), 111_320
CENTRAL_COAST = (49.80, 40.335, 49.90, 40.385)  # Bayıl – Ağ şəhər arası mərkəzi sahil


def m(g):
    return scale(g, xfact=KX, yfact=KY, origin=(0, 0))


land = unary_union([shape(f["geometry"]) for f in json.load(open(RAW / "rayons_land.geojson"))["features"]])
land_m = m(land)
coast = m(unary_union([LineString(c) for c in json.load(open(RAW / "coastline.json"))]))
coast = coast.intersection(land_m.buffer(30))
coast_km = coast.length / 1000

# Promenad
zone = coast.buffer(100)
ped = [m(LineString(w["c"])) for w in json.load(open(RAW / "coast_ped_ways.json"))]
ped_in = [p.intersection(zone) for p in ped if p.intersects(zone)]
ped_in = [p for p in ped_in if not p.is_empty]
promenade_km = sum(p.length for p in ped_in) / 1000
merged = linemerge(unary_union(ped_in))
parts = list(getattr(merged, "geoms", [merged]))
longest_km = max((p.length for p in parts), default=0) / 1000

# Sahilin ictimai məkanla örtülən payı
ps = unary_union([m(shape(f["geometry"])).buffer(0) for f in json.load(open(DATA / "public_spaces.geojson"))["features"]])
public_share = 100 * coast.intersection(ps.buffer(100)).length / coast.length

# Əhalinin sahilə 10 dəqiqəlik çatımlılığı (piyada şəbəkəsi)
G = nx.Graph()
for way in json.load(gzip.open(RAW / "walk_ways.json.gz", "rt")):
    pts = [tuple(p) for p in way]
    for a, b in zip(pts, pts[1:]):
        if a != b:
            G.add_edge(a, b, w=math.hypot((b[0] - a[0]) * KX, (b[1] - a[1]) * KY))
G = G.subgraph(max(nx.connected_components(G), key=len)).copy()
nodes = list(G.nodes)
npts = [Point(n[0] * KX, n[1] * KY) for n in nodes]
tree = STRtree(npts)
cz = coast.buffer(60)
sources = {nodes[i] for i in tree.query(cz) if cz.contains(npts[i])}
dist = nx.multi_source_dijkstra_path_length(G, sources, cutoff=1000, weight="w")
agg = defaultdict(lambda: [0.0, 0.0])
straight = defaultdict(float)
for f in json.load(open(DATA / "zoning_blocks.geojson"))["features"]:
    p = f["properties"]
    c = m(shape(f["geometry"]).centroid)
    i = tree.nearest(c)
    snap = c.distance(npts[i])
    agg[p["rayon"]][0] += p["pop"]
    if c.distance(coast) <= 800:
        straight[p["rayon"]] += p["pop"]
    d = dist.get(nodes[i])
    if snap <= 250 and d is not None and d + snap <= 800:
        agg[p["rayon"]][1] += p["pop"]

# Mərkəzi sahildə bulvara yerüstü keçidlər
x0, y0, x1, y1 = CENTRAL_COAST
from shapely.geometry import box

cbox = m(box(x0, y0, x1, y1))
ccoast = coast.intersection(cbox)
band = ccoast.buffer(400).difference(ccoast.buffer(40))  # sahildən 40–400 m: bulvarla şəhər arasındakı magistral zolağı
cross = [m(Point(f["geometry"]["coordinates"])) for f in json.load(open(DATA / "crossings.geojson"))["features"]]
n_cross = sum(1 for c in cross if band.contains(c))
bulvar_spacing = round(ccoast.length / max(1, n_cross))

analysis = json.load(open(DATA / "baku_analysis.json"))
rayons = json.load(open(DATA / "baku_rayons.geojson"))
by = {r["rayon"]: r for r in analysis["rayons"]}
tp, tc = 0.0, 0.0
for name, (pop, near) in agg.items():
    if name in by:
        by[name]["coast_10min_pct"] = round(100 * near / pop, 1) if pop else None
        by[name]["coast_800_straight_pct"] = round(100 * straight[name] / pop, 1) if pop else None
        tp += pop
        tc += near
for f in rayons["features"]:
    f["properties"]["coast_10min_pct"] = by[f["properties"]["rayon"]].get("coast_10min_pct")
analysis["city"]["coast"] = {
    "coast_km": round(coast_km, 1),
    "promenade_km": round(promenade_km, 1),
    "promenade_share_pct": round(100 * promenade_km / coast_km, 1),
    "longest_km": round(longest_km, 1),
    "public_share_pct": round(public_share, 1),
    "pop_10min_pct": round(100 * tc / tp, 1),
    "pop_800_straight_pct": round(100 * sum(straight.values()) / tp, 1),
    "central_coast_km": round(ccoast.length / 1000, 1),
    "bulvar_crossings": n_cross,
    "bulvar_cross_m": bulvar_spacing,
    "method": "OSM sahil xətti və piyada yolları; 800 m piyada şəbəkəsi; keçidlər: sahildən 40–400 m zolaqda yerüstü keçid nöqtələri (mərkəzi sahil)",
}
json.dump(analysis, open(DATA / "baku_analysis.json", "w"), ensure_ascii=False, indent=1)
json.dump(rayons, open(DATA / "baku_rayons.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
print(json.dumps(analysis["city"]["coast"], ensure_ascii=False))
for r in sorted(analysis["rayons"], key=lambda x: -(x.get("coast_10min_pct") or 0)):
    print(f'{r["rayon"]:10s} {r.get("coast_10min_pct")}%')
