"""İnklüziv əlçatanlıq: eyni şəhər fərqli insanlar üçün nə qədər əlçatandır?

Fikir: orta yaşlı piyada üçün 10 dəqiqəlik məhəllə yaşlı, əlil arabası istifadəçisi və uşaq arabalı valideyn
üçün çox kiçikdir: onlar yavaş yeriyir, pilləkən (yeraltı keçid) və dik yamac onların yolunu bağlayır.
Hər profil üçün piyada şəbəkəsində ayrıca marşrut hesablanır və gündəlik xidmətlərə 10 dəqiqəlik çatım ölçülür.

Profillər (sürət — ədəbiyyatdakı tipik dəyərlər; maneələr — OSM + SRTM proksiləri):
  adult     Orta piyada (müqayisə)     80 m/dəq  maneəsiz
  elderly   Yaşlı                      60 m/dəq  yamac 5–8% ×1.3, > 8% ×2; yeraltı keçid zonası ×3 (pilləkən)
  wheel     Əlil arabası               60 m/dəq  yamac 5–8% ×1.5, > 8% keçilməz; yeraltı keçid zonası keçilməz
  stroller  Uşaq arabalı valideyn      65 m/dəq  wheel ilə eyni maneələr
Xidmət səbətləri (10 dəqiqə):
  adult, elderly, wheel: dayanacaq/metro, aptek, səhiyyə (poliklinika, xəstəxana, həkim), ərzaq, park
  stroller: bağça, park, ərzaq, səhiyyə, dayanacaq/metro
  uşaq (ayrıca): məktəbə 10 dəq (70 m/dəq) və məktəb ətrafı riski (schools_safety)

Maneə proksiləri: yamac SRTM (30 m, 3×3 hamarlanmış; səth modeli binaları da ölçür → kənar uzunluğu ≥ 40 m
baza ilə); yeraltı keçid: 83 məlum keçid nöqtəsindən 35 m radiusdakı qovşaqlar (lift/pandus datası yoxdur →
ən pis hal). Pandus, taktil plitə, səki eni OSM-də demək olar ki yoxdur: görmə məhdudiyyətli profil hesablanmır.

Əhali qrupları: yaşlı 6.4%, uşaq 19% (DSK, yalnız şəhər səviyyəsində), əlilliyi olan — rayon üzrə DSK, bloka
əhali payı ilə paylanır. Qrupun məkan paylanması əhaliyə mütənasib qəbul edilir (təxmini).

Giriş:  data-raw/osm/walk_ways.json.gz, health_baku.json, grocery_baku.json, data-raw/dem_srtm_3857.tif,
        public/data/transit_stops.geojson, public_spaces.geojson, schools_safety.geojson, underpasses.geojson,
        zoning_blocks.geojson, zoning.json, zoning_zones.geojson, baku_analysis.json
Çıxış:  public/data/inclusive_access.json, inclusive_blocks.json, barriers_access.json

Ssenarilər (hədəflər üçün): yeraltı keçidlər əlçatan → + yamaclarda pandus → + 40 prioritet zonada əlçatan məhəllə hub-u.

  python3 scripts/inclusive_access.py
"""
import gzip
import json
import math
from collections import defaultdict
from pathlib import Path

import networkx as nx
import numpy as np
import rasterio
from shapely.affinity import scale
from shapely.geometry import Point, shape
from shapely.prepared import prep
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw"
DATA = ROOT / "public" / "data"
KX, KY = 111_320 * math.cos(math.radians(40.4)), 111_320
MIN = 10
SNAP_SVC, SNAP_BLOCK, UNDER_R = 150, 250, 35
R = 6378137.0

