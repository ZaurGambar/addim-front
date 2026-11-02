"""OSM obyekt və dayanacaq datasını 2GIS datası ilə əvəz edir və analizi yenidən hesablayır.

Giriş: data-raw/2gis/cells.json (scripts/fetch_2gis.py toplayır).

1. baku_grid.geojson: poi, stops -> 2GIS (bütün hücrələr).
2. baku_synth: poi, stops, transit_m (ən yaxın dayanacaq, m) -> 2GIS.
   p_service_gap: sıra fərqi, göstərici -(poi / əhali)  (köhnə faizə ən yaxın uyğunluq)
   p_transit_gap: sıra fərqi, göstərici transit_m
   Qalan addımlar (bayraqlar, need, Gi*, tiplər, zonalar, rayonlar) update_synthesis.propagate ilə.
3. baku_analysis.json:
   rayon poi_per1000, poi_km2, bus_stops_km2: köhnə x (2GIS cəmi / OSM cəmi), rayon hücrələri üzrə
   transit500_pct: köhnə + (yeni pay - köhnə pay), pay = 500 m-də dayanacağı olan əhali (sintez hücrələri)
   city pois, bus_stops, transit500_pct: eyni qayda ilə.
   Dəyişməyənlər: kateqoriya göstəriciləri (commerce, health ...), mix_index, walk_score, yollar.

  python3 scripts/update_2gis.py --dry   # yalnız xülasə
  python3 scripts/update_2gis.py         # yazır
"""

import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import update_synthesis as U  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw" / "2gis" / "cells.json"
NO_STOP_M = 2500  # 2 km-də dayanacaq yoxdursa
SOURCE = "2GIS Catalog API, 2026-11"


def main(dry):
    cells = json.loads(RAW.read_text())
    gridgeo = U.load("baku_grid.geojson")
    S = U.load("baku_synth.json")
    geo = U.load("baku_synth.geojson")
    A = U.load("baku_analysis.json")
    if S.get("poi_source") == SOURCE:
        raise SystemExit("Sintez artıq 2GIS datası ilədir.")
    grid = [f["properties"] for f in gridgeo["features"]]
    miss = [g["id"] for g in grid if str(g["id"]) not in cells]
    sc = [f["properties"] for f in geo["features"]]
    miss_s = [c["id"] for c in sc if "near_stop" not in cells.get(str(c["id"]), {})]
    if miss or miss_s:
        raise SystemExit(f"Data tam deyil: grid {len(miss)}, sintez {len(miss_s)} hücrə çatışmır. fetch_2gis.py-ni yenidən işə salın.")

    # --- 3-ün köhnə payları (dəyişməzdən əvvəl)
    def share(rows):
        P = sum(c["pop"] for c in rows)
        return 100 * sum(c["pop"] for c in rows if c["transit_m"] <= 500) / P if P else 0

    old_share = {r: share([c for c in sc if c["rayon"] == r]) for r in {c["rayon"] for c in sc}}
    old_share_city = share(sc)
    old_sum = collections.defaultdict(lambda: [0, 0])
    for g in grid:
        old_sum[g["rayon"]][0] += g["poi"]
        old_sum[g["rayon"]][1] += g["stops"]

    # --- 1. grid
    for g in grid:
        c = cells[str(g["id"])]
        g["poi"], g["stops"] = c["poi"], c["stops"]
    new_sum = collections.defaultdict(lambda: [0, 0])
    for g in grid:
        new_sum[g["rayon"]][0] += g["poi"]
        new_sum[g["rayon"]][1] += g["stops"]

    # --- 2. sintez
    new = {c["id"]: cells[str(c["id"])] for c in sc}
    poi1 = [new[c["id"]]["poi"] for c in sc]
    stops1 = [new[c["id"]]["stops"] for c in sc]
    tr1 = [new[c["id"]]["near_stop"] if new[c["id"]]["near_stop"] is not None else NO_STOP_M for c in sc]
    changed = {
        "service_gap": U.rank_delta([c["p_service_gap"] for c in sc], [-(c["poi"] / c["pop"]) for c in sc], [-(p / c["pop"]) for p, c in zip(poi1, sc)]),
        "transit_gap": U.rank_delta([c["p_transit_gap"] for c in sc], [c["transit_m"] for c in sc], tr1),
    }
    hot0, zones0 = S["hot_pop"], [z["place"] for z in S["zones"]]
    moved = U.propagate(S, geo, changed, {"poi": poi1, "stops": stops1, "transit_m": tr1})
    S["poi_source"] = SOURCE

    # --- 3. analiz
    for r in A["rayons"]:
        name = r["rayon"]
        if name not in old_sum:
            continue
        (p0, s0), (p1, s1) = old_sum[name], new_sum[name]
        for k in ("poi_per1000", "poi_km2"):
            if p0 and r.get(k) is not None:
                r[k] = round(r[k] * p1 / p0, 1)
        if s0 and r.get("bus_stops_km2") is not None:
            r["bus_stops_km2"] = round(r["bus_stops_km2"] * s1 / s0, 2)
        rows = [c for c in sc if c["rayon"] == name]
        if rows and r.get("transit500_pct") is not None:
            r["transit500_pct"] = round(min(100.0, max(0.0, r["transit500_pct"] + share(rows) - old_share[name])), 1)
    C = A["city"]
    P0, P1 = sum(v[0] for v in old_sum.values()), sum(v[0] for v in new_sum.values())
    T0, T1 = sum(v[1] for v in old_sum.values()), sum(v[1] for v in new_sum.values())
    pois0, stops0, tr0 = C["pois"], C["bus_stops"], C["transit500_pct"]
    C["pois"] = round(C["pois"] * P1 / P0)
    C["bus_stops"] = round(C["bus_stops"] * T1 / T0)
    C["transit500_pct"] = round(min(100.0, max(0.0, C["transit500_pct"] + share(sc) - old_share_city)), 1)
    C["poi_source"] = SOURCE

    print(f"Obyektlər (grid cəmi): OSM {P0} -> 2GIS {P1}; şəhər pois {pois0} -> {C['pois']}")
    print(f"Dayanacaqlar: OSM {T0} -> 2GIS {T1}; şəhər bus_stops {stops0} -> {C['bus_stops']}")
    print(f"500 m-də dayanacaq: {tr0}% -> {C['transit500_pct']}%")
    print(f"Qaynar əhali: {hot0} -> {S['hot_pop']}; hücrələr {S['hot_cells']}; tipi dəyişən {moved}")
    print("Zonalar əvvəl:", zones0[:6])
    print("Zonalar indi: ", [z["place"] for z in S["zones"]][:6])
    if dry:
        return 0
    U.save("baku_grid.geojson", gridgeo)
    U.save("baku_synth.geojson", geo)
    U.save("baku_synth.json", S)
    U.save("baku_analysis.json", A)
    print("Yazıldı.")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry" in sys.argv))
