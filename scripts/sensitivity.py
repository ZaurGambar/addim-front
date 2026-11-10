"""Həssaslıq analizi (Monte Carlo): çəkilər dəyişəndə nəticələr nə qədər sabitdir?

1) Piyada indeksi (mərkəz, 250 m hücrələr): 7 komponentin çəkisi hər iterasiyada ±30% (bərabər paylanma)
   dəyişdirilir, indeks yenidən hesablanır. Ölçü: əsas indekslə Spearman korrelyasiyası, hücrə balının
   orta mütləq dəyişməsi, stansiyaların sırası (5–95% aralığı).
2) Planlama zonaları: 8 problem qatının çəkiləri Dirichlet(α=8) ilə (orta 1/8, ≈ ±35%) dəyişdirilir,
   ehtiyac = çəkili orta × (əsas ehtiyac / sadə orta); sıra: əhali × ehtiyac.
   Ölçü: hər zonanın top-20-də qalma ehtimalı, əsas top-20-nin orta saxlanma payı.

Giriş:  public/data/walk_index.geojson, summary.json, zoning.json
Çıxış:  public/data/sensitivity.json

  python3 scripts/sensitivity.py
"""
import json
from pathlib import Path

import numpy as np

DATA = Path(__file__).resolve().parent.parent / "public" / "data"
N = 1000
rng = np.random.default_rng(42)


def rank(a):
    r = np.empty(len(a))
    r[np.argsort(a, kind="mergesort")] = np.arange(len(a))
    return r


def spearman(a, b):
    return float(np.corrcoef(rank(a), rank(b))[0, 1])


# ---------- 1. Piyada indeksi ----------
cells = [f["properties"] for f in json.load(open(DATA / "walk_index.geojson"))["features"]]
cl = lambda v: np.clip(v, 0, 1)
comp = {
    "metro": cl(1 - np.array([c["metro_m"] for c in cells]) / 1200),
    "park": cl(1 - np.array([c["park_m"] for c in cells]) / 600),
    "cross": cl(np.array([c["cross"] for c in cells]) / 8),
    "ped": cl(np.array([c["ped_m"] for c in cells]) / 300),
    "bus": cl(np.array([c["bus"] for c in cells]) / 4),
    "major": cl(np.array([c["major_m"] for c in cells]) / 600),
    "under": cl(np.array([c["under"] for c in cells]) / 2),
}
W0 = {"metro": 25, "park": 20, "cross": 20, "ped": 20, "bus": 15, "major": -25, "under": -10}


def walk(w):
    s = sum(w[k] * comp[k] for k in w) + 10
    return np.clip(s, 0, 100)


base = walk(W0)
rhos, mad = [], []
for _ in range(N):
    w = {k: v * rng.uniform(0.7, 1.3) for k, v in W0.items()}
    s = walk(w)
    rhos.append(spearman(base, s))
    mad.append(float(np.mean(np.abs(s - base))))
walk_res = {
    "n_cells": len(cells), "iterations": N, "perturb": "±30%",
    "spearman_median": round(float(np.median(rhos)), 3), "spearman_p5": round(float(np.percentile(rhos, 5)), 3),
    "mean_abs_change_median": round(float(np.median(mad)), 1),
    "base_check_corr": round(float(np.corrcoef(base, [c["score"] for c in cells])[0, 1]), 3),
}

# ---------- 2. Planlama zonaları ----------
Z = json.load(open(DATA / "zoning.json"))
layers = list(Z["layers"].keys())
zones = Z["zones"]
P = np.array([[z[f"p_{k}"] for k in layers] for z in zones], float)
need0 = np.array([z["need"] for z in zones], float)
pop = np.array([z["pop"] for z in zones], float)
simple = P.mean(1)
factor = np.where(simple > 0, need0 / simple, 0)
TOP = 20
base_order = np.argsort(-(pop * need0))
base_top = set(base_order[:TOP].tolist())
hits = np.zeros(len(zones))
keep = []
for _ in range(N):
    w = rng.dirichlet([8] * len(layers))
    with np.errstate(all="ignore"):  # macOS Accelerate BLAS yalançı xəbərdarlıq verir
        need = (P @ w) * factor
    assert np.isfinite(need).all()
    top = set(np.argsort(-(pop * need))[:TOP].tolist())
    for i in top:
        hits[i] += 1
    keep.append(len(top & base_top) / TOP)
zone_rows = []
for i in base_order[:TOP]:
    z = zones[i]
    zone_rows.append({"rank": z["rank"], "name": z["name"], "rayon": z["rayon"], "pop": z["pop"], "need": z["need"], "top20_prob": round(100 * hits[i] / N)})
outsiders = [(zones[i]["name"], zones[i]["rank"], round(100 * hits[i] / N)) for i in np.argsort(-hits) if i not in base_top and hits[i] / N >= 0.2]
zone_res = {
    "n_zones": len(zones), "iterations": N, "perturb": "Dirichlet(α=8), ≈ ±35%", "top": TOP,
    "top20_kept_median": round(100 * float(np.median(keep))), "top20_kept_p5": round(100 * float(np.percentile(keep, 5))),
    "stable_count": int(sum(1 for r in zone_rows if r["top20_prob"] >= 80)),
    "top20": zone_rows,
    "challengers": [{"name": n, "rank": r, "top20_prob": p} for n, r, p in outsiders[:5]],
}

json.dump({"walk": walk_res, "zones": zone_res}, open(DATA / "sensitivity.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(walk_res, ensure_ascii=False))
print({k: v for k, v in zone_res.items() if k not in ("top20",)})
for r in zone_rows[:10]:
    print(r)
