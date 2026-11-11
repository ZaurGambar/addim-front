"""Bakının 12 rayonu üzrə tematik analiz: topoqrafiya, şəbəkə topologiyası, demoqrafiya,
sosial-iqtisadi, nəqliyyat, tikili mühit, iqlim, risk, tarixi-mədəni.

Giriş:  ../geojson/rayons.geojson, raster/*.tif, osm/*.json, dsk/*.csv, opendata (BakuBus, metro)
Çıxış:  ../geojson/baku_rayons.geojson  — rayon poliqonları + bütün metriklər
        ../geojson/baku_grid.geojson    — 1 km hücrələr (xəritə qatları üçün)
        ../geojson/baku_analysis.json   — metrik kataloqu, şəhər üzrə yekunlar, SWOT üçün göstəricilər
"""
import csv
import json
import math
import os
from collections import Counter, defaultdict

import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.warp import Resampling, reproject
from shapely.geometry import Point, box, mapping, shape
from shapely.prepared import prep
from shapely.strtree import STRtree

HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "..", "geojson")
R = os.path.join(HERE, "raster")
OD = os.path.join(HERE, "..", "opendata", "files")


def jload(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def km2(geom):
    c = geom.centroid
    from shapely.affinity import scale
    return scale(geom, xfact=111.32 * math.cos(math.radians(c.y)), yfact=111.32, origin=(0, 0)).area


def mkm(lat):
    return 111_320 * math.cos(math.radians(lat)), 111_320


ray_feats = jload(os.path.join(G, "rayons.geojson"))["features"]
RAY = [(f["properties"]["rayon"], shape(f["geometry"])) for f in ray_feats]
RAYP = [(n, prep(g)) for n, g in RAY]
CITY = None
from shapely.ops import unary_union
CITY = unary_union([g for _, g in RAY])


def rayon_of(lon, lat):
    p = Point(lon, lat)
    for n, g in RAYP:
        if g.contains(p):
            return n
    return None


M = {n: {"rayon": n, "area_km2": round(km2(g), 1)} for n, g in RAY}

# ---------------- Rasterlər: rayon üzrə statistika ----------------


def raster_stats(path, fn, name_prefix, valid=lambda a: np.isfinite(a)):
    with rasterio.open(path) as src:
        arr = src.read(1).astype("float64")
        if src.nodata is not None and not (isinstance(src.nodata, float) and math.isnan(src.nodata)):
            arr[arr == src.nodata] = np.nan
        for n, g in RAY:
            gg = g
            if src.crs.to_epsg() != 4326:
                from rasterio.warp import transform_geom
                gg = shape(transform_geom("EPSG:4326", src.crs, mapping(g)))
            mask = geometry_mask([mapping(gg)], out_shape=arr.shape, transform=src.transform, invert=True)
            vals = arr[mask & valid(arr)]
            fn(n, vals)


# Əhali (WorldPop 2020, 100 m)
def pop_fn(n, v):
    M[n]["pop"] = int(round(np.nansum(v)))
raster_stats(os.path.join(R, "pop.tif"), pop_fn, "pop", valid=lambda a: np.isfinite(a) & (a >= 0))

age = {"child": defaultdict(float), "old": defaultdict(float)}
for sx in ("f", "m"):
    for a in (0, 1, 5, 10, 65, 70, 75, 80):
        grp = "child" if a < 65 else "old"
        def f(n, v, grp=grp):
            age[grp][n] += float(np.nansum(v))
        raster_stats(os.path.join(R, f"age_{sx}_{a}.tif"), f, "age", valid=lambda a: np.isfinite(a) & (a >= 0))
for n in M:
    tot = M[n]["pop"] or 1
    M[n]["child_pct"] = round(100 * age["child"][n] / tot, 1)
    M[n]["old_pct"] = round(100 * age["old"][n] / tot, 1)
    M[n]["density"] = round(M[n]["pop"] / M[n]["area_km2"])

# DEM: hündürlük və meyl (EPSG:3857, piksel ~38 m xəritə vahidi)
with rasterio.open(os.path.join(R, "dem.tif")) as src:
    dem = src.read(1).astype("float64")
    tr = src.transform
    lat_c = 40.4
    px = tr.a * math.cos(math.radians(lat_c))  # yerdə metr
    gy, gx = np.gradient(dem, px, px)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))
    slope_pct = 100 * np.tan(np.radians(slope))
    from rasterio.warp import transform_geom
    for n, g in RAY:
        gg = shape(transform_geom("EPSG:4326", src.crs, mapping(g)))
        mask = geometry_mask([mapping(gg)], out_shape=dem.shape, transform=tr, invert=True)
        e, s = dem[mask], slope_pct[mask]
        M[n].update({
            "elev_mean": round(float(e.mean()), 1), "elev_min": int(np.percentile(e, 1)), "elev_max": int(np.percentile(e, 99.5)),
            "below_m20_pct": round(100 * float((e < -20).mean()), 1),
            "slope_mean": round(float(s.mean()), 1), "steep_pct": round(100 * float((s > 15).mean()), 1),
        })

