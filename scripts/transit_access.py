"""Dayanacağa 5 dəqiqə: periferiya sakinləri üçün yeni avtobus dayanacaqlarının optimal yeri.

1) Mövcud vəziyyət: hər yaşayış blokundan ən yaxın dayanacağa (BakuBus opendata + OSM + metro
   stansiyası/çıxışı) real piyada yolu məsafəsi (OSM piyada şəbəkəsi, çoxmənbəli Dijkstra).
2) Optimallaşdırma — Maksimal Əhatə Yerləşdirmə Problemi (MCLP, Church & ReVelle 1974):
   namizədlər mövcud avtobus marşrutlarının üzərindədir (yeni marşrut tələb etmir), hər 150 m-də bir.
   Acgöz alqoritm hər addımda 400 m-dən (≈ 5 dəq) uzaqda yaşayan ən çox insanı 5 dəqiqəlik məsafəyə
   gətirən nöqtəni seçir; submodulyar funksiya üçün nəticə optimalın ən azı (1 − 1/e) ≈ 63%-idir.
   Ssenarilər: "inc" (inklüziv: "all" + zonanın sosial zəiflik indeksi ilə çəki), "all" (5 dəq-dən uzaq hər kəs) və "far" (yalnız 10 dəq-dən çox yeriyənlər, periferiya fokusu).
   Qənaət: gündə gediş-dönüş üzrə (köhnə məsafə − 400 m) / 80 m/dəq × 2, konservativ.
3) Marşrutdan da uzaq qalan məhəllələr: yeni marşrut və ya mikroavtobus (feeder) lazım olan zonalar.

Fərziyyələr: piyada sürəti 80 m/dəq (5 dəq ≈ 400 m, 10 dəq ≈ 800 m); avtobus marşrutun istənilən nöqtəsində
dayana bilər; blok əhalisi DSK 2024-ə kalibrlənmiş WorldPop-dur (zoning_blocks); dayanacaq datası 2026.

Giriş:  data-raw/osm/walk_ways.json.gz, data-raw/opendata/bakubus_stops.csv, bus_routes.json.gz,
        data-raw/osm/bus_stops_osm.json, rayons_land.geojson, public/data/metro.geojson,
        od_metro_exits.geojson, zoning_blocks.geojson, zoning.json
Çıxış:  public/data/transit_access.json, transit_blocks.json, transit_stops.geojson

  python3 scripts/transit_access.py
"""
import csv
import gzip
import json
import math
from collections import defaultdict
from pathlib import Path

import networkx as nx
from shapely.geometry import LineString, Point, shape
from shapely.prepared import prep
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw"
DATA = ROOT / "public" / "data"
KX, KY = 111_320 * math.cos(math.radians(40.4)), 111_320
WALK5, WALK10, CUT = 400, 800, 3000
SNAP_BLOCK, SNAP_STOP, SNAP_CAND = 250, 100, 40
CAND_STEP = 150
K_MAX = 150
STOP_COST = 15000  # ₼, örtüklü dayanacaq (ekspert təxmini, Bölgələmə kalkulyatoru ilə eyni)


def xy(lon, lat):
    return (lon * KX, lat * KY)


# ---------- Piyada şəbəkəsi ----------
G = nx.Graph()
for way in json.load(gzip.open(RAW / "osm" / "walk_ways.json.gz", "rt")):
    pts = [tuple(p) for p in way]
    for a, b in zip(pts, pts[1:]):
        if a != b:
            (ax, ay), (bx, by) = xy(*a), xy(*b)
            G.add_edge(a, b, w=math.hypot(bx - ax, by - ay))
G = G.subgraph(max(nx.connected_components(G), key=len)).copy()
nodes = list(G.nodes)
npts = [Point(xy(*n)) for n in nodes]
tree = STRtree(npts)
print("qovşaq:", len(nodes))


def snap(lon, lat, limit):
    p = Point(xy(lon, lat))
    i = tree.nearest(p)
    d = p.distance(npts[i])
    return (nodes[i], d) if d <= limit else (None, d)


