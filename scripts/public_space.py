"""Bütün Bakı üzrə ictimai açıq məkan inventarı və təminat göstəriciləri.

Giriş:
  data-raw/osm/public_spaces.json   Overpass: leisure=park|garden|playground|common|nature_reserve,
                                    place=square, pedestrian area, natural=beach, landuse=recreation_ground
                                    (12 rayonun sərhədləri daxilində, out tags geom)
  data-raw/osm/rayons_land.geojson  rayonların quru ərazisi (Xəzər kəsilib)
  public/data/zoning_blocks.geojson yaşayış blokları (əhali ilə)
  public/data/baku_rayons.geojson, baku_analysis.json

Çıxış:
  public/data/public_spaces.geojson         sadələşdirilmiş poliqonlar (tip, ad, sahə)
  baku_rayons.geojson / baku_analysis.json  hər rayona ps_* sahələri, city.ps

Göstəricilər:
  ps_m2_pc   adambaşına ictimai açıq məkan, m²/nəfər (WHO yaşıl məkan tövsiyəsi ≥ 9 m²)
  ps_share   SDG 11.7.1 proksisi: ictimai açıq məkanın yaşayış bloklarının sahəsinə nisbəti, %
             (UN-Habitat tövsiyəsi: tikili ərazinin 15–20%-i açıq ictimai məkan)
  ps_400_pct əhalinin ≥ 0.25 ha ictimai məkana 400 m (≈ 5 dəq piyada) məsafədə yaşayan payı, %
Məsafələr düz xətt üzrədir (piyada şəbəkəsi ilə deyil), ona görə əlçatanlıq bir qədər yüksək görünə bilər.

  python3 scripts/public_space.py
"""

import json
import math
from collections import defaultdict
from pathlib import Path

from shapely.affinity import scale
from shapely.geometry import LineString, MultiPolygon, Polygon, mapping, shape
from shapely.ops import polygonize, unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw" / "osm"
DATA = ROOT / "public" / "data"
LAT0 = 40.4
KX, KY = 111_320 * math.cos(math.radians(LAT0)), 111_320
MIN_HA_ACCESS = 0.25


def m(g):
    """Dərəcədən təxmini metr koordinatına (Bakı enliyində)."""
    return scale(g, xfact=KX, yfact=KY, origin=(0, 0))


def kind(t):
    if t.get("natural") == "beach":
        return "beach"
    if t.get("leisure") == "playground":
        return "playground"
    if t.get("place") == "square" or t.get("highway") == "pedestrian" or "area:highway" in t:
        return "square"
    return "park"


LABEL = {"park": "Park və bağ", "square": "Meydan və piyada sahəsi", "playground": "Oyun meydançası", "beach": "Çimərlik"}

land = unary_union([shape(f["geometry"]) for f in json.load(open(RAW / "rayons_land.geojson"))["features"]])

polys = []
for e in json.load(open(RAW / "public_spaces.json"))["elements"]:
    t = e.get("tags", {})
    g = None
    if e["type"] == "way" and len(e.get("geometry", [])) >= 4:
        pts = [(p["lon"], p["lat"]) for p in e["geometry"]]
        if pts[0] == pts[-1]:
            g = Polygon(pts)
    elif e["type"] == "relation":
        lines = [LineString([(p["lon"], p["lat"]) for p in mm["geometry"]]) for mm in e.get("members", []) if mm.get("geometry") and len(mm["geometry"]) > 1]
        ps = list(polygonize(unary_union(lines))) if lines else []
        g = unary_union(ps) if ps else None
    if g is None or g.is_empty:
        continue
    g = g.buffer(0).intersection(land)
    if g.is_empty:
        continue
    polys.append({"g": g, "kind": kind(t), "name": t.get("name:az") or t.get("name") or ""})

# Üst-üstə düşən sahələri (məs. parkın içindəki oyun meydançası) ikiqat saymamaq üçün birləşdirilmiş örtük
cover = unary_union([p["g"] for p in polys])
cover_m = m(cover)
print("obyekt:", len(polys), "birləşmiş sahə:", round(cover_m.area / 1e6, 2), "km²")

# Əlçatanlıq üçün yalnız ≥ 0.25 ha məkanlar (oyun meydançası daxil, çünki çox vaxt parkın içindədir)
big = [p["g"] for p in polys if m(p["g"]).area >= MIN_HA_ACCESS * 1e4]
tree = STRtree([m(g) for g in big])
big_m = [m(g) for g in big]

