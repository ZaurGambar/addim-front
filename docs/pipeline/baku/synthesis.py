"""Sintez: tematik qatların üst-üstə qoyulması, qaynar nöqtə (Getis-Ord Gi*) və məhəllə tipologiyası (k-means).

Giriş:  ../geojson/baku_grid.geojson (analysis.py), osm/roads.json, BakuBus dayanacaqları, metro,
        opendata yaşayış məntəqələri (adlandırma üçün)
Çıxış:  ../geojson/baku_synth.geojson — məskunlaşmış 1 km hücrələr + problem qatları, üst-üstə düşmə, Gi*, tip
        ../geojson/baku_synth.json    — tiplər, prioritet zonalar, rayon üzrə paylar, ən çox rast gələn birləşmələr
"""
import csv
import json
import math
import os
from collections import Counter, defaultdict

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "..", "geojson")
OD = os.path.join(HERE, "..", "opendata", "files")
MIN_POP = 300  # məskunlaşmış hücrə həddi (nəfər/km²)


def jload(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


grid = jload(os.path.join(G, "baku_grid.geojson"))
feats = [f for f in grid["features"] if f["properties"]["pop"] >= MIN_POP and f["properties"]["lst"] is not None]
print("məskunlaşmış hücrə:", len(feats), "/", len(grid["features"]))
ring0 = feats[0]["geometry"]["coordinates"][0]
dlon = abs(ring0[1][0] - ring0[0][0]) or abs(ring0[2][0] - ring0[0][0])
dlat = abs(ring0[2][1] - ring0[0][1])
minlon = min(f["geometry"]["coordinates"][0][0][0] for f in grid["features"])
minlat = min(f["geometry"]["coordinates"][0][0][1] for f in grid["features"])


def ij(lon, lat):
    return int(math.floor((lat - minlat) / dlat + 1e-9)), int(math.floor((lon - minlon) / dlon + 1e-9))


cell_at = {}
for k, f in enumerate(feats):
    r = f["geometry"]["coordinates"][0]
    cx, cy = (r[0][0] + r[2][0]) / 2, (r[0][1] + r[2][1]) / 2
    f["_c"] = (cx, cy)
    cell_at[ij(cx, cy)] = k

# ---- Yol şəbəkəsindən: dalan payı və magistral uzunluğu hücrə üzrə ----
deg = Counter()
major_m = defaultdict(float)
CAR = {"motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "pedestrian",
       "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"}
for e in jload(os.path.join(HERE, "osm", "roads.json"))["elements"]:
    hw = e["tags"]["highway"]
    gm = e.get("geometry") or []
    if len(gm) < 2 or hw not in CAR:
        continue
    pts = [(round(p["lon"], 6), round(p["lat"], 6)) for p in gm]
    deg[pts[0]] += 1
    deg[pts[-1]] += 1
    for p in pts[1:-1]:
        deg[p] += 2
    if hw.replace("_link", "") in ("motorway", "trunk", "primary"):
        kx = 111_320 * math.cos(math.radians(pts[0][1]))
        for a, b in zip(pts, pts[1:]):
            k = cell_at.get(ij((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))
            if k is not None:
                major_m[k] += math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * 111_320)
dead, inter = Counter(), Counter()
for p, d in deg.items():
    k = cell_at.get(ij(*p))
    if k is None:
        continue
    if d == 1:
        dead[k] += 1
    elif d >= 3:
        inter[k] += 1

# ---- Nəqliyyata məsafə ----
stops = []
for r in list(csv.reader(open(os.path.join(OD, "bakubus-mmc-ye-mexsus-avtobus-marsrutlari-uzre-dayanacaqlarin-cografi-koordinatl", "dayanacaqlar.csv"), encoding="utf-8-sig")))[1:]:
    try:
        stops.append((float(r[3]), float(r[4])))
    except (ValueError, IndexError):
        pass
metro = [tuple(f["geometry"]["coordinates"]) for f in jload(os.path.join(G, "metro.geojson"))["features"] if f["properties"]["status"] == "işləyir"]
S = np.array(stops + metro)
kx = 111_320 * math.cos(math.radians(40.4))

# ---- Yaşayış məntəqələri: zonaları adlandırmaq üçün ----
places = []
for f in jload(os.path.join(OD, "azerbaycanin-seherleri-ve-inzibati-erazi-vahidleri", "azrbaycann_hrlri_v_inzibati_razi_vahidlri.geojson"))["features"]:
    lon, lat = f["geometry"]["coordinates"][:2]
    if 49.3 < lon < 50.8 and 39.9 < lat < 40.8:
        places.append((lon, lat, f["properties"].get("NAME_AZ") or f["properties"].get("NAME")))
for f in jload(os.path.join(G, "metro.geojson"))["features"]:
    if f["properties"]["status"] != "işləyir":
        continue
    lon, lat = f["geometry"]["coordinates"]
    places.append((lon, lat, f["properties"]["name"].replace(" st.", "") + " m."))


def place_name(lon, lat):
    best = min(places, key=lambda p: (p[0] - lon) ** 2 * (kx / 111_320) ** 2 + (p[1] - lat) ** 2)
    return best[2]


# ---- Problem qatları (yüksək = insanyönümlü şəhər üçün pis) ----
def rank01(v):
    v = np.asarray(v, float)
    order = v.argsort().argsort()
    return order / (len(v) - 1)


P = defaultdict(list)
raw = defaultdict(list)
for k, f in enumerate(feats):
    p = f["properties"]
    cx, cy = f["_c"]
    dmin = float(np.min(np.hypot((S[:, 0] - cx) * kx, (S[:, 1] - cy) * 111_320)))
    raw["heat"].append(p["lst"])
    raw["green_gap"].append(-(p["ndvi"] or 0))
    raw["transit_gap"].append(dmin)
    raw["fragment"].append(dead[k] / max(1, dead[k] + inter[k]) if dead[k] + inter[k] >= 5 else 0.5)
    raw["car"].append(major_m[k])
    raw["slope"].append(p["slope"] or 0)
    raw["lowland"].append(-(p["elev"] if p["elev"] is not None else 0))
    raw["service_gap"].append(-p["poi"] / max(1, p["pop"]) * 1000)
    p.update({"transit_m": round(dmin), "deadend": round(100 * dead[k] / max(1, dead[k] + inter[k])) if dead[k] + inter[k] >= 5 else None,
              "major_m": round(major_m[k]), "place": place_name(cx, cy)})
LAYERS = {
    "heat": "İstilik stressi", "green_gap": "Yaşıllıq çatışmazlığı", "transit_gap": "Nəqliyyat boşluğu", "fragment": "Şəbəkə qırıqlığı",
    "car": "Avtomobil hökmranlığı", "slope": "Relyef maneəsi", "lowland": "Alçaq sahil riski", "service_gap": "Xidmət çatışmazlığı",
}
for key in LAYERS:
    P[key] = rank01(raw[key])
# alçaq sahil: yalnız −20 m-dən aşağı hücrələr risklidir; nəqliyyat: 500 m-dən yaxın problem deyil
P["lowland"] = np.array([1.0 if -v < -20 else 0.0 for v in raw["lowland"]]) * 0.5 + 0.5 * P["lowland"] * np.array([1.0 if -v < 0 else 0.3 for v in raw["lowland"]])
P["transit_gap"] = np.where(np.array(raw["transit_gap"]) <= 500, P["transit_gap"] * 0.3, P["transit_gap"])

M = np.vstack([P[k] for k in LAYERS]).T  # n × 8
worst = M >= 2 / 3
overlap = worst.sum(axis=1)
pop = np.array([f["properties"]["pop"] for f in feats], float)
expo = np.log10(pop) / np.log10(pop.max())
need = 100 * M.mean(axis=1) * (0.5 + 0.5 * expo)

# ---- Getis-Ord Gi* (8 qonşu + özü, ikili çəki) ----
n = len(feats)
xbar, s = need.mean(), need.std()
gi = np.zeros(n)
for k, f in enumerate(feats):
    i, j = ij(*f["_c"])
    nb = [cell_at[(i + a, j + b)] for a in (-1, 0, 1) for b in (-1, 0, 1) if (i + a, j + b) in cell_at]
    w = len(nb)
    num = need[nb].sum() - xbar * w
    den = s * math.sqrt((n * w - w * w) / (n - 1))
    gi[k] = num / den if den else 0
gi_cls = np.where(gi >= 2.58, 3, np.where(gi >= 1.96, 2, np.where(gi >= 1.65, 1, np.where(gi <= -2.58, -3, np.where(gi <= -1.96, -2, np.where(gi <= -1.65, -1, 0))))))

# ---- K-means tipologiya ----
TV = {
    "density": np.log10(pop), "poi": np.log1p([f["properties"]["poi"] for f in feats]), "inter": np.log1p([inter[k] for k in range(n)]),
    "deadend": np.array(raw["fragment"]), "lst": np.array(raw["heat"]), "ndvi": -np.array(raw["green_gap"]),
    "slope": np.array(raw["slope"]), "transit": np.log1p(raw["transit_gap"]), "major": np.log1p(raw["car"]),
}
X = np.vstack([(v - np.mean(v)) / (np.std(v) or 1) for v in TV.values()]).T
rng = np.random.default_rng(42)


def kmeans(X, k, iters=200, restarts=12):
    best = None
    for _ in range(restarts):
        c = [X[rng.integers(len(X))]]
        for _ in range(1, k):
            d = np.min([((X - ci) ** 2).sum(1) for ci in c], axis=0)
            c.append(X[rng.choice(len(X), p=d / d.sum())])
        c = np.array(c)
        for _ in range(iters):
            lab = np.argmin(((X[:, None, :] - c[None]) ** 2).sum(2), axis=1)
            nc = np.array([X[lab == i].mean(0) if (lab == i).any() else c[i] for i in range(k)])
            if np.allclose(nc, c):
                break
            c = nc
        inertia = ((X - c[lab]) ** 2).sum()
        if best is None or inertia < best[0]:
            best = (inertia, lab, c)
    return best


scores = {}
for k in range(3, 9):
    inertia, lab, c = kmeans(X, k)
    # silhouette (sürətli, nümunə ilə)
    idx = rng.choice(n, min(n, 600), replace=False)
    D = np.sqrt(((X[idx, None, :] - X[None, idx, :]) ** 2).sum(2))
    L = lab[idx]
    sil = []
    for a in range(len(idx)):
        same = D[a, L == L[a]]
        aa = same.sum() / max(1, len(same) - 1)
        bb = min(D[a, L == o].mean() for o in set(L) if o != L[a])
        sil.append((bb - aa) / max(aa, bb))
    scores[k] = (round(float(np.mean(sil)), 3), inertia)
    print("k", k, "silhouette", scores[k][0])
K = max((k for k in scores if 4 <= k <= 7), key=lambda k: scores[k][0])  # 4–7 arasında ən yüksək silhouette
_, lab, cent = kmeans(X, K)
keys = list(TV)
prof = []
for c in range(K):
    m = lab == c
    prof.append({
        "id": c, "cells": int(m.sum()), "pop": int(pop[m].sum()),
        "z": {kk: round(float(cent[c][i]), 2) for i, kk in enumerate(keys)},
        "mean": {"density": int(np.mean(pop[m])), "poi": round(float(np.mean([feats[i]["properties"]["poi"] for i in np.where(m)[0]])), 1),
                 "lst": round(float(np.mean(np.array(raw["heat"])[m])), 1), "ndvi": round(float(np.mean(-np.array(raw["green_gap"])[m])), 3),
                 "slope": round(float(np.mean(np.array(raw["slope"])[m])), 1), "transit_m": int(np.mean(np.array(raw["transit_gap"])[m])),
                 "deadend": round(100 * float(np.mean(np.array(raw["fragment"])[m]))), "need": round(float(need[m].mean()), 1),
                 "hot_share": round(100 * float((gi_cls[m] >= 2).mean()), 1)},
        "rayons": Counter(feats[i]["properties"]["rayon"] for i in np.where(m)[0]).most_common(4),
        "places": Counter(feats[i]["properties"]["place"] for i in np.where(m)[0]).most_common(5),
    })

# Tipləri profilə görə adlandır (k-means etiket sırası təsadüfidir)
codes = {}
rest = list(range(K))
for code, key, sign in (("nucleus", "density", 1), ("slope", "slope", 1), ("periphery", "transit", 1)):
    c = max(rest, key=lambda i: sign * cent[i][keys.index(key)])
    codes[c] = code
    rest.remove(c)
for c in rest:
    codes[c] = "suburb" if len(rest) == 1 else f"suburb{rest.index(c) + 1}"
for t_ in prof:
    t_["code"] = codes[t_["id"]]

# ---- Prioritet zonalar: bitişik qaynar nöqtə klasterləri ----
hot = {k for k in range(n) if gi_cls[k] >= 2}
zones, seen = [], set()
for k in sorted(hot, key=lambda x: -need[x]):
    if k in seen:
        continue
    comp, stack = [], [k]
    seen.add(k)
    while stack:
        a = stack.pop()
        comp.append(a)
        i, j = ij(*feats[a]["_c"])
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                b = cell_at.get((i + di, j + dj))
                if b is not None and b in hot and b not in seen:
                    seen.add(b)
                    stack.append(b)
    zp = pop[comp].sum()
    lay = {LAYERS[key]: round(float(np.mean([P[key][c] for c in comp])) * 100) for key in LAYERS}
    top3 = sorted(lay.items(), key=lambda x: -x[1])[:3]
    cx = float(np.average([feats[c]["_c"][0] for c in comp], weights=pop[comp]))
    cy = float(np.average([feats[c]["_c"][1] for c in comp], weights=pop[comp]))
    zones.append({"cells": len(comp), "pop": int(zp), "need": round(float(need[comp].mean()), 1), "lon": round(cx, 4), "lat": round(cy, 4),
                  "place": place_name(cx, cy), "rayons": Counter(feats[c]["properties"]["rayon"] for c in comp).most_common(3),
                  "top_layers": top3, "overlap_mean": round(float(overlap[comp].mean()), 1)})
zones.sort(key=lambda z: -z["pop"] * z["need"])
for rank, z in enumerate(zones, 1):
    z["rank"] = rank
zone_of = {}
for z in zones:
    pass

# Ən çox rast gələn üst-üstə düşmə birləşmələri (≥3 qat, əhali ilə çəkili)
combo = Counter()
for k in range(n):
    names = tuple(LAYERS[key] for key, w in zip(LAYERS, worst[k]) if w)
    if len(names) >= 3:
        for a in range(len(names)):
            for b in range(a + 1, len(names)):
                for c in range(b + 1, len(names)):
                    combo[(names[a], names[b], names[c])] += pop[k]
pair = Counter()
for k in range(n):
    names = [LAYERS[key] for key, w in zip(LAYERS, worst[k]) if w]
    for a in range(len(names)):
        for b in range(a + 1, len(names)):
            pair[(names[a], names[b])] += 1

# Rayon üzrə paylar
ray = defaultdict(lambda: {"cells": 0, "pop": 0.0, "hot_pop": 0.0, "cold_pop": 0.0, "overlap_pop": 0.0, "need_w": 0.0})
for k, f in enumerate(feats):
    r = f["properties"]["rayon"] or "—"
    d = ray[r]
    d["cells"] += 1
    d["pop"] += pop[k]
    d["need_w"] += need[k] * pop[k]
    if gi_cls[k] >= 2:
        d["hot_pop"] += pop[k]
    if gi_cls[k] <= -2:
        d["cold_pop"] += pop[k]
    if overlap[k] >= 4:
        d["overlap_pop"] += pop[k]
ray_out = [{"rayon": r, "cells": d["cells"], "pop": int(d["pop"]), "need": round(d["need_w"] / d["pop"], 1),
            "hot_pct": round(100 * d["hot_pop"] / d["pop"], 1), "cold_pct": round(100 * d["cold_pop"] / d["pop"], 1),
            "overlap4_pct": round(100 * d["overlap_pop"] / d["pop"], 1)} for r, d in ray.items()]
ray_out.sort(key=lambda x: -x["need"])

# ---- Çıxış ----
out_feats = []
for k, f in enumerate(feats):
    p = f["properties"]
    p.update({f"p_{key}": round(float(P[key][k]) * 100) for key in LAYERS})
    p.update({"overlap": int(overlap[k]), "need": round(float(need[k]), 1), "gi": round(float(gi[k]), 2), "gi_cls": int(gi_cls[k]), "type": int(lab[k])})
    out_feats.append({"type": "Feature", "geometry": f["geometry"], "properties": p})
with open(os.path.join(G, "baku_synth.geojson"), "w", encoding="utf-8") as fh:
    json.dump({"type": "FeatureCollection", "features": out_feats}, fh, ensure_ascii=False, separators=(",", ":"))
summary = {
    "cells": n, "min_pop": MIN_POP, "pop": int(pop.sum()), "layers": LAYERS,
    "silhouette": {str(k): v[0] for k, v in scores.items()}, "k": K, "types": prof,
    "zones": zones[:12], "zones_total": len(zones),
    "hot_cells": int((gi_cls >= 2).sum()), "hot_pop": int(pop[gi_cls >= 2].sum()),
    "cold_cells": int((gi_cls <= -2).sum()), "cold_pop": int(pop[gi_cls <= -2].sum()),
    "overlap_hist": [int((overlap == i).sum()) for i in range(9)],
    "overlap_pop": [int(pop[overlap == i].sum()) for i in range(9)],
    "top_combos": [{"layers": list(c), "pop": int(v)} for c, v in combo.most_common(6)],
    "top_pairs": [{"layers": list(c), "cells": v} for c, v in pair.most_common(8)],
    "rayons": ray_out,
}
summary["rayons"] = [{k: (float(v) if isinstance(v, np.floating) else v) for k, v in r.items()} for r in ray_out]
json.dump(summary, open(os.path.join(G, "baku_synth.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("hot", summary["hot_cells"], summary["hot_pop"], "cold", summary["cold_cells"], summary["cold_pop"])
print("overlap pop", summary["overlap_pop"])
for t in prof:
    print("TYPE", t["id"], t["cells"], t["pop"], t["mean"], t["rayons"][:3], t["places"][:3])
for z in zones[:10]:
    print("ZONE", z["rank"], z["place"], z["cells"], z["pop"], z["need"], z["rayons"], z["top_layers"])
for c in summary["top_combos"]:
    print("COMBO", c)
for r in ray_out:
    print("RAY", r)
