"""Piyada şəbəkəsi ilə ictimai məkan əlçatanlığı (düz xətt əvəzinə real yol məsafəsi).

Şəbəkə: OSM yolları (motorway xaric: piyada üçün qadağandır), qovşaqlar koordinata görə birləşdirilir.
Mənbələr: ≥ 0.25 ha ictimai açıq məkanın içində və ya kənarından 30 m-ə qədər olan şəbəkə qovşaqları.
Hər yaşayış blokunun mərkəzi ən yaxın qovşağa bağlanır (≤ 250 m); məsafə = bağlanma + şəbəkə yolu.
Çoxmənbəli Dijkstra, kəsim 1 200 m.

Göstəricilər (rayon və şəhər):
  ps_400_net_pct  əhalinin ictimai məkana 400 m (≈ 5 dəq) piyada yolu ilə çatan payı, %
  ps_800_net_pct  800 m (≈ 10 dəq) üçün eyni
  ps_detour       şəbəkə məsafəsi / düz xətt (orta dolama əmsalı)

Giriş:  data-raw/osm/walk_ways.json.gz, public/data/public_spaces.geojson, zoning_blocks.geojson
Çıxış:  baku_analysis.json, baku_rayons.geojson (ps_*_net_*), city.ps.net

  python3 scripts/walk_network.py
"""
import gzip
import json
import math
from collections import defaultdict
from pathlib import Path

import networkx as nx
from shapely.affinity import scale
from shapely.geometry import MultiPoint, Point, shape
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw" / "osm"
DATA = ROOT / "public" / "data"
KX, KY = 111_320 * math.cos(math.radians(40.4)), 111_320
CUTOFF = 1200
SNAP = 250


def xy(lon, lat):
    return (lon * KX, lat * KY)


# ---- Qraf ----
G = nx.Graph()
for way in json.load(gzip.open(RAW / "walk_ways.json.gz", "rt")):
    pts = [tuple(p) for p in way]
    for a, b in zip(pts, pts[1:]):
        if a == b:
            continue
        (ax, ay), (bx, by) = xy(*a), xy(*b)
        G.add_edge(a, b, w=math.hypot(bx - ax, by - ay))
# Ən böyük bağlı komponent (ada və təcrid olunmuş həyət yolları xaric)
comp = max(nx.connected_components(G), key=len)
G = G.subgraph(comp).copy()
nodes = list(G.nodes)
node_pts = [Point(xy(*n)) for n in nodes]
tree = STRtree(node_pts)
print("qovşaq:", len(nodes), "kənar:", G.number_of_edges())

# ---- Mənbələr: ictimai məkanların içindəki və yanındakı qovşaqlar ----
sources = set()
for f in json.load(open(DATA / "public_spaces.geojson"))["features"]:
    if f["properties"]["ha"] < 0.25:
        continue
    g = scale(shape(f["geometry"]), xfact=KX, yfact=KY, origin=(0, 0)).buffer(30)
    for i in tree.query(g):
        if g.contains(node_pts[i]):
            sources.add(nodes[i])
print("mənbə qovşaq:", len(sources))
dist = nx.multi_source_dijkstra_path_length(G, sources, cutoff=CUTOFF, weight="w")

# ---- Bloklar ----
ps_cover = []
for f in json.load(open(DATA / "public_spaces.geojson"))["features"]:
    if f["properties"]["ha"] >= 0.25:
        ps_cover.append(scale(shape(f["geometry"]), xfact=KX, yfact=KY, origin=(0, 0)))
ps_tree = STRtree(ps_cover)

agg = defaultdict(lambda: {"pop": 0.0, "p400": 0.0, "p800": 0.0, "det_n": 0, "det_sum": 0.0, "snapped": 0.0})
for f in json.load(open(DATA / "zoning_blocks.geojson"))["features"]:
    p = f["properties"]
    c = scale(shape(f["geometry"]).centroid, xfact=KX, yfact=KY, origin=(0, 0))
    a = agg[p["rayon"]]
    a["pop"] += p["pop"]
    i = tree.nearest(c)
    snap = c.distance(node_pts[i])
    if snap > SNAP:
        continue
    a["snapped"] += p["pop"]
    d = dist.get(nodes[i])
    if d is None:
        continue
    d += snap
    if d <= 400:
        a["p400"] += p["pop"]
    if d <= 800:
        a["p800"] += p["pop"]
    j = ps_tree.nearest(c)
    straight = c.distance(ps_cover[j])
    if straight > 50:
        a["det_n"] += 1
        a["det_sum"] += d / straight

analysis = json.load(open(DATA / "baku_analysis.json"))
rayons = json.load(open(DATA / "baku_rayons.geojson"))
by = {r["rayon"]: r for r in analysis["rayons"]}
tot = defaultdict(float)
for name, a in agg.items():
    if name not in by:
        continue
    v = {
        "ps_400_net_pct": round(100 * a["p400"] / a["pop"], 1) if a["pop"] else None,
        "ps_800_net_pct": round(100 * a["p800"] / a["pop"], 1) if a["pop"] else None,
        "ps_detour": round(a["det_sum"] / a["det_n"], 2) if a["det_n"] else None,
    }
    by[name].update(v)
    for k in ("pop", "p400", "p800", "det_sum", "det_n", "snapped"):
        tot[k] += a[k]
for f in rayons["features"]:
    f["properties"].update({k: by[f["properties"]["rayon"]].get(k) for k in ("ps_400_net_pct", "ps_800_net_pct", "ps_detour")})
analysis["city"]["ps"]["net"] = {
    "pct_400": round(100 * tot["p400"] / tot["pop"], 1),
    "pct_800": round(100 * tot["p800"] / tot["pop"], 1),
    "detour": round(tot["det_sum"] / tot["det_n"], 2),
    "snapped_pct": round(100 * tot["snapped"] / tot["pop"], 1),
    "nodes": len(nodes),
    "method": "OSM piyada şəbəkəsi (motorway xaric), çoxmənbəli Dijkstra; ≥ 0.25 ha məkan",
}
json.dump(analysis, open(DATA / "baku_analysis.json", "w"), ensure_ascii=False, indent=1)
json.dump(rayons, open(DATA / "baku_rayons.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
print(json.dumps(analysis["city"]["ps"]["net"], ensure_ascii=False))
for r in sorted(analysis["rayons"], key=lambda x: x.get("ps_400_net_pct") or 0):
    print(f'{r["rayon"]:10s} düz xətt {r["ps_400_pct"]:5}%  şəbəkə 400 m {r["ps_400_net_pct"]:5}%  800 m {r["ps_800_net_pct"]:5}%  dolama {r["ps_detour"]}')
