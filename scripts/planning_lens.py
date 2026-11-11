"""İnklüziv və kompleks planlama baxışı: mövcud analizləri iki anlayış üzrə yenidən oxuyur.

İNKLÜZİV PLANLAMA (kimə çatır, kim kənarda qalır):
  1) Bərabərlik (paylanma ədaləti): blok səviyyəsində 7 göstərici üçün əhali ilə çəkili Gini, ən pis 20% /
     ən yaxşı 20% nisbəti (Palma tipli) və həddən kənarda qalan əhali.
  2) Qrup əlçatanlığı: uşaq (məktəb, bağça), yaşlı (aptek/səhiyyə, oturacaq), əlilliyi olan (pilləkən, yamac,
     yeraltı keçid), periferiya sakini (dayanacaq, metro) üçün xidmətə məsafə — kim üçün şəhər işləyir.
  3) Sosial zəiflik indeksi (SVI, zona): əlillik sıxlığı (rayon, dasimetrik), dayanacağa 10 dəq-dən uzaq pay,
     metroya 2 km-dən uzaq pay, aptekə 800 m-dən uzaq pay, yüksək riskli məktəb sayı / 10 min. Sıra faizlərinin ortası.
  4) İnklüziv prioritet: insan × ehtiyac × (1 + SVI/100) — ehtiyac-only sıralama ilə müqayisə (ilk 20-yə girən yeni zonalar).
KOMPLEKS PLANLAMA (sahələrin birlikdə həlli):
  5) Sektor üst-üstə düşməsi: 8 problem qatı 4 sektora qruplaşdırılır (Hərəkət, Ətraf mühit, Risk və relyef, Xidmət);
     zonada sektor "kəskin" sayılır, əgər onun hər hansı qatının sıra faizi ≥ 67. ≥ 3 kəskin sektor → inteqrasiya paketi.
  6) Həll cütləri: blokda birlikdə lazım olan həllər (A–I) — hansı qurumlar birgə işləməlidir.

Məhdudiyyət: uşaq və yaşlı payı DSK-da yalnız şəhər səviyyəsindədir (məkan üzrə dəyişmir) → qrupların
məkan paylanması əhali sıxlığı ilə təxmin olunur; əlillik rayon səviyyəsindədir.

Giriş:  public/data/zoning.json, zoning_zones.geojson, zoning_blocks.geojson, transit_blocks.json,
        schools_safety.geojson, baku_analysis.json, transit_access.json
Çıxış:  public/data/planning_lens.json

  python3 scripts/planning_lens.py
"""
import json
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.prepared import prep
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"

Z = json.load(open(DATA / "zoning.json"))
zones = {z["rank"]: z for z in Z["zones"]}
blocks = [f["properties"] for f in json.load(open(DATA / "zoning_blocks.geojson"))["features"]]
walk = json.load(open(DATA / "transit_blocks.json"))
A = json.load(open(DATA / "baku_analysis.json"))
T = json.load(open(DATA / "transit_access.json"))
ray = {r["rayon"]: r for r in A["rayons"]}
for b in blocks:
    b["transit_walk"] = walk.get(str(b["bid"]))
pop_total = sum(b["pop"] for b in blocks)


def wgini(vals):
    """Əhali ilə çəkili Gini: vals = [(dəyər, əhali)], dəyər 'pis' istiqamətdə böyük (məsafə)."""
    v = sorted((x, w) for x, w in vals if x is not None and w > 0)
    W = sum(w for _, w in v)
    S = sum(x * w for x, w in v)
    if not W or not S:
        return None
    cum, acc = 0.0, 0.0
    for x, w in v:
        cum_prev = cum
        cum += x * w
        acc += w * (cum_prev + cum)
    return round(1 - acc / (W * S), 3)


def tail_ratio(vals):
    """Ən pis 20% əhalinin orta dəyəri / ən yaxşı 20%-in orta dəyəri (dəyər böyük = pis)."""
    v = sorted((x, w) for x, w in vals if x is not None and w > 0)
    W = sum(w for _, w in v)

    def mean_slice(seq):
        need, s, ws = 0.2 * W, 0.0, 0.0
        for x, w in seq:
            take = min(w, need - ws)
            if take <= 0:
                break
            s += x * take
            ws += take
        return s / ws if ws else None

    lo, hi = mean_slice(v), mean_slice(list(reversed(v)))
    return (round(hi / lo, 1) if lo else None), round(lo), round(hi)


