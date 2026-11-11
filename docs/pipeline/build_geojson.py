"""Bakı mərkəzi üçün OSM datasından GeoJSON qatları və piyada analizi qurur.

Giriş: data/raw/*.json (Overpass API cavabları)
Çıxış: data/geojson/*.geojson və data/geojson/summary.json
"""
import json
import math
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
OUT = os.path.join(HERE, "geojson")
os.makedirs(OUT, exist_ok=True)

BBOX = (40.345, 49.79, 40.425, 49.905)  # south, west, north, east
CELL_M = 250
LAT0 = 40.385
M_PER_DEG_LAT = 111_320
M_PER_DEG_LON = 111_320 * math.cos(math.radians(LAT0))


def load(name):
    with open(os.path.join(RAW, name + ".json"), encoding="utf-8") as f:
        return json.load(f)["elements"]


def xy(lat, lon):
    return ((lon - BBOX[1]) * M_PER_DEG_LON, (lat - BBOX[0]) * M_PER_DEG_LAT)


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def rnd(c):
    return [round(c[0], 5), round(c[1], 5)]


def line_coords(el):
    return [rnd((p["lon"], p["lat"])) for p in el.get("geometry", [])]


def feature(geom_type, coords, props):
    return {"type": "Feature", "geometry": {"type": geom_type, "coordinates": coords}, "properties": props}


def save(name, feats):
    with open(os.path.join(OUT, name + ".geojson"), "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": feats}, f, ensure_ascii=False, separators=(",", ":"))
    return feats


def in_bbox(lat, lon, pad=0.0):
    return BBOX[0] - pad <= lat <= BBOX[2] + pad and BBOX[1] - pad <= lon <= BBOX[3] + pad


# ---------- Baza qatları ----------
# Piyada küçələri: pedestrian_meta.json (redaktə tarixi ilə, adlı footway-lər daxil) varsa onu istifadə et
if os.path.exists(os.path.join(RAW, "pedestrian_meta.json")):
    ped = [el for el in load("pedestrian_meta") if el["tags"].get("highway") != "living_street"]
else:
    ped = load("pedestrian")
ped_feats = []
for el in ped:
    c = line_coords(el)
    if len(c) < 2:
        continue
    t = el["tags"]
    closed = c[0] == c[-1] and len(c) > 3 and (t.get("area") == "yes" or "area:highway" in t)
    kind = "pedestrian" if t.get("highway") == "pedestrian" or "area:highway" in t else \
        "footway" if t.get("highway") == "footway" else "car-free"
    updated = el.get("timestamp", "")[:10]
    ped_feats.append(feature("Polygon" if closed else "LineString", [c] if closed else c, {
        "name": t.get("name", ""), "kind": kind, "updated": updated, "osm_id": el["id"],
        "stale": bool(updated) and updated < "2021-01-01",
    }))
# 2GIS vizual yoxlamasının nəticələri (data/2gis_verification/verification.json)
VERIF = os.path.join(HERE, "2gis_verification", "verification.json")
if os.path.exists(VERIF):
    checks = {c["osm_id"]: c for c in json.load(open(VERIF, encoding="utf-8"))}
    for f in ped_feats:
        c = checks.get(f["properties"]["osm_id"])
        if c:
            f["properties"].update({"check": c["status"], "check_note": c["note"], "check_date": c["checked"]})
save("pedestrian", ped_feats)

ROAD_CLASS = {"motorway": 0, "trunk": 1, "primary": 2, "secondary": 3, "tertiary": 4}
roads = [el for el in load("roads") if el.get("geometry")]
save("roads", [feature("LineString", line_coords(el), {
    "cls": el["tags"]["highway"].replace("_link", ""),
    "name": el["tags"].get("name", ""),
    "lanes": el["tags"].get("lanes", ""),
}) for el in roads])

parks = [el for el in load("parks") if el.get("geometry") and len(el["geometry"]) > 3]
save("parks", [feature("Polygon", [line_coords(el)], {"name": el["tags"].get("name", "")}) for el in parks])