PROFILES = {
    "adult": {"name": "Orta piyada", "speed": 80, "basket": ["transit", "pharmacy", "health", "grocery", "park"]},
    "elderly": {"name": "Yaşlı", "speed": 60, "basket": ["transit", "pharmacy", "health", "grocery", "park"]},
    "wheel": {"name": "Əlil arabası", "speed": 60, "basket": ["transit", "pharmacy", "health", "grocery", "park"]},
    "stroller": {"name": "Uşaq arabalı valideyn", "speed": 65, "basket": ["kinder", "park", "grocery", "health", "transit"]},
}
SVC_NAME = {"transit": "Dayanacaq / metro", "pharmacy": "Aptek", "health": "Səhiyyə", "grocery": "Ərzaq", "park": "Park", "kinder": "Bağça", "school": "Məktəb"}


def xy(lon, lat):
    return (lon * KX, lat * KY)


# ---------- Şəbəkə ----------
G = nx.Graph()
for way in json.load(gzip.open(RAW / "osm" / "walk_ways.json.gz", "rt")):
    pts = [tuple(p) for p in way]
    for a, b in zip(pts, pts[1:]):
        if a != b:
            (ax, ay), (bx, by) = xy(*a), xy(*b)
            G.add_edge(a, b, len=math.hypot(bx - ax, by - ay))
G = G.subgraph(max(nx.connected_components(G), key=len)).copy()
nodes = list(G.nodes)
idx = {n: i for i, n in enumerate(nodes)}
npts = [Point(xy(*n)) for n in nodes]
tree = STRtree(npts)
print("qovşaq:", len(nodes), "kənar:", G.number_of_edges())

# ---------- Hündürlük və yamac ----------
with rasterio.open(RAW / "dem_srtm_3857.tif") as src:
    dem = src.read(1).astype("float64")
    nod = src.nodata
    if nod is not None:
        dem[dem == nod] = np.nan
    # 3×3 orta (≈ 90 m) — SRTM küyünü və bina zirvələrini yumşaldır
    pad = np.pad(dem, 1, mode="edge")
    sm = sum(pad[1 + dy: pad.shape[0] - 1 + dy, 1 + dx: pad.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)) / 9
    lon = np.array([n[0] for n in nodes])
    lat = np.array([n[1] for n in nodes])
    mx = R * np.radians(lon)
    my = R * np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))
    rows, cols = rasterio.transform.rowcol(src.transform, mx, my)
    rows = np.clip(np.array(rows), 0, sm.shape[0] - 1)
    cols = np.clip(np.array(cols), 0, sm.shape[1] - 1)
    elev = sm[rows, cols]
elev = np.nan_to_num(elev, nan=0.0)

# Yeraltı keçid zonası
under_pts = [Point(xy(*f["geometry"]["coordinates"])) for f in json.load(open(DATA / "underpasses.geojson"))["features"]]
under_nodes = set()
for p in under_pts:
    for i in tree.query(p.buffer(UNDER_R)):
        if p.distance(npts[i]) <= UNDER_R:
            under_nodes.add(nodes[i])

steep58 = steep8 = 0.0
total_len = 0.0
for a, b, d in G.edges(data=True):
    L = d["len"]
    g = abs(elev[idx[a]] - elev[idx[b]]) / max(L, 40.0)
    d["grade"] = g
    d["under"] = a in under_nodes or b in under_nodes
    total_len += L
    if g > 0.08:
        steep8 += L
    elif g > 0.05:
        steep58 += L


def weight_fn(profile, under_on=True, ramps=False):
    """ramps=True: yamaclarda pandus/məhəccər ssenarisi (> 8% keçilir ×1.5, 5–8% ×1.15)."""
    if profile == "adult":
        return lambda a, b, d: d["len"]
    if profile == "elderly":
        def w(a, b, d):
            f = 1.0
            if d["grade"] > 0.08:
                f = 1.5 if ramps else 2.0
            elif d["grade"] > 0.05:
                f = 1.15 if ramps else 1.3
            if under_on and d["under"]:
                f *= 3.0
            return d["len"] * f
        return w

    def w(a, b, d):  # wheel, stroller
        if under_on and d["under"]:
            return None
        if d["grade"] > 0.08:
            if not ramps:
                return None
            return d["len"] * 1.5
        return d["len"] * ((1.15 if ramps else 1.5) if d["grade"] > 0.05 else 1.0)
    return w


