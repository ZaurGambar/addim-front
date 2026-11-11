"""opendata.az fayllarını (CSV, KMZ) xəritə üçün GeoJSON və JSON-a çevirir.

Giriş: data/opendata/files/...  (collect_opendata.py ilə yığılıb)
Çıxış: data/geojson/od_*.geojson, data/geojson/od_ridership.json
"""
import csv
import io
import json
import math
import os
import re
import statistics
import zipfile
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(HERE, "opendata", "files")
OUT = os.path.join(HERE, "geojson")
BBOX = (40.345, 49.79, 40.425, 49.905)  # build_geojson.py ilə eyni ərazi
PAD = 0.01

# Ridership fayllarındakı adlar -> OSM stansiya adları
STATION = {
    "20 Yanvar": "20 Yanvar st.", "28 May": "28 May", "28-May": "28 May", "8 Noyabr": "8 Noyabr",
    "Avtovağzal": "Avtovağzal", "Avtovaghzal": "Avtovağzal", "Azadlıq prospekti": "Azadlıq prospekti",
    "Azadlig Prospekti": "Azadlıq prospekti", "Bakmil": "Bakmil", "Cəfər Cabbarlı": "Cəfər Cabbarlı",
    "Jafar Jabbarli": "Cəfər Cabbarlı", "Dərnəgül": "Dərnəgül", "Darnagul": "Dərnəgül",
    "Elmlər Akademiyası": "Elmlər Akademiyası", "Elmlar Akademiyasi": "Elmlər Akademiyası",
    "Gənclik": "Gənclik", "Ganjlik": "Gənclik", "Həzi Aslanov": "Həzi Aslanov", "Hazi Aslanov": "Həzi Aslanov",
    "Koroglu": "Koroğlu", "Koroghlu": "Koroğlu", "Memar Əcəmi": "Memar Əcəmi", "Memar Ajami": "Memar Əcəmi",
    "Memar Əcəmi-2": "Memar Əcəmi-2", "Memar Ajami 2": "Memar Əcəmi-2", "Neftçilər": "Neftçilər",
    "Neftchilar": "Neftçilər", "Nizami": "Nizami", "Nəriman Nərimanov": "Nəriman Nərimanov",
    "Nariman Narimanov": "Nəriman Nərimanov", "Nəsimi": "Nəsimi", "Nasimi": "Nəsimi",
    "Qara Qarayev": "Qara Qarayev", "Gara Garayev": "Qara Qarayev", "Sahil": "Sahil", "Ulduz": "Ulduz",
    "Xalqlar Dostluğu": "Xalqlar Dostluğu", "Khalglar Dostlughu": "Xalqlar Dostluğu",
    "Xocəsən": "Xocəsən", "Khocasen": "Xocəsən", "Xətai": "Şah İsmayıl Xətai", "Khatai": "Şah İsmayıl Xətai",
    "İnşaatçılar": "İnşaatçılar", "Inshaatchilar": "İnşaatçılar", "İçərişəhər": "İçərişəhər",
    "Icherisheher": "İçərişəhər", "Əhmədli": "Əhmədli", "Akhmedli": "Əhmədli",
}


def path(*parts):
    return os.path.join(F, *parts)


def in_bbox(lat, lon):
    return BBOX[0] - PAD <= lat <= BBOX[2] + PAD and BBOX[1] - PAD <= lon <= BBOX[3] + PAD


def feature(t, coords, props):
    return {"type": "Feature", "geometry": {"type": t, "coordinates": coords}, "properties": props}


def save(name, feats):
    with open(os.path.join(OUT, name + ".geojson"), "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": feats}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{name}: {len(feats)}")


def read_csv(p, delim=","):
    with open(p, encoding="utf-8-sig") as f:
        return list(csv.reader(f, delimiter=delim))


def kml_from_kmz(p):
    with zipfile.ZipFile(p) as z:
        name = next(n for n in z.namelist() if n.endswith(".kml"))
        return z.read(name).decode("utf-8")


def parse_coords(s):
    out = []
    for tok in s.split():
        lon, lat = tok.split(",")[:2]
        out.append([round(float(lon), 5), round(float(lat), 5)])
    return out