coast = load("coast")
save("coast", [feature("LineString", line_coords(el), {}) for el in coast if el.get("geometry")])

old = load("oldcity")
save("oldcity", [feature("Polygon", [line_coords(el)], {"name": "İçərişəhər"}) for el in old if el.get("geometry")])

seen = set()
metro_feats = []
for el in load("metro"):
    t = el["tags"]
    name = t.get("name", "")
    if "deposu" in name or name in seen:
        continue
    seen.add(name)
    building = "construction" in t
    metro_feats.append(feature("Point", rnd((el["lon"], el["lat"])), {
        "name": name if not building else f"{name} (tikilir)",
        "status": "tikilir" if building else "işləyir",
        "opened": t.get("start_date", "")[:4],
    }))
save("metro", metro_feats)

crossings = [el for el in load("crossing")]
crossing_ids = {el["id"] for el in crossings}
crossing_xy = [xy(el["lat"], el["lon"]) for el in crossings]
save("crossings", [feature("Point", rnd((el["lon"], el["lat"])), {
    "type": el.get("tags", {}).get("crossing", ""),
    "signals": el.get("tags", {}).get("crossing") == "traffic_signals",
}) for el in crossings])

pois = []
for el in load("schools"):
    lat = el.get("lat", el.get("center", {}).get("lat"))
    lon = el.get("lon", el.get("center", {}).get("lon"))
    if lat is None:
        continue
    pois.append({"lat": lat, "lon": lon, "kind": el["tags"]["amenity"], "name": el["tags"].get("name", "")})
save("schools", [feature("Point", rnd((p["lon"], p["lat"])), {"kind": p["kind"], "name": p["name"]}) for p in pois])
poi_xy = [xy(p["lat"], p["lon"]) for p in pois]

# Avtobus dayanacaqları: opendata.az (BakuBus) varsa onu, yoxdursa OSM-i istifadə et
OD_STOPS = os.path.join(OUT, "od_bus_stops.geojson")
if os.path.exists(OD_STOPS):
    bus = json.load(open(OD_STOPS, encoding="utf-8"))["features"]
    bus_xy = [xy(f["geometry"]["coordinates"][1], f["geometry"]["coordinates"][0]) for f in bus]
    BUS_SRC = "opendata.az (BakuBus)"
else:
    bus = load("busstops")
    bus_xy = [xy(el["lat"], el["lon"]) for el in bus]
    BUS_SRC = "OpenStreetMap"

# Metro sərnişin sayı (opendata.az, Bakı Metropoliteni)
OD_RIDE = os.path.join(OUT, "od_ridership.json")
RIDE = json.load(open(OD_RIDE, encoding="utf-8"))["metro"] if os.path.exists(OD_RIDE) else {}