# ---------- Xidmət mənbələri ----------
def snap_nodes(points):
    out = set()
    for lon, lat in points:
        p = Point(xy(lon, lat))
        i = tree.nearest(p)
        if p.distance(npts[i]) <= SNAP_SVC:
            out.add(nodes[i])
    return out


health = json.load(open(RAW / "osm" / "health_baku.json"))
schools = json.load(open(DATA / "schools_safety.geojson"))["features"]
src = {
    "transit": snap_nodes([f["geometry"]["coordinates"] for f in json.load(open(DATA / "transit_stops.geojson"))["features"]]),
    "pharmacy": snap_nodes([(h["lon"], h["lat"]) for h in health if h["kind"] == "pharmacy"]),
    "health": snap_nodes([(h["lon"], h["lat"]) for h in health if h["kind"] == "health"]),
    "grocery": snap_nodes([(g["lon"], g["lat"]) for g in json.load(open(RAW / "osm" / "grocery_baku.json"))]),
    "kinder": snap_nodes([f["geometry"]["coordinates"] for f in schools if f["properties"]["kind"] == "kindergarten"]),
    "school": snap_nodes([f["geometry"]["coordinates"] for f in schools if f["properties"]["kind"] == "school"]),
}
park = set()
for f in json.load(open(DATA / "public_spaces.geojson"))["features"]:
    if f["properties"]["ha"] < 0.25:
        continue
    g = scale(shape(f["geometry"]), xfact=KX, yfact=KY, origin=(0, 0)).buffer(30)
    for i in tree.query(g):
        if g.contains(npts[i]):
            park.add(nodes[i])
src["park"] = park
print({k: len(v) for k, v in src.items()})

# ---------- Dijkstra: profil × xidmət ----------
reach = {}
for prof, P in PROFILES.items():
    w = weight_fn(prof)
    cut = P["speed"] * MIN
    for svc in set(P["basket"]):
        s = src[svc] if prof in ("adult", "elderly") else {n for n in src[svc] if n not in under_nodes}
        reach[(prof, svc)] = nx.multi_source_dijkstra_path_length(G, s, cutoff=cut, weight=w)
    print(prof, "hazır")
# Uşaq: məktəbə 10 dəq, 70 m/dəq
reach[("child", "school")] = nx.multi_source_dijkstra_path_length(G, src["school"], cutoff=700, weight=lambda a, b, d: d["len"])

# ---------- Bloklar ----------
A = json.load(open(DATA / "baku_analysis.json"))
ray = {r["rayon"]: r for r in A["rayons"]}
OLD, CHILD = A["city"]["old_pct_city"] / 100, A["city"]["child_pct_city"] / 100
Z = json.load(open(DATA / "zoning.json"))
zinfo = {z["rank"]: z for z in Z["zones"]}
blocks = []
for f in json.load(open(DATA / "zoning_blocks.geojson"))["features"]:
    p = f["properties"]
    c = scale(shape(f["geometry"]).centroid, xfact=KX, yfact=KY, origin=(0, 0))
    i = tree.nearest(c)
    snap = c.distance(npts[i])
    n = nodes[i] if snap <= SNAP_BLOCK else None
    b = {"bid": p["bid"], "pop": p["pop"], "rayon": p["rayon"], "zone": p.get("zone_rank"), "lst": p.get("lst"), "slope": p.get("slope")}
    for prof, P in PROFILES.items():
        cut = P["speed"] * MIN
        got = []
        for svc in P["basket"]:
            d = reach[(prof, svc)].get(n) if n is not None else None
            if prof in ("wheel", "stroller") and n in under_nodes:
                d = None
            # bağlanma məsafəsi profilin sürəti ilə
            ok = d is not None and d + snap <= cut
            got.append(ok)
        b[prof] = got
    d = reach[("child", "school")].get(n) if n is not None else None
    b["school_ok"] = d is not None and d + snap <= 700
    blocks.append(b)