def simplify(pts, tol=0.00004):
    """Douglas–Peucker (dərəcə ilə, ~4 m)."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    norm = math.hypot(dx, dy) or 1e-12
    idx, dmax = 0, 0.0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / norm
        if d > dmax:
            idx, dmax = i, d
    if dmax <= tol:
        return [a, b]
    return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


# ---------- BakuBus dayanacaqları ----------
rows = read_csv(path("bakubus-mmc-ye-mexsus-avtobus-marsrutlari-uzre-dayanacaqlarin-cografi-koordinatl", "dayanacaqlar.csv"))
stops = []
for r in rows[1:]:
    try:
        lon, lat = float(r[3]), float(r[4])
    except (ValueError, IndexError):
        continue
    if in_bbox(lat, lon):
        stops.append(feature("Point", [round(lon, 5), round(lat, 5)], {"name": r[1].strip(), "hub": (r[5] if len(r) > 5 else "").strip()}))
save("od_bus_stops", stops)

# ---------- Metro çıxışları ----------
rows = read_csv(path("metro-cixislari-uzre-koordinatlar", "pathways.csv"), ";")
exits = []
for r in rows[1:]:
    try:
        lat, lon = int(r[2]) / 1e6, int(r[3]) / 1e6
    except (ValueError, IndexError):
        continue
    name = r[0].strip()
    if name.startswith("28.05"):  # mənbədə Excel "28 May"-ı tarixə çevirib
        name = "28 May"
    station = STATION.get(name, name)
    if station in ("Memar Əcəmi-2", "Memar Əcəmi 2"):
        station = "Memar Əcəmi"
    exits.append(feature("Point", [round(lon, 6), round(lat, 6)], {
        "station": station, "address": r[4].strip(), "exit": r[5].strip()}))
save("od_metro_exits", exits)

# ---------- Metro sərnişin sayı (gündəlik orta) ----------
daily = defaultdict(lambda: defaultdict(list))  # station -> year -> [values]
for fname, delim in (("passenger_2025.csv", ";"), ("passenger-2026.csv", ",")):
    rows = read_csv(path("stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi", fname), delim)
    for r in rows[1:]:
        if len(r) < 3:
            continue
        st = STATION.get(r[1].strip().strip('"'))
        try:
            v = int(r[2])
        except ValueError:
            continue
        if st:
            daily[st][r[0][:4]].append(v)
# Memar Əcəmi-2 eyni qovşaqdır, OSM-də bir stansiya kimi saxlanılır
ridership = {}
for st, years in daily.items():
    key = "Memar Əcəmi" if st == "Memar Əcəmi-2" else st
    rec = ridership.setdefault(key, {})
    for y, vals in years.items():
        rec[y] = rec.get(y, 0) + round(statistics.mean(vals))
        rec[f"{y}_days"] = len(vals)

# ---------- BakuBus marşrutları üzrə sərnişin ----------
rows = read_csv(path("bakubus-marsrutlari-uzre-gundelik-sernisin-gedislerinin-sayi-2026", "bakubus_passenger-2026.csv"))
route_vals = defaultdict(list)
for r in rows[1:]:
    try:
        route_vals[r[1].strip()].append(int(r[2]))
    except (ValueError, IndexError):
        continue
route_avg = {k: round(statistics.mean(v)) for k, v in route_vals.items()}

with open(os.path.join(OUT, "od_ridership.json"), "w", encoding="utf-8") as f:
    json.dump({"metro": ridership, "bus_routes": route_avg}, f, ensure_ascii=False, indent=1)
print(f"metro ridership: {len(ridership)} stansiya, bus: {len(route_avg)} marşrut")

# ---------- Avtobus marşrutlarının trayektoriyası ----------
kml = kml_from_kmz(path("avtobuslarin-hereket-trayektoriyasi", "buslines.kmz"))
lines = []
for pm in re.findall(r"<Placemark.*?</Placemark>", kml, re.S):
    name = re.search(r"<name>(.*?)</name>", pm).group(1).strip()
    parts = []
    for c in re.findall(r"<coordinates>(.*?)</coordinates>", pm, re.S):
        pts = parse_coords(c)
        if any(in_bbox(p[1], p[0]) for p in pts):
            parts.append(simplify(pts))
    if parts:
        lines.append(feature("MultiLineString", parts, {"route": name, "daily": route_avg.get(name)}))
save("od_bus_lines", lines)

# ---------- Velosiped zolaqları və parkinqləri ----------
def kml_features(p):
    kml = kml_from_kmz(p)
    pts, lns = [], []
    for pm in re.findall(r"<Placemark.*?</Placemark>", kml, re.S):
        m = re.search(r"<name>(.*?)</name>", pm)
        name = m.group(1).strip() if m else ""
        for c in re.findall(r"<Point>.*?<coordinates>(.*?)</coordinates>", pm, re.S):
            pts.append(feature("Point", parse_coords(c)[0], {"name": name}))
        for c in re.findall(r"<LineString>.*?<coordinates>(.*?)</coordinates>", pm, re.S):
            lns.append(feature("LineString", simplify(parse_coords(c)), {"name": name}))
    return pts, lns


_, lanes = kml_features(path("velosiped-zolaqlarinin-cografi-koordinatlari", "movcud-zolaqlar-velo.kmz"))
parking, lanes2 = kml_features(path("velosiped-parkinq-menteqelerinin-cografi-koordinatlari", "mpv-v-mps.-son.kmz"))
seen = {json.dumps(f["geometry"]["coordinates"][:2]) for f in lanes}
lanes += [f for f in lanes2 if json.dumps(f["geometry"]["coordinates"][:2]) not in seen]
save("od_bike_lanes", lanes)
save("od_bike_parking", [f for f in parking if in_bbox(f["geometry"]["coordinates"][1], f["geometry"]["coordinates"][0])])
