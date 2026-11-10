"""Küçə həyatının 24 saatlıq profili (OSM opening_hours əsasında).

OSM-də obyektlərin yalnız ~13%-ində iş saatı qeydə alınıb, ona görə bu, nümunəyə əsaslanan proksidir.
Sadələşdirmə: həftənin günləri nəzərə alınmır, sətirdəki bütün “HH:MM-HH:MM” aralıqları birləşdirilir;
“24/7” bütün saatlarda açıq sayılır; gecə yarısını keçən aralıq (məs. 18:00-02:00) iki hissəyə bölünür.

Göstəricilər:
  city.activity.hourly   hər saat (0–23) üçün açıq obyektlərin payı, %
  late_pct (rayon)       22:00-dan sonra açıq olan obyektlərin payı, %
  open24_10k (rayon)     10 000 nəfərə 24/7 açıq obyekt

Giriş:  data-raw/osm/opening_hours.json, rayons_land.geojson, public/data/baku_analysis.json
Çıxış:  baku_analysis.json, baku_rayons.geojson

  python3 scripts/activity_hours.py
"""
import json
import re
from collections import defaultdict
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.prepared import prep

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw" / "osm"
DATA = ROOT / "public" / "data"
RNG = re.compile(r"(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})")


def hours(oh):
    """Açıq olduğu saatların dəsti (0–23) və ya None (oxunmadı)."""
    s = oh.strip()
    if "24/7" in s:
        return set(range(24))
    hs = set()
    for a, am, b, bm in RNG.findall(s):
        a, b = int(a) % 24, int(b)
        if b == 0 and int(bm) == 0:
            b = 24
        if b > 24:  # “17:00-26:00” kimi yazılış: gecə yarısından sonra davam edir
            hs.update(range(a, 24))
            hs.update(range(0, min(24, b - 24)))
            continue
        if b > a:
            hs.update(range(a, b))
        else:  # gecə yarısını keçir
            hs.update(range(a, 24))
            hs.update(range(0, b))
    return hs or None


rayons = [(f["properties"]["rayon"], prep(shape(f["geometry"]))) for f in json.load(open(RAW / "rayons_land.geojson"))["features"]]
hourly = [0] * 24
n_parsed = 0
agg = defaultdict(lambda: {"n": 0, "late": 0, "o24": 0})
for o in json.load(open(RAW / "opening_hours.json")):
    hs = hours(o["oh"])
    if hs is None:
        continue
    r = next((n for n, g in rayons if g.contains(Point(o["lon"], o["lat"]))), None)
    if not r:
        continue
    n_parsed += 1
    for h in hs:
        hourly[h] += 1
    a = agg[r]
    a["n"] += 1
    if hs & {22, 23, 0, 1}:
        a["late"] += 1
    if len(hs) == 24:
        a["o24"] += 1

analysis = json.load(open(DATA / "baku_analysis.json"))
rayons_geo = json.load(open(DATA / "baku_rayons.geojson"))
by = {r["rayon"]: r for r in analysis["rayons"]}
for name, a in agg.items():
    if name in by:
        by[name]["late_pct"] = round(100 * a["late"] / a["n"], 1) if a["n"] >= 20 else None
        by[name]["open24_10k"] = round(1e4 * a["o24"] / by[name]["pop"], 2)
        by[name]["hours_n"] = a["n"]
for f in rayons_geo["features"]:
    f["properties"].update({k: by[f["properties"]["rayon"]].get(k) for k in ("late_pct", "open24_10k")})
analysis["city"]["activity"] = {
    "n": n_parsed,
    "hourly": [round(100 * v / n_parsed, 1) for v in hourly],
    "late_pct": round(100 * sum(a["late"] for a in agg.values()) / n_parsed, 1),
    "open24": sum(a["o24"] for a in agg.values()),
    "coverage_note": "OSM-də obyektlərin ~13%-ində iş saatı var; nümunəyə əsaslanan proksidir",
}
json.dump(analysis, open(DATA / "baku_analysis.json", "w"), ensure_ascii=False, indent=1)
json.dump(rayons_geo, open(DATA / "baku_rayons.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
print(json.dumps(analysis["city"]["activity"], ensure_ascii=False))
for r in sorted(analysis["rayons"], key=lambda x: -(x.get("late_pct") or 0)):
    print(r["rayon"], r.get("late_pct"), r.get("open24_10k"), r.get("hours_n"))
