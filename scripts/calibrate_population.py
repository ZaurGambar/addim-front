"""WorldPop 2020 əhalisini DSK 2024 rəsmi rayon cəmlərinə kalibrləyir.

Hər rayonun bütün 1 km hücrələri eyni əmsalla vurulur: k = DSK_2024 / WorldPop_2020.
Rayon daxilində paylanma (WorldPop) saxlanılır, rayon cəmi rəsmi rəqəmə bərabər olur.
Sonra əhaliyə bağlı bütün cəmlər və nisbətlər yenidən hesablanır.
Klasterlər, Gi* sinifləri, problem qatları və hücrə seçimi (min_pop) dəyişmir.

İstifadə:
  python3 scripts/calibrate_population.py --check   # əmsal=1, köhnə faylları təkrar etməlidir
  python3 scripts/calibrate_population.py           # public/data fayllarını yeniləyir

Mənbə: opendata.az, "2024-cü ilin əvvəlinə ölkənin iqtisadi və inzibati rayonlarının
ərazisi, əhalisinin sayı və sıxlığı" (DSK, CC0), min nəfər.
"""

import collections
import itertools
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "public" / "data"

DSK_2024 = {  # min nəfər, ilin əvvəlinə
    "Binəqədi": 307.9, "Xətai": 276.1, "Xəzər": 205.5, "Qaradağ": 117.0,
    "Nərimanov": 180.7, "Nəsimi": 219.2, "Nizami": 185.3, "Pirallahı": 18.8,
    "Sabunçu": 330.6, "Səbail": 101.8, "Suraxanı": 208.2, "Yasamal": 193.8,
}
PER1000 = ["poi_per1000", "commerce_per1000", "office_per1000", "finance_per1000",
           "health_per1000", "edu_per1000", "play_per1000"]
# Problem qatı: hücrə ən pis üçdə birlikdədir. Faylda faiz tam ədədə yuvarlaqlaşdırılıb,
# ona görə 67 sərhəddə qeyri-müəyyəndir: hücrənin "overlap" sayına görə seçilir.
# 2 hücrədə iki variant var; köhnə kombinasiya cəmlərini dəqiq verən yeganə variant:
FLAG_OVERRIDES = {1933: {"transit_gap"}, 2095: {"green_gap"}}
ZONE_MIN_POP = 1000    # siyahıda göstərilən zonalar


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def decimals(values):
    d = 0
    for v in values:
        if isinstance(v, float):
            s = repr(v)
            if "." in s:
                d = max(d, len(s.split(".")[1]))
    return d


def rnd(v, d):
    return round(v, d) if d else int(round(v))


def layer_flags(c, keys):
    sure = {k for k in keys if c["p_" + k] >= 68}
    edge = [k for k in keys if c["p_" + k] == 67]
    need = c["overlap"] - len(sure)
    if need == len(edge):
        return sure | set(edge)
    if need == 0:
        return sure
    return sure | FLAG_OVERRIDES[c["id"]]