# ---------- Mövcud dayanacaqlar ----------
stops = []
for r in list(csv.reader(open(RAW / "opendata" / "bakubus_stops.csv", encoding="utf-8-sig")))[1:]:
    try:
        stops.append((float(r[3]), float(r[4]), "BakuBus"))
    except (ValueError, IndexError):
        pass
stops += [(s["lon"], s["lat"], "OSM") for s in json.load(open(RAW / "osm" / "bus_stops_osm.json"))]
stops += [(*f["geometry"]["coordinates"], "Metro") for f in json.load(open(DATA / "metro.geojson"))["features"] if f["properties"]["status"] == "işləyir"]
stops += [(*f["geometry"]["coordinates"], "Metro") for f in json.load(open(DATA / "od_metro_exits.geojson"))["features"]]
src = set()
for lon, lat, _ in stops:
    n, _ = snap(lon, lat, SNAP_STOP)
    if n:
        src.add(n)
print("dayanacaq:", len(stops), "şəbəkəyə bağlanan qovşaq:", len(src))
dist = nx.multi_source_dijkstra_path_length(G, src, cutoff=CUT, weight="w")

# ---------- Bloklar ----------
zoning = json.load(open(DATA / "zoning.json"))
zone_name = {z["rank"]: (z["name"], z["rayon"]) for z in zoning["zones"]}
blocks = []
for f in json.load(open(DATA / "zoning_blocks.geojson"))["features"]:
    p = f["properties"]
    c = shape(f["geometry"]).centroid
    n, s = snap(c.x, c.y, SNAP_BLOCK)
    walk = (dist.get(n, CUT) + s) if n else CUT + s
    blocks.append({"bid": p["bid"], "pop": p["pop"], "rayon": p["rayon"], "lst": p.get("lst"), "zone": p.get("zone_rank"),
                   "node": n, "snap": s, "walk": min(walk, CUT + 500), "lon": c.x, "lat": c.y})
pop_total = sum(b["pop"] for b in blocks)
under = [b for b in blocks if b["walk"] > WALK5]
under_pop = sum(b["pop"] for b in under)
print("əhali:", pop_total, "5 dəq-dən uzaq:", round(under_pop), round(100 * under_pop / pop_total, 1), "%")

# Qovşaq → (blok indeksi) xəritəsi (yalnız 5 dəqiqədən uzaq bloklar)
node_blocks = defaultdict(list)
for i, b in enumerate(blocks):
    if b["walk"] > WALK5 and b["node"] is not None and b["snap"] < WALK5:
        node_blocks[b["node"]].append(i)