rpop = defaultdict(float)
for b in blocks:
    rpop[b["rayon"]] += b["pop"]
for b in blocks:
    r = ray[b["rayon"]]
    b["disabled"] = (r.get("disabled") or 0) * b["pop"] / rpop[b["rayon"]]

pop_total = sum(b["pop"] for b in blocks)

# Uşaq məktəb riski: ən yaxın məktəb yüksək risklidirsə
sch_pts = [Point(xy(*f["geometry"]["coordinates"])) for f in schools if f["properties"]["kind"] == "school"]
sch_lvl = [f["properties"]["level"] for f in schools if f["properties"]["kind"] == "school"]
stree = STRtree(sch_pts)
for b, f in zip(blocks, json.load(open(DATA / "zoning_blocks.geojson"))["features"]):
    c = scale(shape(f["geometry"]).centroid, xfact=KX, yfact=KY, origin=(0, 0))
    b["school_risk"] = sch_lvl[stree.nearest(c)] == "yüksək"


def pct(cond, weight="pop"):
    tot = sum(b[weight] for b in blocks)
    return round(100 * sum(b[weight] for b in blocks if cond(b)) / tot, 1)


# ---------- Şəhər göstəriciləri ----------
profiles_out = {}
for prof, P in PROFILES.items():
    per = {}
    for j, svc in enumerate(P["basket"]):
        per[svc] = pct(lambda b, j=j, prof=prof: b[prof][j])
    profiles_out[prof] = {
        "name": P["name"], "speed": P["speed"], "reach_m": P["speed"] * MIN, "basket": P["basket"], "services": per,
        "full": pct(lambda b, prof=prof: all(b[prof])),
        "none": pct(lambda b, prof=prof: not any(b[prof])),
        "avg": round(sum(b["pop"] * sum(b[prof]) for b in blocks) / pop_total, 2),
    }
# Qrup üzrə təsir (insan sayı)
old_total = round(pop_total * OLD)
dis_total = round(sum(b["disabled"] for b in blocks))
child_total = round(pop_total * CHILD)


def lacking(prof, svc, weight):
    j = PROFILES[prof]["basket"].index(svc)
    return round(sum(weight(b) for b in blocks if not b[prof][j]))


groups = {
    "elderly": {
        "name": "Yaşlılar", "total": old_total,
        "no_pharmacy": lacking("elderly", "pharmacy", lambda b: b["pop"] * OLD),
        "no_health": lacking("elderly", "health", lambda b: b["pop"] * OLD),
        "no_transit": lacking("elderly", "transit", lambda b: b["pop"] * OLD),
        "no_full": round(sum(b["pop"] * OLD for b in blocks if not all(b["elderly"]))),
    },
    "disabled": {
        "name": "Əlilliyi olan şəxslər", "total": dis_total,
        "no_transit": lacking("wheel", "transit", lambda b: b["disabled"]),
        "no_health": lacking("wheel", "health", lambda b: b["disabled"]),
        "no_pharmacy": lacking("wheel", "pharmacy", lambda b: b["disabled"]),
        "no_full": round(sum(b["disabled"] for b in blocks if not all(b["wheel"]))),
    },
    "children": {
        "name": "Uşaqlar", "total": child_total,
        "no_school": round(sum(b["pop"] * CHILD for b in blocks if not b["school_ok"])),
        "risky_school": round(sum(b["pop"] * CHILD for b in blocks if b["school_risk"])),
        "no_kinder_stroller": lacking("stroller", "kinder", lambda b: b["pop"] * CHILD),
    },
}
gap = {
    "adult_full": profiles_out["adult"]["full"],
    "elderly_full": profiles_out["elderly"]["full"],
    "wheel_full": profiles_out["wheel"]["full"],
    "stroller_full": profiles_out["stroller"]["full"],
}
barriers = {
    "underpasses": len(under_pts),
    "under_nodes": len(under_nodes),
    "steep8_km": round(steep8 / 1000),
    "steep58_km": round(steep58 / 1000),
    "network_km": round(total_len / 1000),
    "steep8_pct": round(100 * steep8 / total_len, 1),
    "wheel_isolated_pct": profiles_out["wheel"]["none"],
}