# Landsat: yerüstü temperatur, NDVI (su pikselləri xaric)
with rasterio.open(os.path.join(R, "water.tif")) as w:
    water = w.read(1) == 1
for key, path in (("lst", "lst.tif"), ("ndvi", "ndvi.tif")):
    with rasterio.open(os.path.join(R, path)) as src:
        arr = src.read(1).astype("float64")
        from rasterio.warp import transform_geom
        for n, g in RAY:
            gg = shape(transform_geom("EPSG:4326", src.crs, mapping(g)))
            mask = geometry_mask([mapping(gg)], out_shape=arr.shape, transform=src.transform, invert=True) & ~water & np.isfinite(arr)
            v = arr[mask]
            if key == "lst":
                M[n].update({"lst_mean": round(float(v.mean()), 1), "lst_p90": round(float(np.percentile(v, 90)), 1)})
            else:
                M[n].update({"ndvi_mean": round(float(v.mean()), 3), "green_pct": round(100 * float((v > 0.3).mean()), 1)})
city_lst = np.average([M[n]["lst_mean"] for n in M], weights=[M[n]["pop"] for n in M])
for n in M:
    M[n]["uhi"] = round(M[n]["lst_mean"] - city_lst, 1)

# ---------------- Yol şəbəkəsinin topologiyası ----------------
roads = jload(os.path.join(HERE, "osm", "roads.json"))["elements"]
deg = Counter()
node_r = {}
len_by = defaultdict(lambda: defaultdict(float))
CAR = {"motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street",
       "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"}
