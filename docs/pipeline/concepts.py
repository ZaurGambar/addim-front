"""29 insanyönümlü şəhərsalma anlayışını Bakı datası ilə ölçür, çarpaz korrelasiya qurur.

Giriş:  data/geojson/*.geojson (build_geojson.py, build_opendata_geojson.py), data/raw/amenities.json, raw/roads.json
Çıxış:  data/geojson/walk_index.geojson  — hər hücrəyə c_* göstəriciləri əlavə olunur
        data/geojson/concepts.json       — anlayışlar kataloqu, korrelasiya matrisi, nəticələr
"""
import json
import math
import os
from collections import Counter, defaultdict

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "geojson")
RAW = os.path.join(HERE, "raw")
BBOX = (40.345, 49.79, 40.425, 49.905)
LAT0 = 40.385
MLAT = 111_320
MLON = 111_320 * math.cos(math.radians(LAT0))
CENTER = (40.3717, 49.8366)  # Fəvvarələr meydanı


def xy(lat, lon):
    return ((lon - BBOX[1]) * MLON, (lat - BBOX[0]) * MLAT)


def load(name):
    with open(os.path.join(G, name), encoding="utf-8") as f:
        return json.load(f)


def clamp01(v):
    return max(0.0, min(1.0, v))


class Grid:
    """Sürətli radius axtarışı üçün sadə məkan indeksi."""

    def __init__(self, pts, size=200):
        self.size, self.cells = size, defaultdict(list)
        for i, p in enumerate(pts):
            self.cells[(int(p[0] // size), int(p[1] // size))].append(i)
        self.pts = pts

    def within(self, p, r):
        k = int(math.ceil(r / self.size))
        cx, cy = int(p[0] // self.size), int(p[1] // self.size)
        out = []
        for i in range(cx - k, cx + k + 1):
            for j in range(cy - k, cy + k + 1):
                for idx in self.cells.get((i, j), ()):
                    q = self.pts[idx]
                    if (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 <= r * r:
                        out.append(idx)
        return out

    def nearest(self, p, rmax=3000):
        r = self.size
        while r <= rmax:
            hits = self.within(p, r)
            if hits:
                return min(math.dist(p, self.pts[i]) for i in hits)
            r *= 2
        return rmax


def pt(f):
    g = f["geometry"]["coordinates"]
    return xy(g[1], g[0])


# ---------- Data ----------
wi = load("walk_index.geojson")
cells = wi["features"]
centers = []
for f in cells:
    ring = f["geometry"]["coordinates"][0]
    centers.append(xy((ring[0][1] + ring[2][1]) / 2, (ring[0][0] + ring[2][0]) / 2))

POI_CAT = {
    "food": lambda t: t.get("amenity") in ("restaurant", "cafe", "fast_food", "bar", "pub", "food_court"),
    "retail": lambda t: "shop" in t and t["shop"] not in ("supermarket", "convenience", "greengrocer", "bakery", "butcher"),
    "grocery": lambda t: t.get("shop") in ("supermarket", "convenience", "greengrocer", "bakery", "butcher") or t.get("amenity") == "marketplace",
    "health": lambda t: t.get("amenity") in ("hospital", "clinic", "doctors", "dentist"),
    "pharmacy": lambda t: t.get("amenity") == "pharmacy",
    "education": lambda t: t.get("amenity") in ("school", "kindergarten", "college", "university", "library"),
    "culture": lambda t: t.get("amenity") in ("theatre", "cinema", "arts_centre", "community_centre") or t.get("tourism") in ("museum", "gallery"),
    "finance": lambda t: t.get("amenity") in ("bank", "atm", "post_office"),
    "worship": lambda t: t.get("amenity") == "place_of_worship",
    "landmark": lambda t: "historic" in t or t.get("tourism") in ("attraction", "artwork", "viewpoint", "museum"),
    "play": lambda t: t.get("leisure") in ("playground", "fitness_station"),
}
MIX_CATS = ["food", "retail", "grocery", "health", "pharmacy", "education", "culture", "finance", "worship"]
pois = defaultdict(list)
wheel = []
for e in json.load(open(os.path.join(RAW, "amenities.json"), encoding="utf-8"))["elements"]:
    lat = e.get("lat", e.get("center", {}).get("lat"))
    lon = e.get("lon", e.get("center", {}).get("lon"))
    if lat is None:
        continue
    t, p = e["tags"], xy(lat, lon)
    for k, fn in POI_CAT.items():
        if fn(t):
            pois[k].append(p)
    if t.get("wheelchair") in ("yes", "limited"):
        wheel.append(p)
pidx = {k: Grid(v) for k, v in pois.items()}
all_mix = [p for k in MIX_CATS for p in pois[k]]
mix_idx = Grid(all_mix)
wheel_idx = Grid(wheel) if wheel else None

metro = [f for f in load("metro.geojson")["features"] if f["properties"]["status"] == "işləyir"]
ride = load("od_ridership.json")["metro"]
ride_max = max(v.get("2026", 0) for v in ride.values())
metro_pts = [pt(f) for f in metro]
metro_w = [ride.get(f["properties"]["name"], {}).get("2026", 0) / ride_max for f in metro]
exits = [pt(f) for f in load("od_metro_exits.geojson")["features"]]
access_idx = Grid(metro_pts + exits)
bus_idx = Grid([pt(f) for f in load("od_bus_stops.geojson")["features"]])
cross_feats = load("crossings.geojson")["features"]
cross_idx = Grid([pt(f) for f in cross_feats])
sig_idx = Grid([pt(f) for f in cross_feats if f["properties"]["signals"]])
under_idx = Grid([pt(f) for f in load("underpasses.geojson")["features"]])


def sample_lines(feats, step=20, keep=lambda f: True):
    out = []
    for f in feats:
        if not keep(f):
            continue
        g = f["geometry"]
        lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]] if g["type"] == "LineString" else []
        for line in lines:
            for a, b in zip(line, line[1:]):
                pa, pb = xy(a[1], a[0]), xy(b[1], b[0])
                L = math.dist(pa, pb)
                n = max(1, int(L // step))
                for i in range(n):
                    t = (i + .5) / n
                    out.append(((pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t), L / n))
    return out


bike = sample_lines(load("od_bike_lanes.geojson")["features"])
bike_idx = Grid([p for p, _ in bike])
barrier = sample_lines(load("barriers.geojson")["features"])
barrier_idx = Grid([p for p, _ in barrier])
coast_idx = Grid([p for p, _ in sample_lines(load("coast.geojson")["features"], step=40)])

# Magistral yollarda keçidlər və işıqlandırma (raw roads: nodes + lit)
crossing_ids, crossing_sig = set(), set()
for e in json.load(open(os.path.join(RAW, "crossing.json"), encoding="utf-8"))["elements"]:
    crossing_ids.add(e["id"])
    if e.get("tags", {}).get("crossing") == "traffic_signals" or e.get("tags", {}).get("crossing_ref") == "traffic_signals":
        crossing_sig.add(e["id"])
major_cross, major_cross_sig, lit_samples = [], [], []
for e in json.load(open(os.path.join(RAW, "roads.json"), encoding="utf-8"))["elements"]:
    cls = e["tags"]["highway"].replace("_link", "")
    if cls not in ("motorway", "trunk", "primary", "secondary"):
        continue
    for nid, g in zip(e.get("nodes", []), e.get("geometry", [])):
        if nid in crossing_ids:
            (major_cross_sig if nid in crossing_sig else major_cross).append(xy(g["lat"], g["lon"]))
    if e["tags"].get("lit") == "yes":
        for g in e.get("geometry", [])[::2]:
            lit_samples.append(xy(g["lat"], g["lon"]))
mc_idx, mcs_idx = Grid(major_cross), Grid(major_cross_sig)
lit_idx = Grid(lit_samples) if lit_samples else None

# Park sahəsi payı: hücrədə 5×5 nöqtə, parka düşən nöqtələrin payı
parks = []
for f in load("parks.geojson")["features"]:
    ring = [xy(c[1], c[0]) for c in f["geometry"]["coordinates"][0]]
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    parks.append((min(xs), min(ys), max(xs), max(ys), ring))


def in_ring(p, ring):
    x, y, inside = p[0], p[1], False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / ((y2 - y1) or 1e-12) + x1:
            inside = not inside
    return inside


def green_share(c):
    hits = 0
    for i in range(5):
        for j in range(5):
            p = (c[0] - 100 + i * 50, c[1] - 100 + j * 50)
            for x0, y0, x1, y1, ring in parks:
                if x0 <= p[0] <= x1 and y0 <= p[1] <= y1 and in_ring(p, ring):
                    hits += 1
                    break
    return hits / 25


def count(idx, p, r):
    return len(idx.within(p, r)) if idx else 0


def entropy(p, r):
    cnt = Counter()
    for k in MIX_CATS:
        cnt[k] = len(pidx[k].within(p, r)) if k in pidx else 0
    n = sum(cnt.values())
    if n == 0:
        return 0.0, 0
    h = -sum((v / n) * math.log(v / n) for v in cnt.values() if v)
    return h / math.log(len(MIX_CATS)), n


# ---------- Hücrə göstəriciləri ----------
IND = {}  # key -> list of values (None = tətbiq olunmur)
keys = ["jacobs", "lynch", "gehl", "whyte", "min15", "tod", "compact", "complete", "pedbike", "universal", "child",
        "placemaking", "cpted", "healthy", "visionzero", "green", "heat", "resilience", "sdg_transit", "equity"]
for k in keys:
    IND[k] = []

dist_center = []
for f, c in zip(cells, centers):
    p = f["properties"]
    major = p["major_m"]
    ent, n_mix = entropy(c, 375)
    gs = green_share(c)
    dist_center.append(math.dist(c, xy(*CENTER)))

    IND["jacobs"].append(100 * ent * clamp01(n_mix / 40))
    landmarks = count(pidx.get("landmark"), c, 375)
    IND["lynch"].append(50 * clamp01(landmarks / 5) + 25 * clamp01(p["ped_m"] / 300) + 25 * clamp01(1 - coast_idx.nearest(c) / 800))
    IND["gehl"].append(40 * (1 - clamp01(major / 600)) + 30 * clamp01(p["cross"] / 8) + 30 * clamp01(p["ped_m"] / 300))
    pull = max((clamp01(1 - math.dist(c, q) / 800) * w for q, w in zip(metro_pts, metro_w)), default=0)
    IND["whyte"].append(100 * pull)
    cats = [
        count(pidx.get("grocery"), c, 1000) > 0, count(pidx.get("pharmacy"), c, 1000) > 0,
        count(pidx.get("education"), c, 1000) > 0, count(pidx.get("health"), c, 1000) > 0,
        p["park_m"] <= 1000, access_idx.nearest(c) <= 1000 or bus_idx.nearest(c) <= 400, count(pidx.get("food"), c, 1000) > 0,
    ]
    IND["min15"].append(100 * sum(cats) / len(cats))
    IND["tod"].append(100 * clamp01(1 - access_idx.nearest(c) / 800) * (0.5 + 0.5 * clamp01(n_mix / 80)))
    IND["compact"].append(100 * clamp01(n_mix / 120))
    if major > 0:
        mc, mcs = count(mc_idx, c, 180), count(mcs_idx, c, 180)
        bike_m = sum(bike[i][1] for i in bike_idx.within(c, 180))
        IND["complete"].append(50 * clamp01((mc + mcs) / max(1, major / 150)) + 30 * ((mcs / (mc + mcs)) if mc + mcs else 0) + 20 * clamp01(bike_m / 200))
    else:
        IND["complete"].append(None)
    bike_m = sum(bike[i][1] for i in bike_idx.within(c, 180))
    IND["pedbike"].append(clamp01((p["ped_m"] + bike_m) / 400) * 70 + 30 * (1 - clamp01(major / 600)))
    sig = count(sig_idx, c, 180)
    allc = count(cross_idx, c, 180)
    IND["universal"].append(50 * ((sig / allc) if allc else 0) + 30 * clamp01(count(wheel_idx, c, 375) / 3) + 20 * (1 - clamp01(p["under"] / 2)))
    play = count(pidx.get("play"), c, 400)
    IND["child"].append(35 * clamp01(play / 2) + 35 * (1 if sig else 0) + 30 * (1 - clamp01(major / 600)))
    third = count(pidx.get("food"), c, 250) + count(pidx.get("play"), c, 250)
    IND["placemaking"].append(40 * clamp01(third / 15) + 30 * clamp01(gs / 0.3) + 30 * clamp01(p["ped_m"] / 300))
    frontage = count(pidx.get("food"), c, 180) + count(pidx.get("retail"), c, 180) + count(pidx.get("grocery"), c, 180)
    lit = count(lit_idx, c, 180)
    IND["cpted"].append(60 * clamp01(frontage / 25) + 20 * (1 if lit or major == 0 else 0) + 20 * (1 - clamp01(p["under"] / 2)))
    IND["healthy"].append(40 * clamp01(gs / 0.3) + 30 * clamp01(p["ped_m"] / 300) + 30 * clamp01(play / 2))
    if major > 0:
        mc, mcs = count(mc_idx, c, 180), count(mcs_idx, c, 180)
        bar_m = sum(barrier[i][1] for i in barrier_idx.within(c, 180))
        IND["visionzero"].append(50 * ((mcs / (mc + mcs)) if mc + mcs else 0) + 50 * (1 - clamp01(bar_m / 250)))
    else:
        IND["visionzero"].append(100.0)
    IND["green"].append(100 * clamp01(gs / 0.3))
    IND["heat"].append(100 - (60 * (1 - clamp01(gs / 0.3)) + 40 * clamp01(major / 600)))
    IND["resilience"].append(100 - 50 * clamp01(p["under"] / 2) - 50 * clamp01(major / 600) * (1 - clamp01(gs / 0.3)))
    IND["sdg_transit"].append(100.0 if (bus_idx.nearest(c) <= 500 or access_idx.nearest(c) <= 500) else 0.0)
    IND["equity"].append(p["score"])  # bərabərlik paylanma üzərindən ölçülür

for i, f in enumerate(cells):
    for k in keys:
        v = IND[k][i]
        f["properties"]["c_" + k] = None if v is None else round(v)
with open(os.path.join(G, "walk_index.geojson"), "w", encoding="utf-8") as fh:
    json.dump(wi, fh, ensure_ascii=False, separators=(",", ":"))


# ---------- Korrelasiya (Spearman) ----------
def ranks(a):
    order = np.argsort(a, kind="mergesort")
    r = np.empty(len(a))
    r[order] = np.arange(len(a))
    # bərabər qiymətlərə orta rank
    vals = np.asarray(a)[order]
    i = 0
    while i < len(vals):
        j = i
        while j + 1 < len(vals) and vals[j + 1] == vals[i]:
            j += 1
        if j > i:
            r[order[i:j + 1]] = (i + j) / 2
        i = j + 1
    return r


CORR_KEYS = ["jacobs", "lynch", "gehl", "whyte", "min15", "tod", "compact", "complete", "pedbike", "universal", "child",
             "placemaking", "cpted", "healthy", "visionzero", "green", "heat", "resilience"]
extra = {"score": [f["properties"]["score"] for f in cells], "demand": [f["properties"]["demand"] for f in cells]}
all_keys = CORR_KEYS + ["score", "demand"]
series = {k: IND[k] for k in CORR_KEYS} | extra
matrix, nmat = [], []
for a in all_keys:
    row, nrow = [], []
    for b in all_keys:
        pairs = [(x, y) for x, y in zip(series[a], series[b]) if x is not None and y is not None]
        if len(pairs) < 20:
            row.append(None); nrow.append(len(pairs)); continue
        xa, ya = np.array([p[0] for p in pairs], float), np.array([p[1] for p in pairs], float)
        if xa.std() == 0 or ya.std() == 0:
            row.append(None); nrow.append(len(pairs)); continue
        rho = float(np.corrcoef(ranks(xa), ranks(ya))[0, 1])
        row.append(round(rho, 2)); nrow.append(len(pairs))
    matrix.append(row); nmat.append(nrow)

# Bərabərlik: mərkəzdən məsafə halqaları üzrə orta indeks və Gini
rings = []
for lo, hi in ((0, 1500), (1500, 3000), (3000, 4500), (4500, 99999)):
    vals = [s for s, d in zip(extra["score"], dist_center) if lo <= d < hi]
    rings.append({"from_m": lo, "to_m": hi if hi < 99999 else None, "cells": len(vals), "mean": round(sum(vals) / len(vals), 1) if vals else None})
sv = sorted(extra["score"])
n = len(sv)
gini = round(sum((2 * (i + 1) - n - 1) * v for i, v in enumerate(sv)) / (n * sum(sv)), 3)


def mean(k):
    vals = [v for v in IND[k] if v is not None]
    return round(sum(vals) / len(vals), 1)


def share(k, thr):
    vals = [v for v in IND[k] if v is not None]
    return round(100 * sum(1 for v in vals if v >= thr) / len(vals), 1)


stats = {k: {"mean": mean(k), "n": sum(1 for v in IND[k] if v is not None)} for k in keys}
stats["min15"]["full_share"] = share("min15", 99.9)
stats["sdg_transit"]["share"] = share("sdg_transit", 50)
stats["green"]["park300_share"] = round(100 * sum(1 for f in cells if f["properties"]["park_m"] <= 300) / len(cells), 1)
stats["equity"].update({"gini": gini, "rings": rings})

# Stansiya səviyyəsində TOD və sərnişin əlaqəsi
summ = load("summary.json")
st_rows = []
for s in summ["stations"]:
    if not s.get("ride_2026"):
        continue
    c = xy(s["lat"], s["lon"])
    near = [i for i, cc in enumerate(centers) if math.dist(c, cc) <= 500]
    if not near:
        continue
    st_rows.append({"name": s["name"], "ride": s["ride_2026"],
                    **{k: round(sum(IND[k][i] for i in near if IND[k][i] is not None) / max(1, sum(1 for i in near if IND[k][i] is not None)))
                       for k in ("tod", "jacobs", "gehl", "min15", "universal", "visionzero")}})
station_corr = {}
for k in ("tod", "jacobs", "gehl", "min15", "universal", "visionzero"):
    xa = np.array([r["ride"] for r in st_rows], float)
    ya = np.array([r[k] for r in st_rows], float)
    station_corr[k] = round(float(np.corrcoef(ranks(xa), ranks(ya))[0, 1]), 2) if ya.std() else None

# Ən güclü cütlər. Eyni xam komponenti paylaşan göstəricilər "ortaq" kimi işarələnir (korrelasiya qismən tavtolojidir)
COMP = {
    "jacobs": {"mix"}, "lynch": {"landmark", "ped", "coast"}, "gehl": {"major", "cross", "ped"}, "whyte": {"ridership", "transit"},
    "min15": {"services", "park", "transit"}, "tod": {"transit", "mix"}, "compact": {"mix"}, "complete": {"major_cross", "sig", "bike", "cross"},
    "pedbike": {"ped", "bike", "major"}, "universal": {"sig", "wheel", "under"}, "child": {"play", "sig", "major"},
    "placemaking": {"food", "green", "ped", "play"}, "cpted": {"food", "retail", "lit", "under"}, "healthy": {"green", "ped", "play"},
    "visionzero": {"sig", "major_cross", "major"}, "green": {"green"}, "heat": {"green", "major"}, "resilience": {"under", "major", "green"},
    "score": {"transit", "park", "cross", "ped", "bus", "major", "under"}, "demand": {"poi", "bus", "transit"},
}
SHARED = {frozenset((a, b)) for a in COMP for b in COMP if a < b and COMP[a] & COMP[b]}
pairs = []
for i, a in enumerate(all_keys):
    for j, b in enumerate(all_keys):
        if j <= i or matrix[i][j] is None:
            continue
        pairs.append({"a": a, "b": b, "rho": matrix[i][j], "n": nmat[i][j], "shared": frozenset((a, b)) in SHARED})
pairs.sort(key=lambda x: -abs(x["rho"]))

out = {
    "cells": len(cells),
    "keys": all_keys,
    "matrix": matrix,
    "stats": stats,
    "station_rows": st_rows,
    "station_corr": station_corr,
    "top_pairs": [p for p in pairs if not p["shared"]][:12],
    "weak_pairs": sorted([p for p in pairs if not p["shared"]], key=lambda x: abs(x["rho"]))[:6],
    "shared_pairs": sorted([sorted(p) for p in SHARED]),
    "poi_counts": {k: len(v) for k, v in pois.items()},
    "wheelchair_tagged": len(wheel),
}
with open(os.path.join(G, "concepts.json"), "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)

print(json.dumps({k: v for k, v in stats.items()}, ensure_ascii=False))
print("TOP:", [(p["a"], p["b"], p["rho"]) for p in out["top_pairs"]])
print("WEAK:", [(p["a"], p["b"], p["rho"]) for p in out["weak_pairs"]])
print("STATION:", station_corr)
