"""Təhlükəsiz məktəb yolu: hər məktəb və bağça ətrafında yol riski.

Göstəricilər (məktəbdən radius daxilində):
  major_m    300 m-də magistral yol uzunluğu (trunk/primary × 1.5, secondary × 1; ≥ 4 zolaq × 1.3)
  barrier_m  400 m-də 350 m-dən uzun keçidsiz magistral hissələri (yalnız mərkəzi zona)
  unsig      300 m-də işıqforsuz piyada keçidləri (yalnız mərkəzi zona)
  under      300 m-də yeraltı keçid nöqtələri (yalnız mərkəzi zona)
Risk (0–100) = 55 × min(1, major_m / 1200) + 25 × min(1, barrier_m / 600) + 12 × min(1, unsig / 6) + 8 × min(1, under / 2).
Səviyyə: yüksək ≥ 70, orta 40–69, aşağı < 40.
Mərkəzi zonadan kənarda keçid datası olmadığı üçün risk yalnız magistral komponentdən hesablanır (coverage="osm").
Qəza datası (DYP) gələndə risk ona görə kalibrlənməlidir.

Giriş:  data-raw/osm/schools_baku.json, data-raw/osm/major_roads_baku.geojson, data-raw/osm/rayons_land.geojson,
        public/data/barriers.geojson, crossings.geojson, underpasses.geojson
Çıxış:  public/data/schools_safety.geojson, baku_analysis.json → city.school_safety

  python3 scripts/school_safety.py
"""
import json
import math
from collections import Counter
from pathlib import Path

from shapely.affinity import scale
from shapely.geometry import LineString, Point, shape
from shapely.prepared import prep
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw" / "osm"
DATA = ROOT / "public" / "data"
KX, KY = 111_320 * math.cos(math.radians(40.4)), 111_320
CENTER = (49.79, 40.345, 49.905, 40.425)  # mərkəzi zona (keçid datası olan ərazi)


def m(g):
    return scale(g, xfact=KX, yfact=KY, origin=(0, 0))


def clamp(v):
    return max(0.0, min(1.0, v))


rayons = [(f["properties"]["rayon"], prep(shape(f["geometry"]))) for f in json.load(open(RAW / "rayons_land.geojson"))["features"]]

roads, weights = [], []
for f in json.load(open(RAW / "major_roads_baku.geojson"))["features"]:
    p = f["properties"]
    w = 1.5 if p["cls"] in ("motorway", "trunk", "primary") else 1.0
    try:
        if int(str(p.get("lanes") or "0").split(";")[0]) >= 4:
            w *= 1.3
    except ValueError:
        pass
    roads.append(m(LineString(f["geometry"]["coordinates"])))
    weights.append(w)
road_tree = STRtree(roads)

barriers = [m(LineString(f["geometry"]["coordinates"])) for f in json.load(open(DATA / "barriers.geojson"))["features"]]
barrier_tree = STRtree(barriers)
unsig = [m(Point(f["geometry"]["coordinates"])) for f in json.load(open(DATA / "crossings.geojson"))["features"] if not f["properties"].get("signals")]
unsig_tree = STRtree(unsig)
under = [m(Point(f["geometry"]["coordinates"])) for f in json.load(open(DATA / "underpasses.geojson"))["features"]]
under_tree = STRtree(under)

# Hazırlıq kursları və tədris mərkəzləri məktəb deyil (gündəlik uşaq axını yoxdur)
NOT_SCHOOL = ("hazırlıq", "kurs", "tədris mərkəzi", "təhsil mərkəzi", "academy", "akademiya", "training")

out = []
for s in json.load(open(RAW / "schools_baku.json")):
    if any(w in s["name"].lower() for w in NOT_SCHOOL):
        continue
    pt = Point(s["lon"], s["lat"])
    rayon = next((n for n, g in rayons if g.contains(pt)), None)
    if not rayon:
        continue
    c = m(pt)
    b300, b400 = c.buffer(300), c.buffer(400)
    major = sum(roads[i].intersection(b300).length * weights[i] for i in road_tree.query(b300))
    central = CENTER[0] <= s["lon"] <= CENTER[2] and CENTER[1] <= s["lat"] <= CENTER[3]
    if central:
        bar = sum(barriers[i].intersection(b400).length for i in barrier_tree.query(b400))
        uns = sum(1 for i in unsig_tree.query(b300) if unsig[i].within(b300))
        und = sum(1 for i in under_tree.query(b300) if under[i].within(b300))
        risk = 55 * clamp(major / 1200) + 25 * clamp(bar / 600) + 12 * clamp(uns / 6) + 8 * clamp(und / 2)
    else:
        bar = uns = und = None
        risk = 55 * clamp(major / 1200) / 0.55 * 0.8  # yalnız magistral komponenti, 0–80 şkalasına
    out.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
        "properties": {
            "name": s["name"] or ("Məktəb" if s["kind"] == "school" else "Uşaq bağçası"),
            "kind": s["kind"], "rayon": rayon,
            "major_m": round(major), "barrier_m": None if bar is None else round(bar),
            "unsig": uns, "under": und, "risk": round(risk), "coverage": "mərkəz" if central else "osm",
        },
    })

out.sort(key=lambda f: -f["properties"]["risk"])
for i, f in enumerate(out, 1):
    f["properties"]["rank"] = i
    r = f["properties"]["risk"]
    f["properties"]["level"] = "yüksək" if r >= 70 else "orta" if r >= 40 else "aşağı"

json.dump({"type": "FeatureCollection", "features": out}, open(DATA / "schools_safety.geojson", "w"), ensure_ascii=False, separators=(",", ":"))

analysis = json.load(open(DATA / "baku_analysis.json"))
lv = Counter(f["properties"]["level"] for f in out)
analysis["city"]["school_safety"] = {
    "n": len(out),
    "schools": sum(1 for f in out if f["properties"]["kind"] == "school"),
    "high": lv["yüksək"], "mid": lv["orta"], "low": lv["aşağı"],
    "near_major_300": sum(1 for f in out if f["properties"]["major_m"] > 0),
    "by_rayon_high": dict(Counter(f["properties"]["rayon"] for f in out if f["properties"]["level"] == "yüksək").most_common()),
    "method": "300 m-də magistral (çəkili), 400 m-də keçidsiz magistral, 300 m-də işıqforsuz keçid və yeraltı keçid; keçid datası yalnız mərkəzdə",
}
json.dump(analysis, open(DATA / "baku_analysis.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(analysis["city"]["school_safety"], ensure_ascii=False))
for f in out[:12]:
    p = f["properties"]
    print(p["rank"], p["risk"], p["kind"], p["name"][:40], p["rayon"], p["major_m"], p["barrier_m"], p["unsig"], p["under"])