# ---------- Rayonlar ----------
rays = []
for r in sorted(rpop):
    bs = [b for b in blocks if b["rayon"] == r]
    P_ = sum(b["pop"] for b in bs)
    row = {"rayon": r, "pop": round(P_)}
    for prof in PROFILES:
        row[prof] = round(100 * sum(b["pop"] for b in bs if all(b[prof])) / P_, 1)
    row["gap"] = round(row["adult"] - row["wheel"], 1)
    row["disabled"] = round(sum(b["disabled"] for b in bs))
    rays.append(row)
rays.sort(key=lambda x: x["wheel"])

# ---------- Zonalar: inklüziv əlçatanlıq balı və tədbirlər ----------
INTERVENTION = {
    "transit": ("E", "Əlçatan dayanacaq: alçaq bordür, örtük, oturacaq, 300 m-də"),
    "pharmacy": ("G", "Birinci mərtəbədə aptek / mobil aptek"),
    "health": ("G", "Səhiyyə məntəqəsi və ya səyyar həkim günü"),
    "grocery": ("G", "Ərzaq: birinci mərtəbə, həftəlik bazar"),
    "park": ("D", "Cib parkı: kölgə, oturacaq, su"),
    "kinder": ("G", "Bağça və ya uşaq meydançası"),
}
zb = defaultdict(list)
for b in blocks:
    if b["zone"] is not None:
        zb[b["zone"]].append(b)
under_by_zone = defaultdict(int)
zgeo = {f["properties"]["rank"]: shape(f["geometry"]) for f in json.load(open(DATA / "zoning_zones.geojson"))["features"]}
zkeys = list(zgeo)
ztree = STRtree([zgeo[k] for k in zkeys])
for f in json.load(open(DATA / "underpasses.geojson"))["features"]:
    p = Point(f["geometry"]["coordinates"])
    for i in ztree.query(p):
        if zgeo[zkeys[i]].contains(p):
            under_by_zone[zkeys[i]] += 1
zones = []
for k, bs in zb.items():
    P_ = sum(b["pop"] for b in bs)
    if P_ < 500:
        continue
    sc = {}
    for prof in ("adult", "elderly", "wheel", "stroller"):
        sc[prof] = round(100 * sum(b["pop"] * sum(b[prof]) / len(b[prof]) for b in bs) / P_)
    inc = round((sc["elderly"] + sc["wheel"] + sc["stroller"]) / 3)
    vuln = P_ * (OLD + CHILD) + sum(b["disabled"] for b in bs)
    # ən çox çatmayan xidmət (əlil arabası profili)
    miss = {}
    for j, svc in enumerate(PROFILES["wheel"]["basket"]):
        miss[svc] = sum(b["pop"] for b in bs if not b["wheel"][j]) / P_
    kin = sum(b["pop"] for b in bs if not b["stroller"][0]) / P_
    miss["kinder"] = kin
    top = [s for s, v in sorted(miss.items(), key=lambda x: -x[1]) if v >= 0.4][:3]
    acts = [INTERVENTION[s] for s in top]
    z = zinfo.get(k, {})
    if under_by_zone[k]:
        acts.insert(0, ("A", f"{under_by_zone[k]} yeraltı keçid: yanında yerüstü zebra və ya lift"))
    slope = sum(b["pop"] * (b["slope"] or 0) for b in bs) / P_
    if slope >= 4:
        acts.append(("H", "Pandus, məhəccər, hər 50 m-də oturacaq"))
    if (z.get("lst") or 0) >= 43:
        acts.append(("C", "Kölgə: ağac sırası, örtüklü dayanacaq"))
    zones.append({
        "rank": k, "name": z.get("name", ""), "rayon": z.get("rayon", bs[0]["rayon"]), "pop": round(P_),
        "score": sc, "inc": inc, "gap": sc["adult"] - min(sc["wheel"], sc["elderly"]),
        "vuln_pop": round(vuln), "disabled": round(sum(b["disabled"] for b in bs)),
        "priority": round(vuln * (1 - inc / 100)), "missing": [SVC_NAME[s] for s in top], "underpasses": under_by_zone[k],
        "actions": [{"sol": s, "text": t} for s, t in acts][:5], "lst": z.get("lst"),
    })