# ---------- Namizədlər: mövcud marşrutlar üzrə hər 150 m ----------
routes = json.load(gzip.open(RAW / "opendata" / "bus_routes.json.gz", "rt"))
cand_routes = defaultdict(set)
for r in routes:
    for line in r["lines"]:
        ls = LineString([xy(*p) for p in line])
        n_steps = max(1, int(ls.length // CAND_STEP))
        for k in range(n_steps + 1):
            p = ls.interpolate(min(ls.length, k * CAND_STEP))
            i = tree.nearest(p)
            if p.distance(npts[i]) <= SNAP_CAND:
                node = nodes[i]
                if dist.get(node, CUT) >= 300:  # mövcud dayanacağa artıq yaxın deyil
                    cand_routes[node].add(r["route"])
print("namizəd qovşaq:", len(cand_routes))

cover = {}
for node in cand_routes:
    reach = nx.single_source_dijkstra_path_length(G, node, cutoff=WALK5, weight="w")
    cov = set()
    for n, d in reach.items():
        for bi in node_blocks.get(n, ()):
            if d + blocks[bi]["snap"] <= WALK5:
                cov.add(bi)
    if cov:
        cover[node] = cov
print("faydalı namizəd:", len(cover))

# ---------- Acgöz MCLP (iki ssenari) ----------
# "all": 5 dəqiqədən uzaq hər kəs; "far": yalnız 10 dəqiqədən çox yeriyənlər (periferiya fokusu)
cover_all = cover

# İnklüziv ssenari: zonanın sosial zəiflik indeksi (planning_lens.py) ilə çəkili; əvvəlcə planning_lens.py işlədilməlidir
svi = {}
lens_path = DATA / "planning_lens.json"
if lens_path.exists():
    svi = {z["rank"]: z["svi"] for z in json.load(open(lens_path))["zones"]}
w_inc = lambda i: 1 + svi.get(blocks[i]["zone"], 0) / 100  # noqa: E731


def greedy(eligible, weight=None):
    """weight: blok indeksi → çəki (inklüziv ssenari: 1 + SVI/100). Seçim çəkili, hesabat real insanla."""
    wt = weight or (lambda i: 1.0)
    pool = {n: c & eligible for n, c in cover_all.items()}
    pool = {n: c for n, c in pool.items() if c}
    covered, chosen, curve, saved = set(), [], [0], [0]
    for k in range(K_MAX):
        best, gain = None, 0
        for node, cov in pool.items():
            g = sum(blocks[i]["pop"] * wt(i) for i in cov - covered)
            if g > gain:
                best, gain = node, g
        if not best or gain < 50:
            break
        new = pool.pop(best) - covered
        gain = sum(blocks[i]["pop"] for i in new)
        covered |= new
        top = max(new, key=lambda i: blocks[i]["pop"])
        zn, _ = zone_name.get(blocks[top]["zone"], ("", blocks[top]["rayon"]))
        before = sum(blocks[i]["walk"] * blocks[i]["pop"] for i in new) / max(1, sum(blocks[i]["pop"] for i in new))
        # gündəlik qənaət: gediş-dönüş, yeni məsafə ≤ 400 m (konservativ: 400 m götürülür)
        mins = sum(blocks[i]["pop"] * max(0, blocks[i]["walk"] - WALK5) / 80 * 2 for i in new)
        chosen.append({
            "k": k + 1, "lon": round(best[0], 5), "lat": round(best[1], 5), "gain": round(gain),
            "routes": sorted(cand_routes[best], key=lambda s: (len(s), s))[:6], "rayon": blocks[top]["rayon"], "zone": zn,
            "cover": sorted(blocks[i]["bid"] for i in new), "walk_before_m": round(before), "min_saved_day": round(mins),
            "hi_svi": round(sum(blocks[i]["pop"] for i in new if svi.get(blocks[i]["zone"], 0) >= 60)),
        })
        curve.append(curve[-1] + round(gain))
        saved.append(saved[-1] + round(mins))
    return chosen, curve, saved, covered


elig_all = {i for i, b in enumerate(blocks) if b["walk"] > WALK5}
elig_far = {i for i, b in enumerate(blocks) if b["walk"] > WALK10}
scen = {}
runs = [("all", elig_all, None), ("far", elig_far, None)] + ([("inc", elig_all, w_inc)] if svi else [])
for key, el, wf in runs:
    ch, cv, sv, cov = greedy(el, wf)
    hi = sum(blocks[i]["pop"] for i in cov if svi.get(blocks[i]["zone"], 0) >= 60)
    tot = sum(blocks[i]["pop"] for i in cov)
    scen[key] = {"proposals": ch, "curve": cv, "saved": sv, "hi_svi_pct": round(100 * hi / tot, 1) if tot and svi else None}
    print(key, "seçilən:", len(ch), "əhatə:", cv[-1], "dəqiqə/gün:", sv[-1])
# "all" ssenarisinin bütün dayanacaqlarından sonra da 10 dəqiqədən uzaq qalan bloklar
covered_bids = {x for c in scen["all"]["proposals"] for x in c["cover"]}
covered = {i for i, b in enumerate(blocks) if b["bid"] in covered_bids}

# ---------- Marşrutdan da uzaq qalanlar: yeni marşrut / feeder ----------
left = [b for i, b in enumerate(blocks) if b["walk"] > WALK10 and i not in covered]
zagg = defaultdict(lambda: {"pop": 0.0, "walk": 0.0, "rayon": ""})
for b in left:
    a = zagg[b["zone"]]
    a["pop"] += b["pop"]
    a["walk"] += b["walk"] * b["pop"]
    a["rayon"] = b["rayon"]
new_route = sorted(
    [{"zone": zone_name.get(z, ("", a["rayon"]))[0], "rayon": a["rayon"], "pop": round(a["pop"]), "walk_m": round(a["walk"] / a["pop"])} for z, a in zagg.items() if a["pop"] >= 300],
    key=lambda x: -x["pop"],
)

# ---------- Rayonlar ----------
ray = defaultdict(lambda: {"pop": 0.0, "p5": 0.0, "p10": 0.0, "under": 0.0})
for b in blocks:
    r = ray[b["rayon"]]
    r["pop"] += b["pop"]
    r["p5"] += b["pop"] * (b["walk"] <= WALK5)
    r["p10"] += b["pop"] * (b["walk"] <= WALK10)
    r["under"] += b["pop"] * (b["walk"] > WALK5)
by_rayon = sorted([{"rayon": k, "pop": round(v["pop"]), "pct_5min": round(100 * v["p5"] / v["pop"], 1), "pct_10min": round(100 * v["p10"] / v["pop"], 1), "under_pop": round(v["under"])} for k, v in ray.items()], key=lambda x: x["pct_5min"])

hot_under = [b for b in under if b["lst"] is not None]
summary = {
    "pop_total": round(pop_total),
    "pct_5min": round(100 * (pop_total - under_pop) / pop_total, 1),
    "pct_10min": round(100 * sum(b["pop"] for b in blocks if b["walk"] <= WALK10) / pop_total, 1),
    "under_pop": round(under_pop),
    "far_pop": round(sum(b["pop"] for b in blocks if b["walk"] > WALK10)),
    "under_walk_m": round(sum(b["walk"] * b["pop"] for b in under) / under_pop),
    "under_lst": round(sum(b["lst"] * b["pop"] for b in hot_under) / sum(b["pop"] for b in hot_under), 1),
    "stops_n": len(stops),
    "candidates_n": len(cand_routes),
    "routes_n": len(routes),
    "k_max": max(len(v["proposals"]) for v in scen.values()),
    "stop_cost": STOP_COST,
}
method = {
    "walk_speed_m_min": 80, "walk5_m": WALK5, "walk10_m": WALK10, "cand_step_m": CAND_STEP,
    "algorithm": "Maksimal əhatə yerləşdirmə (MCLP), acgöz; optimalın ≥ 63%-i",
    "network": "OSM piyada şəbəkəsi (motorway xaric), Dijkstra",
    "stops": "BakuBus opendata.az + OSM bus_stop + metro stansiya və çıxışları",
    "pop": "Yaşayış blokları, WorldPop → DSK 2024",
    "cost_note": "Dayanacaq xərci ekspert təxminidir (örtük, oturacaq, işıq)",
}
json.dump({"summary": summary, "scenarios": scen, "new_route_zones": new_route[:15], "by_rayon": by_rayon, "method": method},
          open(DATA / "transit_access.json", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump({str(b["bid"]): round(b["walk"]) for b in blocks}, open(DATA / "transit_blocks.json", "w"), separators=(",", ":"))
json.dump({"type": "FeatureCollection", "features": [
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]}, "properties": {"src": s}} for lon, lat, s in stops
]}, open(DATA / "transit_stops.geojson", "w"), ensure_ascii=False, separators=(",", ":"))

print(json.dumps(summary, ensure_ascii=False))
for key, v in scen.items():
    for k in (10, 20, 50):
        if k < len(v["curve"]):
            print(key, f"{k} dayanacaq: +{v['curve'][k]} nəfər, {k * STOP_COST:,} ₼, nəfərə {k * STOP_COST / max(1, v['curve'][k]):.1f} ₼, {v['saved'][k]:,} dəq/gün")
    for c in v["proposals"][:8]:
        print("  ", c["k"], c["gain"], c["rayon"], c["zone"], c["routes"][:3], c["walk_before_m"])
print("yeni marşrut:", new_route[:5])
for r in by_rayon:
    print(r)