# ---------- 1) Bərabərlik ----------
EQ = [
    # açar, ad, sahə, hədd, vahid, qrup
    ("transit", "Dayanacağa piyada yolu", "transit_walk", 400, "m", "Periferiya sakini"),
    ("metro", "Metroya məsafə", "metro_m", 2000, "m", "Periferiya sakini"),
    ("park", "Parka məsafə", "park_m", 400, "m", "Uşaq, yaşlı"),
    ("pharm", "Aptekə məsafə", "pharm_m", 500, "m", "Yaşlı, əlilliyi olan"),
    ("school", "Məktəbə məsafə", "school_m", 500, "m", "Uşaq"),
    ("kinder", "Bağçaya məsafə", "kinder_m", 500, "m", "Uşaq, ana"),
    ("shop", "Markete məsafə", "shop_m", 500, "m", "Hamı"),
]
equity = []
for key, name, field, thr, unit, group in EQ:
    vals = [(b.get(field), b["pop"]) for b in blocks]
    ratio, best, worst = tail_ratio(vals)
    over = sum(w for x, w in vals if x is not None and x > thr)
    equity.append({
        "key": key, "name": name, "unit": unit, "threshold": thr, "group": group,
        "gini": wgini(vals), "palma": ratio, "best20": best, "worst20": worst,
        "over_pop": round(over), "over_pct": round(100 * over / pop_total, 1),
    })
# İstilik: tərs istiqamət yox (yüksək = pis) — sadəcə ən isti/ən sərin 20%
heat = [(b["lst"], b["pop"]) for b in blocks if b.get("lst")]
hr, hb, hw = tail_ratio(heat)
equity.append({"key": "heat", "name": "Yay günü yer səthi", "unit": "°C", "threshold": 42, "group": "Yaşlı, uşaq, açıq havada işləyən",
               "gini": wgini(heat), "palma": hr, "best20": hb, "worst20": hw,
               "over_pop": round(sum(w for x, w in heat if x > 42)), "over_pct": round(100 * sum(w for x, w in heat if x > 42) / pop_total, 1)})

# Rayonlar arası uçurum (rayon səviyyəli göstəricilər)
RG = [
    ("transit_5min", "Dayanacağa 5 dəq", {r["rayon"]: r["pct_5min"] for r in T["by_rayon"]}, "%"),
    ("ps_400_net_pct", "İctimai məkana 5 dəq", {k: v.get("ps_400_net_pct") for k, v in ray.items()}, "%"),
    ("green_pct", "Yaşıl örtük", {k: v.get("green_pct") for k, v in ray.items()}, "%"),
    ("health_per1000", "Səhiyyə obyekti / 1000", {k: v.get("health_per1000") for k, v in ray.items()}, ""),
    ("play_per1000", "Oyun meydançası / 1000", {k: v.get("play_per1000") for k, v in ray.items()}, ""),
]
rayon_gaps = []
for key, name, d, unit in RG:
    d = {k: v for k, v in d.items() if v is not None}
    lo = min(d, key=d.get)
    hi = max(d, key=d.get)
    rayon_gaps.append({"key": key, "name": name, "unit": unit, "best": hi, "best_v": d[hi], "worst": lo, "worst_v": d[lo],
                       "ratio": round(d[hi] / d[lo], 1) if d[lo] else None})

# ---------- 2) Qrup əlçatanlığı (şəhər) ----------
def share(cond):
    return round(100 * sum(b["pop"] for b in blocks if cond(b)) / pop_total, 1)


groups = [
    {"group": "Uşaqlar", "pop_est": round(pop_total * A["city"]["child_pct_city"] / 100), "items": [
        ["Məktəb 500 m-də", share(lambda b: b["school_m"] <= 500)],
        ["Bağça 500 m-də", share(lambda b: b["kinder_m"] <= 500)],
        ["Park 400 m-də", share(lambda b: b["park_m"] <= 400)],
    ]},
    {"group": "Yaşlılar", "pop_est": round(pop_total * A["city"]["old_pct_city"] / 100), "items": [
        ["Aptek 500 m-də", share(lambda b: b["pharm_m"] <= 500)],
        ["Dayanacaq 5 dəq-də", share(lambda b: (b["transit_walk"] or 9999) <= 400)],
        ["Yamac < 5°", share(lambda b: b["slope"] < 5)],
    ]},
    {"group": "Əlilliyi olan şəxslər", "pop_est": A["city"]["disabled"], "items": [
        ["Yeraltı keçid olmayan blok", share(lambda b: not b["under_n"])],
        ["Yamac < 3°", share(lambda b: b["slope"] < 3)],
        ["Metro 1 km-də", share(lambda b: b["metro_m"] <= 1000)],
    ]},
    {"group": "Periferiya sakinləri", "pop_est": T["summary"]["far_pop"], "items": [
        ["Dayanacaq 5 dəq-də", share(lambda b: (b["transit_walk"] or 9999) <= 400)],
        ["Metro 2 km-də", share(lambda b: b["metro_m"] <= 2000)],
        ["Market 500 m-də", share(lambda b: b["shop_m"] <= 500)],
    ]},
]

