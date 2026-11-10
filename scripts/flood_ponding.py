"""Yağış suyunun yığılma ehtimalı (relyef çökəklikləri) və yeraltı keçidlərin sel riski.

Metod (sadə, şəffaf proksi; hidroloji model deyil):
  TPI = hündürlük − 300 m radiusdakı orta hündürlük.
  Su yığılma pikseli: TPI < −1.5 m və meyl < 3% (düz çökəklik).
  Yeraltı keçidin sel riski (0–100) = 60 × keçid nöqtəsində çökəkliyin dərinliyi (TPI, −4 m-də tam bal)
                                      + 40 × 100 m radiusda su yığılma piksellərinin payı.
  Sinif (yüksək/orta/aşağı) keçidlər arasında üçdə birlərlədir: SRTM binaları da ölçdüyü üçün
  sıx şəhərdə küçələr süni çökəklik kimi görünür, ona görə mütləq bal yox, nisbi sıra etibarlıdır.
Hündürlük: SRTM (AWS Terrain Tiles, z11, EPSG:3857, ~29 m). Drenaj şəbəkəsi və yağış intensivliyi nəzərə alınmır.

Giriş:  data-raw/dem_srtm_3857.tif, data-raw/osm/rayons_land.geojson
Çıxış (public/data):
  baku_rayons.geojson, baku_analysis.json  pond_pct (rayon quru ərazisinin %-i), city.pond_pct
  baku_grid.geojson                        pond (1 km hücrənin %-i)
  underpasses.geojson                      flood (0–100), flood_cls

  python3 scripts/flood_ponding.py
"""
import json
import math
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.warp import transform, transform_geom
from shapely.geometry import mapping, shape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
RAW = ROOT / "data-raw"
R_M = 300
TPI_T = -1.5
SLOPE_T = 3.0

with rasterio.open(RAW / "dem_srtm_3857.tif") as src:
    dem = src.read(1).astype("float64")
    tr, crs = src.transform, src.crs
px = tr.a * math.cos(math.radians(40.4))  # piksel ölçüsü yerdə, m


def box_mean(a, r):
    """(2r+1)² pəncərədə orta (inteqral şəkil), kənarlarda kəsilmiş pəncərə."""
    p = np.pad(a, r + 1, mode="edge")
    c = p.cumsum(0).cumsum(1)
    k = 2 * r + 1
    s = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    return s[: a.shape[0], : a.shape[1]] / (k * k)


r = max(1, round(R_M / px))
tpi = dem - box_mean(dem, r)
gy, gx = np.gradient(dem, px, px)
slope = 100 * np.hypot(gx, gy)
pond = (tpi < TPI_T) & (slope < SLOPE_T)

land = [shape(f["geometry"]) for f in json.load(open(RAW / "osm" / "rayons_land.geojson"))["features"]]
land_mask = geometry_mask([transform_geom("EPSG:4326", crs, mapping(g)) for g in land], out_shape=dem.shape, transform=tr, invert=True)
pond &= land_mask
print("piksel:", round(px, 1), "m · pəncərə radiusu:", r, "px · su yığılma payı (quru):", round(100 * pond.sum() / land_mask.sum(), 1), "%")

# --- Rayonlar ---
rayons = json.load(open(DATA / "baku_rayons.geojson"))
analysis = json.load(open(DATA / "baku_analysis.json"))
by = {x["rayon"]: x for x in analysis["rayons"]}
for f in rayons["features"]:
    g = transform_geom("EPSG:4326", crs, f["geometry"])
    mk = geometry_mask([g], out_shape=dem.shape, transform=tr, invert=True) & land_mask
    v = round(100 * pond[mk].mean(), 1) if mk.any() else None
    f["properties"]["pond_pct"] = v
    by[f["properties"]["rayon"]]["pond_pct"] = v
analysis["city"]["pond_pct"] = round(100 * pond.sum() / land_mask.sum(), 1)
analysis["city"]["pond_method"] = f"SRTM, TPI {R_M} m < {TPI_T} m və meyl < {SLOPE_T}%"

# --- 1 km hücrələr ---
grid = json.load(open(DATA / "baku_grid.geojson"))
cx = [sum(c[0] for c in f["geometry"]["coordinates"][0][:4]) / 4 for f in grid["features"]]
cy = [sum(c[1] for c in f["geometry"]["coordinates"][0][:4]) / 4 for f in grid["features"]]
xs, ys = transform("EPSG:4326", crs, cx, cy)
h = max(1, round(500 / px))
for f, x, y in zip(grid["features"], xs, ys):
    row, col = rasterio.transform.rowcol(tr, x, y)
    win_p = pond[max(0, row - h) : row + h, max(0, col - h) : col + h]
    win_l = land_mask[max(0, row - h) : row + h, max(0, col - h) : col + h]
    f["properties"]["pond"] = round(100 * win_p.sum() / win_l.sum(), 1) if win_l.sum() else None

# --- Yeraltı keçidlər ---
under = json.load(open(DATA / "underpasses.geojson"))
ux = [f["geometry"]["coordinates"][0] for f in under["features"]]
uy = [f["geometry"]["coordinates"][1] for f in under["features"]]
xs, ys = transform("EPSG:4326", crs, ux, uy)
rr = max(1, round(100 / px))
r60 = max(1, round(60 / px))
for f, x, y in zip(under["features"], xs, ys):
    row, col = rasterio.transform.rowcol(tr, x, y)
    t = float(tpi[max(0, row - 1) : row + 2, max(0, col - 1) : col + 2].mean())
    share = float(pond[max(0, row - rr) : row + rr + 1, max(0, col - rr) : col + rr + 1].mean())
    f["properties"]["flood"] = round(60 * min(1, max(0, -t / 4)) + 40 * share)
    f["properties"]["flood_tpi"] = round(t, 1)
# SRTM səth modelidir (binalar daxil): sıx şəhərdə küçələr süni çökəklik kimi görünür.
# Ona görə sinif mütləq hədlə yox, keçidlərin öz arasında üçdə birlərlə verilir (nisbi sıralama).
sc = sorted(f["properties"]["flood"] for f in under["features"])
t1, t2 = sc[len(sc) // 3], sc[2 * len(sc) // 3]
for f in under["features"]:
    v = f["properties"]["flood"]
    f["properties"]["flood_cls"] = "yüksək" if v > t2 else "orta" if v > t1 else "aşağı"

json.dump(rayons, open(DATA / "baku_rayons.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(grid, open(DATA / "baku_grid.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(under, open(DATA / "underpasses.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(analysis, open(DATA / "baku_analysis.json", "w"), ensure_ascii=False, indent=1)

for x in sorted(analysis["rayons"], key=lambda x: -(x["pond_pct"] or 0)):
    print(f'{x["rayon"]:10s} {x["pond_pct"]}%')
cand = sorted([f["properties"] for f in under["features"] if f["properties"].get("candidate")], key=lambda p: -p["flood"])
for p in cand[:8]:
    print("keçid", p["rank"], p.get("road") or p.get("metro"), "sel", p["flood"], p["flood_cls"], "TPI", p["flood_tpi"])
print("bütün keçidlər:", {c: sum(1 for f in under["features"] if f["properties"]["flood_cls"] == c) for c in ("yüksək", "orta", "aşağı")})
