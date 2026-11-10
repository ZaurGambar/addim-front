"""Küçə mebeli (OSM): oturacaq, içməli su, tualet, zibil qabı, örtük, fontan, küçə işığı.

OSM-də Bakı üzrə küçə mebeli çox az qeydə alınıb, ona görə bu göstərici ilk növbədə DATA BOŞLUĞUNU göstərir.
Standartla müqayisə: piyada küçəsinin hər 100 m-də 1 oturacaq (Gehl / yaşlı dostu şəhər tövsiyəsi).

Giriş:  data-raw/osm/street_furniture.json (Overpass, out tags center), rayons_land.geojson,
        public/data/pedestrian.geojson (mərkəzi zonanın piyada küçələri), baku_analysis.json
Çıxış:  baku_analysis.json → city.furniture, rayonlara furn_* sahələri

  python3 scripts/street_furniture.py
"""
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.prepared import prep

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw" / "osm"
DATA = ROOT / "public" / "data"
CENTER = (49.79, 40.345, 49.905, 40.425)
BENCH_EVERY_M = 100
KX, KY = 111_320 * math.cos(math.radians(40.4)), 111_320


def kind(t):
    a = t.get("amenity")
    if a in ("bench", "drinking_water", "toilets", "waste_basket", "shelter", "fountain"):
        return a
    if t.get("leisure") == "picnic_table":
        return "bench"
    if t.get("highway") == "street_lamp":
        return "street_lamp"
    return None


rayons = [(f["properties"]["rayon"], prep(shape(f["geometry"]))) for f in json.load(open(RAW / "rayons_land.geojson"))["features"]]
by_r = defaultdict(Counter)
city = Counter()
central = Counter()
lit_ways = Counter()
for e in json.load(open(RAW / "street_furniture.json"))["elements"]:
    t = e.get("tags", {})
    if e["type"] == "way" and "lit" in t and not kind(t):
        lit_ways[t["lit"]] += 1
        continue
    k = kind(t)
    if not k:
        continue
    lat = e.get("lat", e.get("center", {}).get("lat"))
    lon = e.get("lon", e.get("center", {}).get("lon"))
    if lat is None:
        continue
    pt = Point(lon, lat)
    r = next((n for n, g in rayons if g.contains(pt)), None)
    if not r:
        continue
    by_r[r][k] += 1
    city[k] += 1
    if CENTER[0] <= lon <= CENTER[2] and CENTER[1] <= lat <= CENTER[3]:
        central[k] += 1

# Mərkəzi zonada piyada küçələrinin uzunluğu və oturacaq ehtiyacı
ped_m = 0.0
for f in json.load(open(DATA / "pedestrian.geojson"))["features"]:
    g = f["geometry"]
    if g["type"] == "LineString":
        c = g["coordinates"]
        ped_m += sum(math.hypot((b[0] - a[0]) * KX, (b[1] - a[1]) * KY) for a, b in zip(c, c[1:]))
need_central = round(ped_m / BENCH_EVERY_M)

analysis = json.load(open(DATA / "baku_analysis.json"))
pop_city = sum(r["pop"] for r in analysis["rayons"])
for r in analysis["rayons"]:
    c = by_r[r["rayon"]]
    r["furn_bench"] = c["bench"]
    r["furn_bench_10k"] = round(1e4 * c["bench"] / r["pop"], 2) if r["pop"] else None
    r["furn_water_toilet"] = c["drinking_water"] + c["toilets"]
analysis["city"]["furniture"] = {
    "counts": dict(city),
    "bench_per_10k": round(1e4 * city["bench"] / pop_city, 2),
    "central_bench": central["bench"],
    "central_ped_km": round(ped_m / 1000, 1),
    "central_bench_need": need_central,
    "central_bench_gap": max(0, need_central - central["bench"]),
    "lit_ways": dict(lit_ways),
    "standard": f"piyada küçəsinin hər {BENCH_EVERY_M} m-də 1 oturacaq",
    "note": "OSM-də küçə mebeli çox az qeydə alınıb: rəqəmlər real sayı yox, data boşluğunu göstərir. Sahə auditi (Gehl formu) ilə doldurulmalıdır.",
}
json.dump(analysis, open(DATA / "baku_analysis.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(analysis["city"]["furniture"], ensure_ascii=False))