zones.sort(key=lambda z: -z["priority"])
for i, z in enumerate(zones):
    z["pos"] = i + 1
pri_top = zones[:20]

# ---------- Ssenarilər: hədəflər üçün ----------
def evaluate(under_on=True, ramps=False, extra=None):
    """Profil üzrə tam səbət payı və qrup sayları; extra: {svc: set(node)} əlavə xidmət nöqtələri."""
    res = {}
    for prof in ("elderly", "wheel", "stroller"):
        P = PROFILES[prof]
        w = weight_fn(prof, under_on, ramps)
        cut = P["speed"] * MIN
        rr = {}
        for svc in set(P["basket"]):
            s0 = set(src[svc]) | set((extra or {}).get(svc, ()))
            if prof != "elderly" and under_on:
                s0 = {n for n in s0 if n not in under_nodes}
            rr[svc] = nx.multi_source_dijkstra_path_length(G, s0, cutoff=cut, weight=w)
        full_pop = full_dis = full_old = avg = 0.0
        per = defaultdict(float)
        for b in blocks:
            n = b["_node"]
            blocked = n is None or (prof != "elderly" and under_on and n in under_nodes)
            got = [(not blocked) and rr[svc].get(n) is not None and rr[svc][n] + b["_snap"] <= cut for svc in P["basket"]]
            for svc, g in zip(P["basket"], got):
                per[svc] += b["pop"] * g
            avg += b["pop"] * sum(got)
            if all(got):
                full_pop += b["pop"]
                full_dis += b["disabled"]
                full_old += b["pop"] * OLD
        res[prof] = {"full": round(100 * full_pop / pop_total, 1), "avg": round(avg / pop_total, 2), "disabled_ok": round(full_dis), "elderly_ok": round(full_old),
                     "services": {k: round(100 * v / pop_total, 1) for k, v in per.items()}}
    return res


# blokların qovşağı (bir dəfə)
for b, f in zip(blocks, json.load(open(DATA / "zoning_blocks.geojson"))["features"]):
    c = scale(shape(f["geometry"]).centroid, xfact=KX, yfact=KY, origin=(0, 0))
    i = tree.nearest(c)
    b["_snap"] = c.distance(npts[i])
    b["_node"] = nodes[i] if b["_snap"] <= SNAP_BLOCK else None

# Əlçatan məhəllə hub-u: prioritet zonanın əhali mərkəzinə ən yaxın qovşaqda bütün gündəlik xidmətlər bir nöqtədə
extra_nodes = set()
HUB_ZONES = 40
for z in zones[:HUB_ZONES]:
    bs = [b for b in zb[z["rank"]] if b["_node"] is not None]
    if not bs:
        continue
    cx = sum(b["_node"][0] * b["pop"] for b in bs) / sum(b["pop"] for b in bs)
    cy = sum(b["_node"][1] * b["pop"] for b in bs) / sum(b["pop"] for b in bs)
    extra_nodes.add(nodes[tree.nearest(Point(xy(cx, cy)))])