def centroid(geom):
    pts = geom["coordinates"][0][:-1]
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def build(check):
    rayons_geo = load("baku_rayons.geojson")
    analysis = load("baku_analysis.json")
    grid = load("baku_grid.geojson")
    synth_geo = load("baku_synth.geojson")
    synth = load("baku_synth.json")

    if not check and analysis["city"].get("pop_year") == 2024:
        sys.exit("Data artıq DSK 2024-ə kalibrlənib. İkinci dəfə işlətmək əhalini yenidən vurar.")
    old_pop = {f["properties"]["rayon"]: f["properties"]["pop"] for f in rayons_geo["features"]}
    new_pop = dict(old_pop) if check else {r: int(round(v * 1000)) for r, v in DSK_2024.items()}
    k = {r: new_pop[r] / old_pop[r] for r in old_pop}

    # --- rayonlar (geojson və analysis eyni qeydlərdir) ---
    recs = [f["properties"] for f in rayons_geo["features"]]
    dec = {f: decimals([p[f] for p in recs if p.get(f) is not None]) for f in PER1000 + ["disabled_per1000"]}

    def fix_rayon(p):
        r, op, np_ = p["rayon"], old_pop[p["rayon"]], new_pop[p["rayon"]]
        p["pop"] = np_
        p["density"] = int(round(np_ / p["area_km2"]))
        for f in PER1000:
            if p.get(f) is not None:
                p[f] = rnd(p[f] * op / np_, dec[f])
        if p.get("disabled") is not None:
            p["disabled_per1000"] = rnd(p["disabled"] / np_ * 1000, dec["disabled_per1000"])

    for p in recs:
        fix_rayon(p)
    for p in analysis["rayons"]:
        fix_rayon(p)

    # --- hücrələr ---
    grid_old = [dict(f["properties"]) for f in grid["features"]]
    synth_old_pop = {f["properties"]["id"]: f["properties"]["pop"] for f in synth_geo["features"]}
    for f in grid["features"] + synth_geo["features"]:
        p = f["properties"]
        p["pop"] = int(round(p["pop"] * k[p["rayon"]]))

    # --- şəhər ---
    C = analysis["city"]
    by = {p["rayon"]: p for p in recs}
    P = sum(new_pop.values())
    C["pop"] = P
    C["pop_no_metro"] = sum(new_pop[r] for r in C["no_metro_rayons"])
    C["transit500_pct"] = round(sum(by[r]["transit500_pct"] * new_pop[r] for r in by) / P, 1)
    C["green_pct_popw"] = round(sum(by[r]["green_pct"] * new_pop[r] for r in by) / P, 1)

    def lst_popw(cells):
        c = [x for x in cells if x["lst"] is not None]
        return sum(x["lst"] * x["pop"] for x in c) / sum(x["pop"] for x in c)

    grid_new = [f["properties"] for f in grid["features"]]
    C["lst_popw"] = round(C["lst_popw"] + lst_popw(grid_new) - lst_popw(grid_old), 1)
    if not check:
        C["pop_source"] = "DSK 2024 (ilin əvvəlinə); hücrə paylanması WorldPop 2020"
        C["pop_year"] = 2024

    # --- sintez ---
    sc = [f["properties"] for f in synth_geo["features"]]
    S = synth
    S["pop"] = sum(c["pop"] for c in sc)
    S["hot_pop"] = sum(c["pop"] for c in sc if c["gi_cls"] >= 2)
    S["cold_pop"] = sum(c["pop"] for c in sc if c["gi_cls"] <= -2)
    op = [0] * len(S["overlap_pop"])
    for c in sc:
        op[c["overlap"]] += c["pop"]
    S["overlap_pop"] = op

    for t in S["types"]:
        cs = [c for c in sc if c["type"] == t["id"]]
        t["pop"] = sum(c["pop"] for c in cs)
        t["mean"]["density"] = int(sum(c["pop"] for c in cs) / len(cs))

    rp = collections.Counter()
    for c in sc:
        rp[c["rayon"]] += c["pop"]
    for r in S["rayons"]:
        if r["rayon"] in rp:
            r["pop"] = rp[r["rayon"]]

    layers = S["layers"]
    keys = list(layers)
    n_combos = len(S["top_combos"])
    flags = {c["id"]: layer_flags(c, keys) for c in sc}
    combos = []
    for ks in itertools.combinations(keys, 3):
        pop = sum(c["pop"] for c in sc if set(ks) <= flags[c["id"]])
        combos.append({"layers": [layers[x] for x in ks], "pop": pop})
    order = {tuple(c["layers"]): i for i, c in enumerate(S["top_combos"])}
    combos.sort(key=lambda c: (-c["pop"], order.get(tuple(c["layers"]), 999)))
    S["top_combos"] = combos[:n_combos]

    # zonalar: qonşu qaynar hücrələr (Gi* 95%+), sıra: əhali × ehtiyac
    cells = [(f["properties"], centroid(f["geometry"])) for f in synth_geo["features"]]
    hot = [c for c in cells if c[0]["gi_cls"] >= 2]
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
    by_key = {(z["cells"], z["pop"]): z for z in S["zones"]}  # köhnə zona: hücrə sayı + köhnə əhali
    zones = []
    for comp in comps:
        ids = [x[0] for x in comp]
        pop = sum(x["pop"] for x in ids)
        lon = round(sum(x[1][0] * x[0]["pop"] for x in comp) / pop, 4) if pop else None
        lat = round(sum(x[1][1] * x[0]["pop"] for x in comp) / pop, 4) if pop else None
        old = by_key.get((len(ids), sum(synth_old_pop[x["id"]] for x in ids)))
        if old is None:
            continue  # siyahıda olmayan kiçik zona (köhnə faylda da yox idi)
        z = dict(old)
        z.update(pop=pop, lon=lon, lat=lat)
        zones.append(z)
    zones = [z for z in zones if z["pop"] >= ZONE_MIN_POP]
    zones.sort(key=lambda z: -z["pop"] * z["need"])  # saytdakı qayda: əhali × ehtiyac
    for i, z in enumerate(zones, 1):
        z["rank"] = i
    S["zones"] = zones

    return {
        "baku_rayons.geojson": rayons_geo, "baku_analysis.json": analysis, "baku_grid.geojson": grid,
        "baku_synth.geojson": synth_geo, "baku_synth.json": synth,
    }, k


def diff(a, b, path=""):
    out = []
    if isinstance(a, dict) and isinstance(b, dict):
        for key in set(a) | set(b):
            out += diff(a.get(key), b.get(key), f"{path}.{key}")
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)):
            out += diff(x, y, f"{path}[{i}]")
    elif a != b:
        out.append(f"{path}: {a!r} != {b!r}")
    return out


if __name__ == "__main__":
    check = "--check" in sys.argv
    files, k = build(check)
    if check:
        bad = 0
        for name, data in files.items():
            d = diff(load(name), data)
            bad += len(d)
            print(f"{name}: {len(d)} fərq", *d[:8], sep="\n  ")
        sys.exit(1 if bad else 0)
    for name, data in files.items():
        fmt = {"indent": 1} if name.endswith(".json") else {"separators": (",", ":")}  # orijinal format
        (DATA / name).write_text(json.dumps(data, ensure_ascii=False, **fmt), encoding="utf-8")
    print("Əmsallar:", {r: round(v, 3) for r, v in k.items()})
