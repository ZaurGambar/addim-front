"""Sintezi (baku_synth.*) yeni Landsat LST/NDVI dəyərlərinə keçirir.

Orijinal synthesis.py repoda yoxdur. Onun addımları fayllardan bərpa olunub və
--check rejimində köhnə faylları təkrar etdiyi yoxlanılıb. Hər addımda fərq üsulu
istifadə olunur: hücrə yalnız yeni data səbəbindən dəyişir, üsul fərqindən dəyişmir.

1. lst, ndvi: baku_grid.geojson-dan (update_landsat.py artıq yeniləyib).
2. p_heat, p_green_gap: 701 hücrə arasında sıra faizi, rank/(n-1).
   p_yeni = p_köhnə + (sıra_yeni - sıra_köhnə).
3. overlap: ən pis üçdə birlikdə olan qatların sayı (p >= 66.7).
4. need = 8 qatın ortası x f(əhali) (f fayldan bərpa olunmur):
   need_yeni = need_köhnə x orta_yeni / orta_köhnə.
5. Gi*: need üzərində, 1.5 km (8 qonşu + hücrənin özü);
   gi_yeni = gi_köhnə + (z_yeni - z_köhnə). Siniflər: 1.645 / 1.96 / 2.576.
6. Tip: k-means mərkəzlərinə ən yaxın (log1p sıxlıq, POI, kəsişmə, nəqliyyat,
   magistral; z-standart). Tip yalnız yeni lst/ndvi ilə proqnoz dəyişəndə dəyişir.
7. Cəmlər: qaynar/soyuq nöqtələr, problem sayı, kombinasiyalar, cütlər, tiplər,
   prioritet zonalar (qonşu Gi* >= 95% hücrələr, sıra: əhali x ehtiyac), rayonlar.

  python3 scripts/update_synthesis.py --check   # cəmləri köhnə hücrələrdən təkrar edir
  python3 scripts/update_synthesis.py           # yeniləyir
"""

import collections
import itertools
import json
import math
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "public" / "data"
KEYS = ["heat", "green_gap", "transit_gap", "fragment", "car", "slope", "lowland", "service_gap"]
WORST = 200 / 3
ZONE_MIN_POP = 1000
LOG_FEATS = {"density", "poi", "inter", "transit", "major"}
COLS = {"density": "pop", "poi": "poi", "inter": "inter", "deadend": "deadend", "lst": "lst",
        "ndvi": "ndvi", "slope": "slope", "transit": "transit_m", "major": "major_m"}
# 67-yə yuvarlaqlaşdırılmış iki hücrə: köhnə kombinasiyaları dəqiq verən variant
FLAG_OVERRIDES = {1933: {"transit_gap"}, 2095: {"green_gap"}}


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def save(name, data):
    fmt = {"indent": 1} if name.endswith(".json") else {"separators": (",", ":")}
    (DATA / name).write_text(json.dumps(data, ensure_ascii=False, **fmt), encoding="utf-8")