# ---------- 3) Sosial zəiflik indeksi (zona) ----------
zgeo = {f["properties"]["rank"]: shape(f["geometry"]) for f in json.load(open(DATA / "zoning_zones.geojson"))["features"]}
zprep = {k: prep(g) for k, g in zgeo.items()}
ztree_keys = list(zgeo)
ztree = STRtree([zgeo[k] for k in ztree_keys])
hi_school = Counter()
for f in json.load(open(DATA / "schools_safety.geojson"))["features"]:
    if f["properties"]["level"] != "yüksək":
        continue
    p = Point(f["geometry"]["coordinates"])
    for i in ztree.query(p):
        k = ztree_keys[i]
        if zprep[k].contains(p):
            hi_school[k] += 1
            break

zb = defaultdict(list)
for b in blocks:
    if b.get("zone_rank") is not None:
        zb[b["zone_rank"]].append(b)
rayon_pop = defaultdict(float)
for b in blocks:
    rayon_pop[b["rayon"]] += b["pop"]

raw = {}
for k, z in zones.items():
    bs = zb.get(k, [])
    P = sum(b["pop"] for b in bs) or z["pop"]
    raw[k] = {
        "disab": ray[z["rayon"]]["disabled_per1000"],
        "far": sum(b["pop"] for b in bs if (b["transit_walk"] or 0) > 800) / P,
        "nometro": sum(b["pop"] for b in bs if b["metro_m"] > 2000) / P,
        "nopharm": sum(b["pop"] for b in bs if b["pharm_m"] > 800) / P,
        "school": 1e4 * hi_school[k] / P,
    }
    z["disabled_est"] = round(ray[z["rayon"]]["disabled"] * P / rayon_pop[z["rayon"]]) if ray[z["rayon"]].get("disabled") else None


def pct_rank(d):
    keys = sorted(d, key=d.get)
    n = len(keys) - 1
    out = {}
    for i, k in enumerate(keys):
        out[k] = 100 * i / n
    # bərabər dəyərlərə eyni sıra
    by_v = defaultdict(list)
    for k in d:
        by_v[d[k]].append(out[k])
    return {k: sum(by_v[d[k]]) / len(by_v[d[k]]) for k in d}


SVI_PARTS = {"disab": "Əlillik sıxlığı (rayon)", "far": "Dayanacağa 10 dəq-dən uzaq", "nometro": "Metroya 2 km-dən uzaq", "nopharm": "Aptekə 800 m-dən uzaq", "school": "Yüksək riskli məktəb / 10 min"}
ranks = {p: pct_rank({k: raw[k][p] for k in raw}) for p in SVI_PARTS}
for k, z in zones.items():
    z["svi"] = round(sum(ranks[p][k] for p in SVI_PARTS) / len(SVI_PARTS))
    z["svi_parts"] = {p: round(ranks[p][k]) for p in SVI_PARTS}
    z["hi_school"] = hi_school[k]

# ---------- 4) İnklüziv prioritet ----------
need_rank = sorted(zones, key=lambda k: -zones[k]["pop"] * zones[k]["need"])
inc_rank = sorted(zones, key=lambda k: -zones[k]["pop"] * zones[k]["need"] * (1 + zones[k]["svi"] / 100))
pos_need = {k: i + 1 for i, k in enumerate(need_rank)}
pos_inc = {k: i + 1 for i, k in enumerate(inc_rank)}
top_n = 20
entered = [k for k in inc_rank[:top_n] if pos_need[k] > top_n]
left = [k for k in need_rank[:top_n] if pos_inc[k] > top_n]