PED = {"footway", "pedestrian", "path", "steps", "living_street"}
for e in roads:
    hw = e["tags"]["highway"]
    gm = e.get("geometry") or []
    if len(gm) < 2:
        continue
    pts = [(round(p["lon"], 6), round(p["lat"], 6)) for p in gm]
    if hw in CAR or hw == "pedestrian":
        # kəsişmə dərəcəsi: avtomobil + piyada küçələri şəbəkəsində (servis yolları xaric)
        deg[pts[0]] += 1
        deg[pts[-1]] += 1
        for p in pts[1:-1]:
            deg[p] += 2
    kx, ky = mkm(pts[0][1])
    L = sum(math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * ky) for a, b in zip(pts, pts[1:])) / 1000
    mid = pts[len(pts) // 2]
    r = rayon_of(*mid)
    if r:
        cls = "major" if hw.replace("_link", "") in ("motorway", "trunk", "primary") else "ped" if hw in PED else "car" if hw in CAR else "service"
        len_by[r][cls] += L
inter = defaultdict(int)
dead = defaultdict(int)
for p, d in deg.items():
    if d >= 3 or d == 1:
        r = rayon_of(*p)
        if not r:
            continue
        if d >= 3:
            inter[r] += 1
        else:
            dead[r] += 1
for n in M:
    a = M[n]["area_km2"]
    lb = len_by[n]
    road_km = lb["major"] + lb["car"]
    M[n].update({
        "road_km_km2": round(road_km / a, 2),
        "major_km_km2": round(lb["major"] / a, 2),
        "major_share": round(100 * lb["major"] / road_km, 1) if road_km else 0,
        "ped_km_km2": round(lb["ped"] / a, 2),
        "intersections_km2": round(inter[n] / a, 1),
        "deadend_pct": round(100 * dead[n] / max(1, dead[n] + inter[n]), 1),
    })

# ---------------- POI: sosial-iqtisadi göstəricilər ----------------
CATS = {
    "food": lambda t: t.get("amenity") in ("restaurant", "cafe", "fast_food", "bar", "pub"),
    "retail": lambda t: "shop" in t,
    "health": lambda t: t.get("amenity") in ("hospital", "clinic", "doctors", "dentist", "pharmacy"),
    "education": lambda t: t.get("amenity") in ("school", "kindergarten", "college", "university", "library"),
    "finance": lambda t: t.get("amenity") in ("bank", "atm", "bureau_de_change"),
    "office": lambda t: "office" in t,
    "tourism": lambda t: t.get("tourism") in ("hotel", "hostel", "guest_house", "apartment", "motel"),
    "culture": lambda t: t.get("amenity") in ("theatre", "cinema", "arts_centre", "community_centre") or t.get("tourism") in ("museum", "gallery", "attraction"),
    "heritage": lambda t: "historic" in t,
    "play": lambda t: t.get("leisure") in ("playground", "fitness_station", "pitch", "sports_centre"),
    "craft": lambda t: "craft" in t,
}
pc = defaultdict(Counter)
poi_pts = []
for e in jload(os.path.join(HERE, "osm", "pois.json"))["elements"]:
    lat = e.get("lat", e.get("center", {}).get("lat"))
    lon = e.get("lon", e.get("center", {}).get("lon"))
    if lat is None:
        continue
    r = rayon_of(lon, lat)
    hit = False
    for k, fn in CATS.items():
        if fn(e["tags"]):
            if r:
                pc[r][k] += 1
            hit = True
    if hit:
        poi_pts.append((lon, lat))
MIX = ["food", "retail", "health", "education", "finance", "office", "culture", "craft"]
for n in M:
    c = pc[n]
    tot = sum(c[k] for k in MIX)
    h = -sum((c[k] / tot) * math.log(c[k] / tot) for k in MIX if c[k]) / math.log(len(MIX)) if tot else 0
    per = 1000 / max(1, M[n]["pop"])
    M[n].update({
        "poi_per1000": round(tot * per, 2), "commerce_per1000": round((c["food"] + c["retail"]) * per, 2),
        "office_per1000": round(c["office"] * per, 2), "finance_per1000": round(c["finance"] * per, 2),
        "health_per1000": round(c["health"] * per, 2), "edu_per1000": round(c["education"] * per, 2),
        "tourism_beds": c["tourism"], "heritage": c["heritage"], "culture": c["culture"], "play_per1000": round(c["play"] * per, 3),
        "mix_index": round(100 * h), "poi_km2": round(tot / M[n]["area_km2"], 1),
    })

# ---------------- Nəqliyyat ----------------
metro = [f for f in jload(os.path.join(G, "metro.geojson"))["features"] if f["properties"]["status"] == "işləyir"]
ride = jload(os.path.join(G, "od_ridership.json"))["metro"]
for n in M:
    M[n].update({"metro_st": 0, "metro_ride": 0})
for f in metro:
    lon, lat = f["geometry"]["coordinates"]
    r = rayon_of(lon, lat)
    if r:
        M[r]["metro_st"] += 1
        M[r]["metro_ride"] += ride.get(f["properties"]["name"], {}).get("2026", 0)
stops = []
rows = list(csv.reader(open(os.path.join(OD, "bakubus-mmc-ye-mexsus-avtobus-marsrutlari-uzre-dayanacaqlarin-cografi-koordinatl", "dayanacaqlar.csv"), encoding="utf-8-sig")))
for r_ in rows[1:]:
    try:
        stops.append((float(r_[3]), float(r_[4])))
    except (ValueError, IndexError):
        pass
stop_r = Counter(rayon_of(lon, lat) for lon, lat in stops)
for n in M:
    M[n]["bus_stops_km2"] = round(stop_r[n] / M[n]["area_km2"], 2)

# Əhalinin dayanacağa 500 m əlçatanlığı (SDG 11.2.1): WorldPop pikselləri üzərindən
stop_tree = STRtree([Point(s) for s in stops] + [Point(f["geometry"]["coordinates"]) for f in metro])
with rasterio.open(os.path.join(R, "pop.tif")) as src:
    win = rasterio.windows.from_bounds(*CITY.bounds, transform=src.transform).round_offsets().round_lengths()
    arr = src.read(1, window=win)
    wt = src.window_transform(win)
    nod = src.nodata
covered, total = defaultdict(float), defaultdict(float)
pop_pts = []
rows_i, cols_i = np.where((arr > 0) & (arr != nod))
for i, j in zip(rows_i, cols_i):
    lon, lat = wt * (j + 0.5, i + 0.5)
    r = rayon_of(lon, lat)
    if not r:
        continue
    v = float(arr[i, j])
    total[r] += v
    pop_pts.append((lon, lat, v, r))
    near = stop_tree.query(Point(lon, lat).buffer(0.0059))  # ≈500 m
    if len(near):
        covered[r] += v
for n in M:
    M[n]["transit500_pct"] = round(100 * covered[n] / total[n], 1) if total[n] else None

# ---------------- Tikili mühit ----------------
bc_path = os.path.join(HERE, "osm", "building_counts.json")
bc = jload(bc_path) if os.path.exists(bc_path) else {}
lv_path = os.path.join(HERE, "osm", "building_levels.json")
levels = defaultdict(list)
if os.path.exists(lv_path):
    try:
        for e in jload(lv_path)["elements"]:
            c = e.get("center")
            try:
                lv = float(e["tags"]["building:levels"])
            except (KeyError, ValueError):
                continue
            if c and 0 < lv < 100:
                r = rayon_of(c["lon"], c["lat"])
                if r:
                    levels[r].append(lv)
    except Exception:
        pass
for n in M:
    M[n]["buildings_km2"] = round(bc[n] / M[n]["area_km2"], 1) if n in bc else None
    M[n]["levels_median"] = float(np.median(levels[n])) if len(levels[n]) >= 20 else None
    M[n]["levels_n"] = len(levels[n])

# ---------------- Sosial: əlillik (DSK, 2026) ----------------
dis = {}
for r_ in csv.reader(open(os.path.join(HERE, "dsk", "i-lin-evveline-olkenin-iqtisadi-rayonlari-ve-inzibati-erazi-.csv"), encoding="utf-8-sig")):
    if len(r_) > 5 and r_[0] == "2026" and r_[3] == "Cəmi" and r_[2].endswith("rayonu") and r_[5].isdigit():
        dis[r_[2].replace(" rayonu", "")] = int(r_[5])
for n in M:
    M[n]["disabled"] = dis.get(n)
    M[n]["disabled_per1000"] = round(1000 * dis[n] / M[n]["pop"], 1) if n in dis and M[n]["pop"] else None

# ---------------- Mərkəzi zona: piyada indeksi (yalnız tədqiqat ərazisi) ----------------
wi = jload(os.path.join(G, "walk_index.geojson"))["features"]
sc = defaultdict(list)
for f in wi:
    ring = f["geometry"]["coordinates"][0]
    r = rayon_of((ring[0][0] + ring[2][0]) / 2, (ring[0][1] + ring[2][1]) / 2)
    if r:
        sc[r].append(f["properties"]["score"])
for n in M:
    M[n]["walk_score"] = round(sum(sc[n]) / len(sc[n]), 1) if len(sc[n]) >= 15 else None
    M[n]["walk_cells"] = len(sc[n])

# ---------------- 1 km hücrə şəbəkəsi (xəritə üçün) ----------------
minx, miny, maxx, maxy = CITY.bounds
dlat = 1000 / 111_320
dlon = 1000 / (111_320 * math.cos(math.radians(40.4)))
cityp = prep(CITY)
cells = []
y = miny
while y < maxy:
    x = minx
    while x < maxx:
        b = box(x, y, x + dlon, y + dlat)
        if cityp.intersects(b):
            cells.append(b)
        x += dlon
    y += dlat
cell_tree = STRtree(cells)
agg = defaultdict(lambda: defaultdict(float))


def cell_idx(lon, lat):
    i = int((lat - miny) / dlat)
    j = int((lon - minx) / dlon)
    return (i, j)


key_of = {}
for k, b in enumerate(cells):
    key_of[cell_idx(b.centroid.x, b.centroid.y)] = k
for lon, lat, v, r in pop_pts:
    k = key_of.get(cell_idx(lon, lat))
    if k is not None:
        agg[k]["pop"] += v
for lon, lat in poi_pts:
    k = key_of.get(cell_idx(lon, lat))
    if k is not None:
        agg[k]["poi"] += 1
for p, d in deg.items():
    if d >= 3:
        k = key_of.get(cell_idx(*p))
        if k is not None:
            agg[k]["inter"] += 1
for lon, lat in stops:
    k = key_of.get(cell_idx(lon, lat))
    if k is not None:
        agg[k]["stops"] += 1


def sample_raster(path, mask_water=False):
    out = {}
    with rasterio.open(path) as src:
        arr = src.read(1).astype("float64")
        if mask_water:
            with rasterio.open(os.path.join(R, "water.tif")) as wsrc:
                arr[wsrc.read(1) == 1] = np.nan
        from rasterio.warp import transform
        cx = [b.centroid.x for b in cells]
        cy = [b.centroid.y for b in cells]
        xs, ys = transform("EPSG:4326", src.crs, cx, cy) if src.crs.to_epsg() != 4326 else (cx, cy)
        for k, (x, y_) in enumerate(zip(xs, ys)):
            r_, c_ = src.index(x, y_)
            # 1 km pəncərə ortalaması
            h = max(1, int(500 / (abs(src.transform.a) * (math.cos(math.radians(40.4)) if src.crs.to_epsg() == 3857 else 1))))
            win = arr[max(0, r_ - h):r_ + h, max(0, c_ - h):c_ + h]
            win = win[np.isfinite(win)]
            out[k] = float(win.mean()) if win.size else None
    return out


lst_c = sample_raster(os.path.join(R, "lst.tif"), mask_water=True)
ndvi_c = sample_raster(os.path.join(R, "ndvi.tif"), mask_water=True)
dem_c = sample_raster(os.path.join(R, "dem.tif"))
with rasterio.open(os.path.join(R, "dem.tif")) as src:
    from rasterio.warp import transform
    xs, ys = transform("EPSG:4326", src.crs, [b.centroid.x for b in cells], [b.centroid.y for b in cells])
    slope_c = {}
    for k, (x, y_) in enumerate(zip(xs, ys)):
        r_, c_ = src.index(x, y_)
        h = 17
        win = slope_pct[max(0, r_ - h):r_ + h, max(0, c_ - h):c_ + h]
        slope_c[k] = float(win.mean()) if win.size else None
with rasterio.open(os.path.join(R, "water.tif")) as src:
    wat = src.read(1)
    from rasterio.warp import transform
    xs, ys = transform("EPSG:4326", src.crs, [b.centroid.x for b in cells], [b.centroid.y for b in cells])
    water_c = {}
    for k, (x, y_) in enumerate(zip(xs, ys)):
        r_, c_ = src.index(x, y_)
        win = wat[max(0, r_ - 16):r_ + 16, max(0, c_ - 16):c_ + 16]
        water_c[k] = float((win == 1).mean()) if win.size else 0

grid_feats = []
for k, b in enumerate(cells):
    if water_c.get(k, 0) > 0.8:
        continue
    a = agg[k]
    lon, lat = b.centroid.x, b.centroid.y
    grid_feats.append({"type": "Feature", "geometry": mapping(b), "properties": {
        "id": k, "rayon": rayon_of(lon, lat) or min(RAY, key=lambda t: t[1].distance(Point(lon, lat)))[0],
        "pop": round(a["pop"]), "poi": int(a["poi"]), "inter": int(a["inter"]), "stops": int(a["stops"]),
        "lst": round(lst_c[k], 1) if lst_c.get(k) is not None else None,
        "ndvi": round(ndvi_c[k], 3) if ndvi_c.get(k) is not None else None,
        "elev": round(dem_c[k]) if dem_c.get(k) is not None else None,
        "slope": round(slope_c[k], 1) if slope_c.get(k) is not None else None,
    }})
for f in grid_feats:
    f["geometry"]["coordinates"] = [[[round(x, 5), round(y_, 5)] for x, y_ in ring] for ring in f["geometry"]["coordinates"]]
with open(os.path.join(G, "baku_grid.geojson"), "w", encoding="utf-8") as fh:
    json.dump({"type": "FeatureCollection", "features": grid_feats}, fh, ensure_ascii=False, separators=(",", ":"))

# ---------------- Çıxış ----------------
out_feats = []
for f in ray_feats:
    n = f["properties"]["rayon"]
    g = shape(f["geometry"]).simplify(0.0008, preserve_topology=True)
    out_feats.append({"type": "Feature", "geometry": mapping(g), "properties": M[n]})
for f in out_feats:
    gm = f["geometry"]
    if gm["type"] == "Polygon":
        gm["coordinates"] = [[[round(x, 5), round(y_, 5)] for x, y_ in ring] for ring in gm["coordinates"]]
    else:
        gm["coordinates"] = [[[[round(x, 5), round(y_, 5)] for x, y_ in ring] for ring in poly] for poly in gm["coordinates"]]
with open(os.path.join(G, "baku_rayons.geojson"), "w", encoding="utf-8") as fh:
    json.dump({"type": "FeatureCollection", "features": out_feats}, fh, ensure_ascii=False, separators=(",", ":"))

city = {
    "pop": sum(M[n]["pop"] for n in M), "area_km2": round(sum(M[n]["area_km2"] for n in M), 1),
    "lst_popw": round(float(city_lst), 1),
    "transit500_pct": round(100 * sum(covered.values()) / sum(total.values()), 1),
    "disabled": sum(M[n]["disabled"] or 0 for n in M), "grid_cells": len(grid_feats),
    "metro_ride_total": sum(M[n]["metro_ride"] for n in M),
    "pop_no_metro": sum(M[n]["pop"] for n in M if M[n]["metro_st"] == 0),
    "no_metro_rayons": [n for n in M if M[n]["metro_st"] == 0],
    "child_pct_city": round(100 * sum(age["child"].values()) / sum(M[n]["pop"] for n in M), 1),
    "old_pct_city": round(100 * sum(age["old"].values()) / sum(M[n]["pop"] for n in M), 1),
    "green_pct_popw": round(float(np.average([M[n]["green_pct"] for n in M], weights=[M[n]["pop"] for n in M])), 1),
    "roads": len(roads), "pois": len(poi_pts), "bus_stops": len(stops),
    "landsat_scene": "LC08_L2SP_166032_20250830_02_T1", "worldpop_year": 2020,
}
json.dump({"rayons": [M[n] for n in M], "city": city}, open(os.path.join(G, "baku_analysis.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for n in M:
    print(json.dumps(M[n], ensure_ascii=False))
print("CITY", city)