# Yeraltı keçidlər: tunel yolları + girişlər -> 60 m radiusda qruplaşdırılmış "keçid yerləri"
under_raw = load("underpass")
under_pts = []
for el in under_raw:
    if el["type"] == "node":
        if el.get("tags", {}).get("railway") == "subway_entrance":
            continue  # metro girişləri ayrıca sayılır
        under_pts.append((el["lat"], el["lon"]))
    elif el.get("geometry"):
        g = el["geometry"]
        mid = g[len(g) // 2]
        under_pts.append((mid["lat"], mid["lon"]))
clusters = []
for lat, lon in under_pts:
    p = xy(lat, lon)
    for c in clusters:
        if dist(c["xy"], p) < 60:
            c["n"] += 1
            break
    else:
        clusters.append({"lat": lat, "lon": lon, "xy": p, "n": 1})
under_xy = [c["xy"] for c in clusters]

metro_live = [(f["geometry"]["coordinates"], f["properties"]) for f in metro_feats if f["properties"]["status"] == "işləyir"]
metro_xy = [xy(c[1], c[0]) for c, _ in metro_live]
# Stansiyanın çəkisi: 2026 gündəlik orta sərnişin / ən yüklü stansiya (data yoxdursa 0.5)
RIDE_MAX = max((v.get("2026", 0) for v in RIDE.values()), default=0) or 1
metro_w = [RIDE.get(pr["name"], {}).get("2026", RIDE_MAX / 2) / RIDE_MAX for _, pr in metro_live]
# Piyadanın metroya real giriş nöqtələri: stansiya nöqtələri + opendata metro çıxışları
OD_EXITS = os.path.join(OUT, "od_metro_exits.geojson")
exit_feats = json.load(open(OD_EXITS, encoding="utf-8"))["features"] if os.path.exists(OD_EXITS) else []
access_xy = metro_xy + [xy(f["geometry"]["coordinates"][1], f["geometry"]["coordinates"][0]) for f in exit_feats]


def metro_pull(p, radius):
    """Yaxınlıq × sərnişin çəkisi: ən yaxın stansiyalardan ən güclü təsir (0–1)."""
    return max((clamp01(1 - dist(p, q) / radius) * (0.4 + 0.6 * w) for q, w in zip(metro_xy, metro_w)), default=0)

park_vertices = []
for el in parks:
    for p in el["geometry"][:: max(1, len(el["geometry"]) // 12)]:
        park_vertices.append(xy(p["lat"], p["lon"]))


def count_within(pts, p, r):
    return sum(1 for q in pts if dist(p, q) <= r)


def nearest(pts, p):
    return min((dist(p, q) for q in pts), default=1e9)


# Magistral yolların uzunluğunu hücrələrə paylamaq üçün nöqtə nümunələri (hər ~25 m)
major_samples = []
for el in roads:
    cls = el["tags"]["highway"].replace("_link", "")
    if cls not in ("motorway", "trunk", "primary"):
        continue
    g = el["geometry"]
    for a, b in zip(g, g[1:]):
        pa, pb = xy(a["lat"], a["lon"]), xy(b["lat"], b["lon"])
        L = dist(pa, pb)
        n = max(1, int(L // 25))
        for i in range(n):
            t = (i + 0.5) / n
            major_samples.append(((pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t), L / n, el["tags"].get("name", "")))

ped_samples = []
for el in ped:
    g = el.get("geometry", [])
    for a, b in zip(g, g[1:]):
        pa, pb = xy(a["lat"], a["lon"]), xy(b["lat"], b["lon"])
        L = dist(pa, pb)
        n = max(1, int(L // 20))
        for i in range(n):
            t = (i + 0.5) / n
            ped_samples.append(((pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t), L / n))

# ---------- 1. Piyada Rahatlığı İndeksi (250 m hücrələr) ----------
W = xy(BBOX[0], BBOX[3])[0]
H = xy(BBOX[2], BBOX[1])[1]
nx, ny = int(W // CELL_M) + 1, int(H // CELL_M) + 1


def cell_of(p):
    return int(p[0] // CELL_M), int(p[1] // CELL_M)


agg = defaultdict(lambda: defaultdict(float))
for p, L, _ in major_samples:
    agg[cell_of(p)]["major_m"] += L
for p, L in ped_samples:
    agg[cell_of(p)]["ped_m"] += L
for p in crossing_xy:
    agg[cell_of(p)]["cross"] += 1
for p in bus_xy:
    agg[cell_of(p)]["bus"] += 1
for p in poi_xy:
    agg[cell_of(p)]["poi"] += 1
for p in under_xy:
    agg[cell_of(p)]["under"] += 1
for el in roads:  # quru ərazini dənizdən ayırmaq üçün: hər hansı yol olan hücrə
    for q in el["geometry"]:
        agg[cell_of(xy(q["lat"], q["lon"]))]["land"] = 1


def clamp01(v):
    return max(0.0, min(1.0, v))


grid_feats = []
cells_out = []
for (i, j), a in agg.items():
    if not (0 <= i < nx and 0 <= j < ny) or not (a.get("land") or a.get("cross") or a.get("bus")):
        continue
    cx, cy = (i + 0.5) * CELL_M, (j + 0.5) * CELL_M
    d_metro = nearest(access_xy, (cx, cy))
    d_park = nearest(park_vertices, (cx, cy))
    good = (
        25 * clamp01(1 - d_metro / 1200)
        + 20 * clamp01(1 - d_park / 600)
        + 20 * clamp01(a["cross"] / 8)
        + 20 * clamp01(a["ped_m"] / 300)
        + 15 * clamp01(a["bus"] / 4)
    )
    bad = 25 * clamp01(a["major_m"] / 600) + 10 * clamp01(a["under"] / 2)
    score = round(max(0, min(100, good - bad + 10)))
    demand = round(min(100, 18 * a["poi"] + 8 * a["bus"] + 30 * metro_pull((cx, cy), 800)))
    gap = round(max(0, demand - score))
    lon0 = BBOX[1] + i * CELL_M / M_PER_DEG_LON
    lat0 = BBOX[0] + j * CELL_M / M_PER_DEG_LAT
    lon1 = lon0 + CELL_M / M_PER_DEG_LON
    lat1 = lat0 + CELL_M / M_PER_DEG_LAT
    props = {
        "score": score, "demand": demand, "gap": gap,
        "cross": int(a["cross"]), "under": int(a["under"]), "bus": int(a["bus"]), "poi": int(a["poi"]),
        "ped_m": round(a["ped_m"]), "major_m": round(a["major_m"]),
        "metro_m": round(d_metro), "park_m": round(d_park),
    }
    cells_out.append(props)
    grid_feats.append(feature("Polygon", [[rnd((lon0, lat0)), rnd((lon1, lat0)), rnd((lon1, lat1)),
                                           rnd((lon0, lat1)), rnd((lon0, lat0))]], props))
save("walk_index", grid_feats)

# ---------- 2. Keçidsiz uzun magistral hissələri (sədd effekti) ----------
GAP_M = 350
barrier_feats = []
for el in roads:
    cls = el["tags"]["highway"].replace("_link", "")
    if cls not in ("motorway", "trunk", "primary"):
        continue
    g, ids = el["geometry"], el.get("nodes", [])
    seg, run = [g[0]], 0.0
    for k in range(1, len(g)):
        run += dist(xy(g[k - 1]["lat"], g[k - 1]["lon"]), xy(g[k]["lat"], g[k]["lon"]))
        seg.append(g[k])
        is_cross = k < len(ids) and ids[k] in crossing_ids
        if is_cross or k == len(g) - 1:
            if run >= GAP_M:
                barrier_feats.append(feature("LineString", [rnd((p["lon"], p["lat"])) for p in seg], {
                    "name": el["tags"].get("name", ""), "cls": cls, "len_m": round(run),
                    "lanes": el["tags"].get("lanes", ""),
                }))
            seg, run = [g[k]], 0.0
save("barriers", barrier_feats)

# ---------- 3. Yeraltı keçid -> yerüstü zebra namizədləri (Seul modeli) ----------
under_feats = []
for c in clusters:
    p = c["xy"]
    n_poi = count_within(poi_xy, p, 400)
    n_bus = count_within(bus_xy, p, 250)
    d_m = nearest(access_xy, p)
    major_near = sum(L for q, L, _ in major_samples if dist(p, q) <= 80)
    road = min(major_samples, key=lambda m: dist(p, m[0]))[2] if major_samples else ""
    priority = 25 * clamp01(n_poi / 12) + 25 * clamp01(n_bus / 12) + 30 * metro_pull(p, 600) + 20 * clamp01(major_near / 300)
    under_feats.append(feature("Point", rnd((c["lon"], c["lat"])), {
        "priority": priority, "road": road, "metro": metro_live[min(range(len(metro_xy)), key=lambda k: dist(p, metro_xy[k]))][1]["name"], "poi_400m": n_poi, "bus_250m": n_bus, "metro_m": round(d_m), "elements": c["n"],
    }))
top = max(f["properties"]["priority"] for f in under_feats)
for f in under_feats:
    f["properties"]["priority"] = round(100 * f["properties"]["priority"] / top)
under_feats.sort(key=lambda f: -f["properties"]["priority"])
for rank, f in enumerate(under_feats, 1):
    f["properties"]["rank"] = rank
    f["properties"]["candidate"] = rank <= 15
# Peyk yoxlaması (data/satellite/verification.json) — koordinata görə (≤15 m) bağlanır
SAT = os.path.join(HERE, "satellite", "verification.json")
if os.path.exists(SAT):
    for c in json.load(open(SAT, encoding="utf-8")):
        cp = xy(c["lat"], c["lon"])
        for f in under_feats:
            g = f["geometry"]["coordinates"]
            if dist(cp, xy(g[1], g[0])) <= 15:
                f["properties"].update({"sat": c["status"], "sat_note": c["note"]})
save("underpasses", under_feats)

# ---------- 4. Metro stansiyası əlçatanlıq kartları ----------
station_cards = []
for (coords, props), p in zip(metro_live, metro_xy):
    if not in_bbox(coords[1], coords[0]):
        continue
    near_cells = [c for f, c in zip(grid_feats, cells_out)
                  if dist(p, xy(f["geometry"]["coordinates"][0][0][1] + CELL_M / M_PER_DEG_LAT / 2,
                                f["geometry"]["coordinates"][0][0][0] + CELL_M / M_PER_DEG_LON / 2)) <= 500]
    station_cards.append({
        "name": props["name"],
        "lon": coords[0], "lat": coords[1],
        "cross_400m": count_within(crossing_xy, p, 400),
        "under_400m": count_within(under_xy, p, 400),
        "bus_400m": count_within(bus_xy, p, 400),
        "exits": sum(1 for f in exit_feats if f["properties"]["station"] == props["name"]),
        "ride_2025": RIDE.get(props["name"], {}).get("2025"),
        "ride_2026": RIDE.get(props["name"], {}).get("2026"),
        "poi_400m": count_within(poi_xy, p, 400),
        "major_m_400m": round(sum(L for q, L, _ in major_samples if dist(p, q) <= 400)),
        "park_m": round(nearest(park_vertices, p)),
        "score": round(sum(c["score"] for c in near_cells) / len(near_cells)) if near_cells else None,
    })
station_cards.sort(key=lambda s: s["score"] or 0)

# ---------- Xülasə ----------
ped_km = sum(L for _, L in ped_samples) / 1000
major_km = sum(m[1] for m in major_samples) / 1000
summary = {
    "bbox": BBOX,
    "cell_m": CELL_M,
    "cells": len(cells_out),
    "pedestrian_km": round(ped_km, 1),
    "major_road_km": round(major_km, 1),
    "crossings": len(crossings),
    "crossings_signalized": sum(1 for el in crossings if el.get("tags", {}).get("crossing") == "traffic_signals"),
    "underpass_sites": len(clusters),
    "barrier_segments": len(barrier_feats),
    "barrier_km": round(sum(f["properties"]["len_m"] for f in barrier_feats) / 1000, 1),
    "bus_stops": len(bus),
    "bus_source": BUS_SRC,
    "metro_exits": len(exit_feats),
    "ridership_stations": len(RIDE),
    "schools_hospitals": len(pois),
    "parks": len(parks),
    "metro_live": len(metro_live),
    "metro_building": len(metro_feats) - len(metro_live),
    "mean_score": round(sum(c["score"] for c in cells_out) / len(cells_out)),
    "cells_low": sum(1 for c in cells_out if c["score"] < 30),
    "cells_gap_high": sum(1 for c in cells_out if c["gap"] >= 30),
    "stations": station_cards,
    "top_underpasses": [f["properties"] | {"lon": f["geometry"]["coordinates"][0], "lat": f["geometry"]["coordinates"][1]}
                        for f in under_feats[:15]],
    "score_hist": [sum(1 for c in cells_out if b <= c["score"] < b + 10) for b in range(0, 100, 10)],
}
with open(os.path.join(OUT, "summary.json"), "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=1)

print(json.dumps({k: v for k, v in summary.items() if k not in ("stations", "top_underpasses")}, ensure_ascii=False))
for s in station_cards:
    print(s)