# ---------- 5) Sektor üst-üstə düşməsi ----------
SECTORS = {
    "move": ("Hərəkət", ["transit_gap", "fragment", "car"], "BNA, BakuBus, DYP"),
    "env": ("Ətraf mühit", ["heat", "green_gap"], "Ekologiya Nazirliyi, icra hakimiyyəti"),
    "risk": ("Risk və relyef", ["lowland", "slope"], "FHN, Azərsu, Şəhərsalma Komitəsi"),
    "svc": ("Xidmət", ["service_gap"], "Səhiyyə, Təhsil, bələdiyyə"),
}
sec_hist = Counter()
sec_pop = Counter()
pair_pop = Counter()
for k, z in zones.items():
    acute = [s for s, (_, ls, _) in SECTORS.items() if any(z[f"p_{l}"] >= 67 for l in ls)]
    z["sectors"] = acute
    sec_hist[len(acute)] += 1
    sec_pop[len(acute)] += z["pop"]
    for a, b in combinations(acute, 2):
        pair_pop[(a, b)] += z["pop"]

# ---------- 6) Həll cütləri (blok) ----------
sol_pairs = Counter()
sol_multi_pop = 0.0
for b in blocks:
    s = [x for x in (b.get("sol") or "").split(",") if x]
    if len(s) >= 2:
        sol_multi_pop += b["pop"]
    for a, c in combinations(sorted(set(s)), 2):
        sol_pairs[(a, c)] += b["pop"]

zone_out = []
for k in inc_rank:
    z = zones[k]
    zone_out.append({
        "rank": k, "name": z["name"], "rayon": z["rayon"], "pop": z["pop"], "need": z["need"], "svi": z["svi"],
        "svi_parts": z["svi_parts"], "disabled_est": z["disabled_est"], "hi_school": z["hi_school"],
        "sectors": z["sectors"], "pos_need": pos_need[k], "pos_inc": pos_inc[k],
    })

out = {
    "equity": equity,
    "rayon_gaps": rayon_gaps,
    "groups": groups,
    "svi_parts": SVI_PARTS,
    "zones": zone_out,
    "shift": {"top_n": top_n, "entered": [zones[k]["name"] for k in entered], "left": [zones[k]["name"] for k in left],
              "entered_pop": sum(zones[k]["pop"] for k in entered)},
    "sectors": {s: {"name": n, "layers": ls, "agencies": ag} for s, (n, ls, ag) in SECTORS.items()},
    "sector_hist": {str(n): {"zones": sec_hist[n], "pop": round(sec_pop[n])} for n in range(5)},
    "sector_pairs": [{"a": a, "b": b, "pop": round(p)} for (a, b), p in pair_pop.most_common(6)],
    "sol_pairs": [{"a": a, "b": c, "pop": round(p)} for (a, c), p in sol_pairs.most_common(8)],
    "sol_multi_pct": round(100 * sol_multi_pop / pop_total, 1),
    "pop_total": round(pop_total),
    "method": {
        "gini": "Əhali ilə çəkili Gini (0 = hamı bərabər, 1 = tam qeyri-bərabər), blok səviyyəsi",
        "palma": "Ən pis 20% əhalinin orta dəyəri / ən yaxşı 20%-in orta dəyəri",
        "svi": "5 göstəricinin zonalar arası sıra faizinin ortası (0–100)",
        "priority": "insan × ehtiyac × (1 + SVI/100)",
        "sector": "Sektorun hər hansı qatının sıra faizi ≥ 67",
        "limits": "Uşaq və yaşlı payı yalnız şəhər səviyyəsindədir; əlillik rayon səviyyəsindədir; məsafələr düz xətt (dayanacaq istisna — şəbəkə)",
    },
}
json.dump(out, open(DATA / "planning_lens.json", "w"), ensure_ascii=False, separators=(",", ":"))

for e in equity:
    print(f'{e["name"]:28s} Gini {e["gini"]}  pis/yaxşı {e["palma"]}  ({e["best20"]}→{e["worst20"]} {e["unit"]})  həddən kənar {e["over_pct"]}%')
for g in rayon_gaps:
    print(g)
for g in groups:
    print(g)
print("SVI top:", [(z["name"], z["svi"]) for z in sorted(zone_out, key=lambda x: -x["svi"])[:5]])
print("shift:", out["shift"])
print("sector_hist:", out["sector_hist"])
print("sector_pairs:", out["sector_pairs"][:3])
print("sol_pairs:", out["sol_pairs"][:4], out["sol_multi_pct"])