scen_defs = [
    ("base", "İndiki vəziyyət", dict()),
    ("under", "83 yeraltı keçid əlçatan (yanında zebra və ya lift)", dict(under_on=False)),
    ("ramps", "+ yamaclarda pandus və məhəccər", dict(under_on=False, ramps=True)),
    ("hubs", f"+ {HUB_ZONES} prioritet zonada əlçatan məhəllə hub-u (dayanacaq, aptek, feldşer, ərzaq, kölgəli meydança, bağça)",
     dict(under_on=False, ramps=True, extra={k: extra_nodes for k in ("transit", "pharmacy", "health", "grocery", "park", "kinder")})),
]
scenarios = []
for key, name, kw in scen_defs:
    r = evaluate(**kw)
    scenarios.append({"key": key, "name": name, **r})
    print("ssenari", key, r)

# Maneə qatı (marşrut yoxlaması üçün): yeraltı keçidlər və > 8% yamaclı kənarların orta nöqtələri
steep_pts = []
for a, b, d in G.edges(data=True):
    if d["grade"] > 0.08 and d["len"] >= 15:
        steep_pts.append([round((a[0] + b[0]) / 2, 5), round((a[1] + b[1]) / 2, 5), round(d["grade"] * 100)])
json.dump({
    "underpasses": [[round(c[0], 5), round(c[1], 5)] for c in (f["geometry"]["coordinates"] for f in json.load(open(DATA / "underpasses.geojson"))["features"])],
    "steep": steep_pts,
    "radius_m": UNDER_R,
}, open(DATA / "barriers_access.json", "w"), separators=(",", ":"))
print("dik nöqtə:", len(steep_pts))

out = {
    "profiles": profiles_out,
    "gap": gap,
    "groups": groups,
    "barriers": barriers,
    "scenarios": scenarios,
    "rayons": rays,
    "zones": zones,
    "summary": {
        "pop_total": round(pop_total),
        "top20_vuln_pop": sum(z["vuln_pop"] for z in pri_top),
        "top20_pop": sum(z["pop"] for z in pri_top),
        "services_n": {k: len(v) for k, v in src.items()},
    },
    "method": {
        "minutes": MIN,
        "profiles": "Orta piyada 80 m/dəq; yaşlı 60; əlil arabası 60; uşaq arabası 65 (tipik ədəbiyyat dəyərləri)",
        "barriers": f"Yamac SRTM (3×3 hamarlanmış, ≥ 40 m baza): > 8% əlil/uşaq arabası üçün keçilməz, 5–8% yavaşladır; {len(under_pts)} yeraltı keçidin {UNDER_R} m radiusu: əlil/uşaq arabası üçün keçilməz, yaşlı üçün ×3",
        "network": "OSM piyada şəbəkəsi (420 min qovşaq), çoxmənbəli Dijkstra, profil üzrə çəkili",
        "groups": "Yaşlı 6.4%, uşaq 19% (DSK, şəhər səviyyəsi), əlillik rayon üzrə DSK → bloka əhali payı ilə",
        "limits": "Pandus, lift, taktil plitə, səki eni və işıqlandırma datası yoxdur: maneələr proksidir, sahə auditi ilə dəqiqləşir. Görmə məhdudiyyətli profil hesablanmayıb.",
    },
}
json.dump(out, open(DATA / "inclusive_access.json", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump({str(b["bid"]): [sum(b["adult"]), sum(b["elderly"]), sum(b["wheel"]), sum(b["stroller"])] for b in blocks}, open(DATA / "inclusive_blocks.json", "w"), separators=(",", ":"))

for prof, P in profiles_out.items():
    print(f'{P["name"]:22s} tam səbət {P["full"]:5}%  heç biri {P["none"]:5}%  orta {P["avg"]}  {P["services"]}')
print("qruplar:", json.dumps(groups, ensure_ascii=False))
print("maneələr:", barriers)
for r in rays:
    print(r)
for z in zones[:10]:
    print(z["pos"], z["name"], z["rayon"], z["pop"], z["score"], "vuln", z["vuln_pop"], "pri", z["priority"], z["missing"], [a["sol"] for a in z["actions"]])