def ranks(vals):
    """Orta sıra (bərabər dəyərlərə eyni sıra), 0..100."""
    order = sorted(range(len(vals)), key=lambda i: vals[i])
    r = [0.0] * len(vals)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and vals[order[j + 1]] == vals[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = 100 * ((i + j) / 2) / (len(vals) - 1)
        i = j + 1
    return r


def flags_from_file(c):
    sure = {k for k in KEYS if c["p_" + k] >= 68}
    edge = [k for k in KEYS if c["p_" + k] == 67]
    need = c["overlap"] - len(sure)
    if need == len(edge):
        return sure | set(edge)
    if need == 0:
        return sure
    return sure | FLAG_OVERRIDES[c["id"]]


def utm(lon, lat):
    """WGS84 -> təxmini metr (yerli ekvidistant proyeksiya, Gi* qonşuluğu üçün kifayətdir)."""
    return lon * 111320 * math.cos(math.radians(40.4)), lat * 110574


def centroid(geom):
    pts = geom["coordinates"][0][:-1]
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def neighbours(feats):
    xy = [utm(*centroid(f["geometry"])) for f in feats]
    nb = []
    for i, (x, y) in enumerate(xy):
        nb.append([j for j, (u, v) in enumerate(xy) if (x - u) ** 2 + (y - v) ** 2 <= 1500 ** 2])
    return nb


def gistar(x, nb):
    n = len(x)
    xb = sum(x) / n
    s = math.sqrt(sum(v * v for v in x) / n - xb * xb)
    out = []
    for js in nb:
        w = len(js)
        num = sum(x[j] for j in js) - xb * w
        den = s * math.sqrt((n * w - w * w) / (n - 1))
        out.append(num / den)
    return out


def gi_class(z):
    a = abs(z)
    c = 3 if a >= 2.576 else 2 if a >= 1.96 else 1 if a >= 1.645 else 0
    return c if z > 0 else -c


def type_features(cells, names):
    cols = []
    for f in names:
        vals = [c[COLS[f]] for c in cells]
        good = [v for v in vals if v is not None]
        fill = sum(good) / len(good)
        a = [fill if v is None else v for v in vals]
        if f in LOG_FEATS:
            a = [math.log1p(v) for v in a]
        m = sum(a) / len(a)
        sd = math.sqrt(sum((v - m) ** 2 for v in a) / len(a))
        cols.append([(v - m) / sd for v in a])
    return [list(r) for r in zip(*cols)]


def nearest(Z, centers):
    return [min(centers, key=lambda t: sum((a - b) ** 2 for a, b in zip(z, t[1])))[0] for z in Z]


def mode_place(cs):
    # əhaliyə görə çəkili ən çox rast gəlinən ad (köhnə 12 zonadan 11-ni verir;
    # köhnə zona ilə eyni hücrələrdən ibarət zona köhnə adını saxlayır)
    w = collections.Counter()
    for c in cs:
        w[c["place"]] += c["pop"]
    return max(w.items(), key=lambda kv: kv[1])[0]


def top(counter, n):
    return [[k, v] for k, v in sorted(counter.items(), key=lambda kv: -kv[1])[:n]]


def aggregate(S, feats, flags):
    """baku_synth.json cəmlərini hücrələrdən qurur."""
    sc = [f["properties"] for f in feats]
    L = S["layers"]
    S["pop"] = sum(c["pop"] for c in sc)
    S["hot_cells"] = sum(c["gi_cls"] >= 2 for c in sc)
    S["hot_pop"] = sum(c["pop"] for c in sc if c["gi_cls"] >= 2)
    S["cold_cells"] = sum(c["gi_cls"] <= -2 for c in sc)
    S["cold_pop"] = sum(c["pop"] for c in sc if c["gi_cls"] <= -2)
    hist, hpop = [0] * len(S["overlap_hist"]), [0] * len(S["overlap_pop"])
    for c in sc:
        hist[c["overlap"]] += 1
        hpop[c["overlap"]] += c["pop"]
    S["overlap_hist"], S["overlap_pop"] = hist, hpop

    def best(size, field, n, old):
        order = {tuple(x["layers"]): i for i, x in enumerate(old)}
        rows = []
        for ks in itertools.combinations(KEYS, size):
            sel = [c for c in sc if set(ks) <= flags[c["id"]]]
            val = sum(c["pop"] for c in sel) if field == "pop" else len(sel)
            rows.append({"layers": [L[k] for k in ks], field: val})
        rows.sort(key=lambda r: (-r[field], order.get(tuple(r["layers"]), 999)))
        return rows[:n]

    S["top_combos"] = best(3, "pop", len(S["top_combos"]), S["top_combos"])
    S["top_pairs"] = best(2, "cells", len(S["top_pairs"]), S["top_pairs"])

    for t in S["types"]:
        cs = [c for c in sc if c["type"] == t["id"]]
        mean = lambda k, d: round(sum(c[k] for c in cs if c[k] is not None) / len([c for c in cs if c[k] is not None]), d)
        t["cells"], t["pop"] = len(cs), sum(c["pop"] for c in cs)
        t["mean"].update(
            density=int(sum(c["pop"] for c in cs) / len(cs)), poi=mean("poi", 1), lst=mean("lst", 1),
            ndvi=mean("ndvi", 3), slope=mean("slope", 1), transit_m=int(mean("transit_m", 6)),
            deadend=int(round(mean("deadend", 6))), need=mean("need", 1),
            hot_share=round(100 * sum(c["gi_cls"] >= 2 for c in cs) / len(cs), 1))
        t["rayons"] = top(collections.Counter(c["rayon"] for c in cs), len(t["rayons"]))
        t["places"] = top(collections.Counter(c["place"] for c in cs), len(t["places"]))

    rows = []
    for r, cs in itertools.groupby(sorted(sc, key=lambda c: c["rayon"]), key=lambda c: c["rayon"]):
        cs = list(cs)
        P = sum(c["pop"] for c in cs)
        pct = lambda f: round(100 * sum(c["pop"] for c in cs if f(c)) / P, 1)
        rows.append({"rayon": r, "cells": len(cs), "pop": P, "need": round(sum(c["need"] * c["pop"] for c in cs) / P, 1),
                     "hot_pct": pct(lambda c: c["gi_cls"] >= 2), "cold_pct": pct(lambda c: c["gi_cls"] <= -2),
                     "overlap4_pct": pct(lambda c: c["overlap"] >= 4)})
    old_order = {r["rayon"]: i for i, r in enumerate(S["rayons"])}
    rows.sort(key=lambda r: (-r["need"], old_order.get(r["rayon"], 99)))
    S["rayons"] = rows

    # prioritet zonalar
    hot = [(f["properties"], centroid(f["geometry"])) for f in feats if f["properties"]["gi_cls"] >= 2]
    seen, comps = set(), []
    for c in hot:
        if c[0]["id"] in seen:
            continue
        stack, comp = [c], []
        seen.add(c[0]["id"])
        while stack:
            a = stack.pop()
            comp.append(a)
            for b in hot:
                if b[0]["id"] not in seen and abs(a[1][0] - b[1][0]) / 0.0118 < 1.5 and abs(a[1][1] - b[1][1]) / 0.009 < 1.5:
                    seen.add(b[0]["id"])
                    stack.append(b)
        comps.append(comp)
    S["zones_total"] = len(comps)
    zones = []
    for comp in comps:
        cs = [x[0] for x in comp]
        P = sum(c["pop"] for c in cs)
        if P < ZONE_MIN_POP:
            continue
        lay = sorted(((L[k], round(sum(c["p_" + k] for c in cs) / len(cs))) for k in KEYS), key=lambda t: -t[1])[:3]
        zones.append({
            "ids": sorted(c["id"] for c in cs),
            "cells": len(cs), "pop": P, "need": round(sum(c["need"] for c in cs) / len(cs), 1),
            "lon": round(sum(x[1][0] * x[0]["pop"] for x in comp) / P, 4),
            "lat": round(sum(x[1][1] * x[0]["pop"] for x in comp) / P, 4),
            "place": mode_place(cs),
            "rayons": top(collections.Counter(c["rayon"] for c in cs if c["rayon"] != "—"), 3),
            "top_layers": [list(t) for t in lay],
            "overlap_mean": round(sum(c["overlap"] for c in cs) / len(cs), 1),
        })
    S["zones"] = zones
    finish_zones(S)


def finish_zones(S):
    S["zones"].sort(key=lambda z: -z["pop"] * z["need"])
    seen = collections.Counter()
    for i, z in enumerate(S["zones"], 1):
        z["rank"] = i
        seen[z["place"]] += 1
        if seen[z["place"]] > 1:  # eyni adlı ikinci zona
            z["place"] = f"{z['place']} {seen[z['place']]}"


def diff(a, b, path=""):
    if isinstance(a, dict) and isinstance(b, dict):
        return [d for k in set(a) | set(b) for d in diff(a.get(k), b.get(k), f"{path}.{k}")]
    if isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        return [d for i, (x, y) in enumerate(zip(a, b)) for d in diff(x, y, f"{path}[{i}]")]
    return [] if a == b else [f"{path}: {a!r} != {b!r}"]


def main(check):
    S = load("baku_synth.json")
    geo = load("baku_synth.geojson")
    feats = geo["features"]
    sc = [f["properties"] for f in feats]
    flags = {c["id"]: flags_from_file(c) for c in sc}
    before_feats = json.loads(json.dumps(feats))
    before_flags = {k: set(v) for k, v in flags.items()}

    if check:
        old = json.loads(json.dumps(S))
        aggregate(S, feats, flags)
        for z in S["zones"]:
            z.pop("ids", None)
        d = diff(old, S)
        print(f"baku_synth.json: {len(d)} fərq", *d[:15], sep="\n  ")
        return 1 if d else 0

    C = load("baku_analysis.json")["city"]
    scene = C["landsat_scene"]
    if S.get("landsat_scene") == scene:
        raise SystemExit(f"Sintez artıq {scene} şəklindədir.")
    grid = {f["properties"]["id"]: f["properties"] for f in load("baku_grid.geojson")["features"]}

    old_lst, old_ndvi = [c["lst"] for c in sc], [c["ndvi"] for c in sc]
    new_lst = [grid[c["id"]]["lst"] for c in sc]
    new_ndvi = [grid[c["id"]]["ndvi"] for c in sc]

    # 2. faizlər (sıra fərqi)
    rh0, rh1 = ranks(old_lst), ranks(new_lst)
    rg0, rg1 = ranks([-v for v in old_ndvi]), ranks([-v for v in new_ndvi])
    mean0 = [sum(c["p_" + k] for k in KEYS) / len(KEYS) for c in sc]
    p_new = {}
    for i, c in enumerate(sc):
        ph = min(100.0, max(0.0, c["p_heat"] + rh1[i] - rh0[i]))
        pg = min(100.0, max(0.0, c["p_green_gap"] + rg1[i] - rg0[i]))
        p_new[c["id"]] = (ph, pg)

    # 3-4. bayraqlar, overlap, need
    need0 = [c["need"] for c in sc]
    for i, c in enumerate(sc):
        ph, pg = p_new[c["id"]]
        f = set(flags[c["id"]])
        for k, v in (("heat", ph), ("green_gap", pg)):
            if abs(v - c["p_" + k]) >= 0.5:  # faiz dəyişməyibsə köhnə bayraq qalır
                f.discard(k)
                if v >= WORST:
                    f.add(k)
        flags[c["id"]] = f
        c["lst"], c["ndvi"] = new_lst[i], new_ndvi[i]
        c["p_heat"], c["p_green_gap"] = int(round(ph)), int(round(pg))
        c["overlap"] = len(f)
        mean1 = sum(c["p_" + k] for k in KEYS if k not in ("heat", "green_gap")) / len(KEYS) + (ph + pg) / len(KEYS)
        c["need"] = round(c["need"] * mean1 / mean0[i], 1) if mean0[i] else c["need"]

    # 5. Gi*
    nb = neighbours(feats)
    z0, z1 = gistar(need0, nb), gistar([c["need"] for c in sc], nb)
    for i, c in enumerate(sc):
        if abs(z1[i] - z0[i]) >= 0.005:  # dəyişməyibsə köhnə sinif qalır (sərhəd yuvarlaqlaşdırması)
            c["gi"] = round(c["gi"] + z1[i] - z0[i], 2)
            c["gi_cls"] = gi_class(c["gi"])

    # 6. tiplər
    names = list(S["types"][0]["z"])
    centers = [(t["id"], [t["z"][n] for n in names]) for t in S["types"]]
    before = [dict(c, lst=old_lst[i], ndvi=old_ndvi[i]) for i, c in enumerate(sc)]
    pred0, pred1 = nearest(type_features(before, names), centers), nearest(type_features(sc, names), centers)
    moved = 0
    for i, c in enumerate(sc):
        if pred1[i] != pred0[i]:
            c["type"] = pred1[i]
            moved += 1
    Z = type_features(sc, names)
    for t in S["types"]:
        idx = [i for i, c in enumerate(sc) if c["type"] == t["id"]]
        for n in ("lst", "ndvi"):
            j = names.index(n)
            t["z"][n] = round(sum(Z[i][j] for i in idx) / len(idx), 2)

    # tip ortaları və rayon cədvəli: fərq üsulu (fayldakı + yeni - köhnə hesab)
    old_file = json.loads(json.dumps(S))
    base = json.loads(json.dumps(S))
    aggregate(base, before_feats, before_flags)
    aggregate(S, feats, flags)
    # eyni hücrələrdən ibarət zonalar: need, overlap, qat faizləri fərq üsulu ilə
    old_by_ids = {}
    for zb in base["zones"]:
        zf = next((z for z in old_file["zones"] if (z["cells"], z["pop"]) == (zb["cells"], zb["pop"])), None)
        if zf:
            old_by_ids[tuple(zb["ids"])] = (zf, zb)
    for z in S["zones"]:
        if tuple(z["ids"]) in old_by_ids:
            zf, zb = old_by_ids[tuple(z["ids"])]
            z["place"] = zf["place"]
            z["need"] = round(zf["need"] + z["need"] - zb["need"], 1)
            z["overlap_mean"] = round(zf["overlap_mean"] + z["overlap_mean"] - zb["overlap_mean"], 1)
            fb = dict(map(tuple, zb["top_layers"]))
            ff = dict(map(tuple, zf["top_layers"]))
            z["top_layers"] = [[n, v + ff[n] - fb[n]] if n in ff and n in fb else [n, v] for n, v in z["top_layers"]]
    finish_zones(S)
    for t, t0, tb in zip(S["types"], old_file["types"], base["types"]):
        for k, v in t["mean"].items():
            if k in ("density",):
                continue
            d = 3 if k == "ndvi" else 0 if k in ("transit_m", "deadend") else 1
            val = t0["mean"][k] + v - tb["mean"][k]
            t["mean"][k] = int(round(val)) if d == 0 else round(val, d)
    ob = {r["rayon"]: r for r in base["rayons"]}
    of = {r["rayon"]: r for r in old_file["rayons"]}
    for r in S["rayons"]:
        if r["rayon"] in of:
            for k in ("need", "hot_pct", "cold_pct", "overlap4_pct"):
                r[k] = round(of[r["rayon"]][k] + r[k] - ob[r["rayon"]][k], 1)
    S["landsat_scene"] = scene
    for z in S["zones"]:
        z.pop("ids", None)
    save("baku_synth.geojson", geo)
    save("baku_synth.json", S)
    print(f"Sintez → {scene}. Tipi dəyişən hücrə: {moved}. Qaynar: {S['hot_cells']} hücrə, {S['hot_pop']} nəfər. Zonalar: {len(S['zones'])}/{S['zones_total']}")
    return 0


if __name__ == "__main__":
    sys.exit(main("--check" in sys.argv))