ray_feats = json.load(open(DATA / "baku_rayons.geojson"))
RAY = [(f["properties"]["rayon"], shape(f["geometry"])) for f in ray_feats["features"]]

blocks = json.load(open(DATA / "zoning_blocks.geojson"))
agg = defaultdict(lambda: {"pop": 0.0, "pop400": 0.0, "area": 0.0})
for f in blocks["features"]:
    p = f["properties"]
    c = m(shape(f["geometry"]).centroid)
    idx = tree.nearest(c)
    d = c.distance(big_m[idx]) if idx is not None else 1e9
    a = agg[p["rayon"]]
    a["pop"] += p["pop"]
    a["area"] += p["area_km2"]
    if d <= 400:
        a["pop400"] += p["pop"]

analysis = json.load(open(DATA / "baku_analysis.json"))
by = {r["rayon"]: r for r in analysis["rayons"]}
city = {"area": 0.0, "pop": 0.0, "pop400": 0.0, "urban": 0.0, "count": 0, "by_kind": defaultdict(float)}
for name, geom in RAY:
    inter = cover.intersection(geom)
    area_m2 = m(inter).area
    r = by[name]
    pop = r["pop"]
    a = agg[name]
    vals = {
        "ps_km2": round(area_m2 / 1e6, 2),
        "ps_m2_pc": round(area_m2 / pop, 1) if pop else None,
        "ps_share": round(100 * area_m2 / (a["area"] * 1e6), 1) if a["area"] else None,
        "ps_400_pct": round(100 * a["pop400"] / a["pop"], 1) if a["pop"] else None,
        "ps_count": sum(1 for p in polys if p["g"].representative_point().within(geom)),
    }
    r.update(vals)
    city["area"] += area_m2
    city["pop"] += pop
    city["pop400"] += a["pop400"]
    city["urban"] += a["area"] * 1e6
    city["count"] += vals["ps_count"]
    for p in polys:
        if p["g"].representative_point().within(geom):
            city["by_kind"][p["kind"]] += m(p["g"]).area
for f in ray_feats["features"]:
    f["properties"].update({k: v for k, v in by[f["properties"]["rayon"]].items() if k.startswith("ps_")})

block_pop = sum(a["pop"] for a in agg.values())
analysis["city"]["ps"] = {
    "km2": round(city["area"] / 1e6, 2),
    "m2_pc": round(city["area"] / city["pop"], 1),
    "share": round(100 * city["area"] / city["urban"], 1),
    "pct_400": round(100 * city["pop400"] / block_pop, 1),
    "count": city["count"],
    "by_kind_km2": {LABEL[k]: round(v / 1e6, 2) for k, v in city["by_kind"].items()},
    "who_m2_pc": 9,
    "unhabitat_share": [15, 20],
    "source": "OSM (Overpass, 10.11.2026), 12 rayon; məsafələr düz xətt",
}

out = []
for p in polys:
    g = p["g"].simplify(0.00005, preserve_topology=True)
    if g.is_empty:
        continue
    gj = mapping(g if g.geom_type in ("Polygon", "MultiPolygon") else MultiPolygon([x for x in getattr(g, "geoms", []) if x.geom_type == "Polygon"]))

    def rnd(c):
        return [round(c[0], 5), round(c[1], 5)]

    if gj["type"] == "Polygon":
        gj["coordinates"] = [[rnd(c) for c in ring] for ring in gj["coordinates"]]
    else:
        gj["coordinates"] = [[[rnd(c) for c in ring] for ring in poly] for poly in gj["coordinates"]]
    out.append({"type": "Feature", "geometry": gj, "properties": {"kind": p["kind"], "name": p["name"], "ha": round(m(p["g"]).area / 1e4, 2)}})

json.dump({"type": "FeatureCollection", "features": out}, open(DATA / "public_spaces.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(ray_feats, open(DATA / "baku_rayons.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(analysis, open(DATA / "baku_analysis.json", "w"), ensure_ascii=False, indent=1)

print(json.dumps(analysis["city"]["ps"], ensure_ascii=False))
for r in sorted(analysis["rayons"], key=lambda x: x.get("ps_m2_pc") or 0):
    print(f'{r["rayon"]:10s} {r["ps_km2"]:6} km²  {r["ps_m2_pc"]:6} m²/nəfər  pay {r["ps_share"]}%  400m {r["ps_400_pct"]}%  say {r["ps_count"]}')
