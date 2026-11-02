"""Addım 3: 8 problem qatı, planlama zonaları (regionalizasiya) və zona təklifləri.

Qatlar (insan yaşayan bloklar arasında sıra faizi, 0..100, yüksək = pis):
  heat lst↑ · green_gap yaşıllıq payı↓ · transit_gap dayanacağa məsafə↑ · fragment (dalan payı↑ + kəsişmə sıxlığı↓)/2
  car magistral sıxlığı↑ · slope yamac↑ · lowland hündürlük↓ · service_gap 500 m-də gündəlik xidmət↓
need = 8 qatın ortası. Ən pis üçdə bir (p >= 66.7) = problem bayrağı.

Zonalar: SKATER tipli regionalizasiya. Qonşu bloklar (sərhədi toxunan) qrafı, kənar çəkisi = problem
profillərinin fərqi; minimal örtük ağacı; zona 15 000 nəfərdən böyükdürsə ağacın elə kənarı kəsilir ki,
hər iki hissə >= 5 000 nəfər olsun və daxili fərq (əhali ilə çəkili kvadrat cəm) ən çox azalsın.

Çıxış: public/data/zoning_blocks.geojson, zoning_zones.geojson, zoning.json
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components, minimum_spanning_tree

ROOT = Path(__file__).resolve().parents[2]
OSM = Path("/Users/faritt0/Documents/QGIS/SeaBreeze/azerbaijan-251102-free.shp")
OUT = ROOT / "public" / "data"
MIN_POP, MAX_POP, LIVE = 5000, 15000, 100
KEYS = ["heat", "green_gap", "transit_gap", "fragment", "car", "slope", "lowland", "service_gap"]
WORST = 200 / 3

# qaydalar (/qaydalar səhifəsi ilə eyni nömrələr) və hansı problemə cavab verdikləri
RULES = {
    1: "Piyada keçidi standartı", 2: "Məhəllədə 30 km/saat", 3: "Pilot (sınaq) rejimi", 4: "Kölgə və yaşıllıq norması",
    5: "Parkinq qaydaları", 6: "Nəqliyyat əlçatanlığı standartı", 7: "“15 dəqiqəlik məhəllə” tələbi", 8: "Sahil və alçaq ərazilər",
    9: "Büdcə ehtiyaca görə", 10: "Açıq məlumat və əvvəl/sonra ölçmə",
}
RULE_FOR = {"heat": [4], "green_gap": [4], "transit_gap": [6], "fragment": [7, 1], "car": [2, 1, 5], "slope": [1], "lowland": [8], "service_gap": [7]}
ACTION = {
    "heat": "kölgə: ağac, dayanacaqda örtük, sərin səki",
    "green_gap": "kiçik parklar və küçə ağacları",
    "transit_gap": "yeni dayanacaq və ya marşrut, 500 m standartı",
    "fragment": "dalanları birləşdirən piyada keçidləri",
    "car": "30 km/saat, təhlükəsiz zebra, səkidə parkinqə nəzarət",
    "slope": "pilləkən yanında pandus, oturacaq",
    "lowland": "drenaj, su basma riskinə görə tikinti şərtləri",
    "service_gap": "birinci mərtəbədə xidmət, bazar, aptek, bağça",
}


# İnsan miqyasında piyada həlləri (blok səviyyəsi). Hər biri zona proqramına və şəhər qaydasına bağlanır.
SOLUTIONS = {
    "A": ("Yer üstü piyada keçidi", "Yer üstü keçid proqramı", 1),
    "B": ("Təhlükəsiz məktəb yolu", "Təhlükəsiz məktəb yolları", 2),
    "C": ("Kölgəli səki", "Kölgəli piyada marşrutları", 4),
    "D": ("Cib parkı və oturacaq", "Cib parkları şəbəkəsi", 4),
    "E": ("Dayanacağı yaxınlaşdırmaq", "Dayanacaq şəbəkəsini sıxlaşdırmaq", 6),
    "F": ("Məhəllə keçidi", "Dalanları birləşdirən keçidlər", 7),
    "G": ("Gündəlik xidmət yaxında", "Məhəllə xidmət nöqtələri", 7),
    "H": ("Maneəsiz yamac", "Maneəsiz yamaclar", 1),
    "I": ("Quru səki", "Səki drenajı", 8),
}


def block_solutions(r, lst_city):
    """Blokun göstəricilərinə görə piyada həlləri və ciddilik (0..100); ən ciddi 3-ü."""
    out = []
    gap = r.major_m / (r.cross_n + 1)
    if r.major_m >= 300 and gap >= 250:
        out.append(("A", min(100, gap / 5) * 0.7 + 30 * (r.under_n > 0) + 0.3 * r.p_car))
    if r.school_m <= 700 and r.major_m >= 200:
        out.append(("B", 45 + 0.45 * r.p_car))
    if r.p_heat >= 60 or (r.p_green_gap >= 67 and r.lst >= lst_city):
        out.append(("C", 0.9 * max(r.p_heat, r.p_green_gap)))
    if r.park_m >= 500 and r.p_green_gap >= 50:
        out.append(("D", min(100, r.park_m / 12) * 0.6 + 0.3 * r.p_green_gap))
    if r.stop_m >= 400:
        out.append(("E", min(100, r.stop_m / 10)))
    if r.p_fragment >= 67:
        out.append(("F", 0.85 * r.p_fragment))
    if r.shop_m >= 400 or r.p_service_gap >= 67:
        out.append(("G", max(0.9 * r.p_service_gap, min(100, r.shop_m / 8))))
    if r.p_slope >= 75 and r.slope >= 4:
        out.append(("H", 0.8 * r.p_slope))
    if r.p_lowland >= 80 and r.elev <= -10:
        out.append(("I", 0.7 * r.p_lowland))
    out = [x for x in sorted(out, key=lambda t: -t[1]) if x[1] >= 45][:3]
    return ",".join(k for k, _ in out)


def rank(v):
    return pd.Series(v).rank(method="average").sub(1).div(len(v) - 1).mul(100).values


def main():
    B = gpd.read_file(ROOT / "data-raw/zoning/blocks_attr.gpkg")
    L = B[B["pop"] >= LIVE].copy()
    for c in ["lst", "ndvi", "green_pct", "elev", "slope", "deadend_pct"]:
        L[c] = L[c].fillna(L.groupby("rayon")[c].transform("median")).fillna(L[c].median())
    P = pd.DataFrame(index=L.index)
    P["heat"] = rank(L.lst)
    P["green_gap"] = rank(-L.green_pct)
    P["transit_gap"] = rank(L.stop_m)
    P["fragment"] = (rank(L.deadend_pct) + rank(-L.inter_km2)) / 2
    P["car"] = rank(L.major_km2)
    P["slope"] = rank(L.slope)
    P["lowland"] = rank(-L.elev)
    P["service_gap"] = rank(-L.svc_500)
    for k in KEYS:
        L["p_" + k] = P[k].round().astype(int)
    L["need"] = P.mean(axis=1).round(1)
    L["overlap"] = (P >= WORST).sum(axis=1)
    lst_city = float((L.lst * L["pop"]).sum() / L["pop"].sum())
    L["sol"] = [block_solutions(r, lst_city) for r in L.itertuples()]

    # ---- qonşuluq qrafı
    L = L.reset_index(drop=True)
    n = len(L)
    geo = L.geometry.buffer(20)
    pairs = gpd.sjoin(gpd.GeoDataFrame(geometry=geo), gpd.GeoDataFrame(geometry=geo), predicate="intersects")
    pairs = pairs[pairs.index < pairs.index_right]
    X = (P.values / 100)
    X = (X - X.mean(0)) / X.std(0)
    a, b = pairs.index.values, pairs.index_right.values
    w = np.linalg.norm(X[a] - X[b], axis=1) + 1e-6
    G = coo_matrix((w, (a, b)), shape=(n, n)).tocsr()
    T = minimum_spanning_tree(G + G.T).tocoo()
    adj = defaultdict(set)
    for i, j in zip(T.row, T.col):
        adj[i].add(j)
        adj[j].add(i)
    pop = L["pop"].values.astype(float)

    def ssd(idx):
        wv = pop[idx][:, None]
        m = (wv * X[idx]).sum(0) / wv.sum()
        return float((wv * (X[idx] - m) ** 2).sum())

    def split(nodes):
        """Ən yaxşı kəsilən kənar: iki hissə, hər biri >= MIN_POP."""
        nodes = list(nodes)
        S = set(nodes)
        root = nodes[0]
        parent, order, stack = {root: None}, [], [root]
        while stack:
            u = stack.pop()
            order.append(u)
            for v in adj[u]:
                if v in S and v not in parent:
                    parent[v] = u
                    stack.append(v)
        sp = {u: pop[u] for u in order}
        sx = {u: pop[u] * X[u] for u in order}
        sxx = {u: pop[u] * X[u] ** 2 for u in order}
        for u in reversed(order):
            p = parent[u]
            if p is not None:
                sp[p] += sp[u]
                sx[p] = sx[p] + sx[u]
                sxx[p] = sxx[p] + sxx[u]
        Ptot, Xtot, XXtot = sp[root], sx[root], sxx[root]
        f = lambda P_, X_, XX_: float((XX_ - X_ ** 2 / P_).sum()) if P_ > 0 else 0.0
        base = f(Ptot, Xtot, XXtot)
        best, gain = None, -1
        for u in order:
            if parent[u] is None:
                continue
            p1 = sp[u]
            p2 = Ptot - p1
            if p1 < MIN_POP or p2 < MIN_POP:
                continue
            g = base - f(p1, sx[u], sxx[u]) - f(p2, Xtot - sx[u], XXtot - sxx[u])
            # balans: çox kiçik hissə qoparmamaq üçün
            g *= 1 + 0.5 * min(p1, p2) / Ptot
            if g > gain:
                best, gain = u, g
        if best is None:
            return None
        sub, stack = {best}, [best]
        while stack:
            u = stack.pop()
            for v in adj[u]:
                if v in S and v not in sub and parent.get(v) == u:
                    sub.add(v)
                    stack.append(v)
        return sub, S - sub

    ncomp, lab = connected_components(G + G.T, directed=False)
    todo = [set(np.where(lab == c)[0]) for c in range(ncomp)]
    zones = []
    while todo:
        z = todo.pop()
        if pop[list(z)].sum() > MAX_POP:
            r = split(z)
            if r:
                todo.extend(r)
                continue
        zones.append(sorted(z))
    zid = np.zeros(n, int)
    zones.sort(key=lambda z: -pop[z].sum())
    for k, z in enumerate(zones, 1):
        zid[z] = k
    L["zone"] = zid
    print(f"zonalar: {len(zones)}; əhali median {np.median([pop[z].sum() for z in zones]):,.0f}; "
          f"<{MIN_POP}: {sum(pop[z].sum() < MIN_POP for z in zones)}; >{MAX_POP}: {sum(pop[z].sum() > MAX_POP for z in zones)}")

    # ---- adlar: OSM yaşayış yeri adları
    LL = L.to_crs(4326)
    bb = tuple(LL.total_bounds)
    places = gpd.read_file(OSM / "gis_osm_places_free_1.shp", bbox=bb)
    places = places[places.fclass.isin(["suburb", "neighbourhood", "village", "town", "quarter"]) & places.name.notna()].to_crs(L.crs)
    pa = gpd.read_file(OSM / "gis_osm_places_a_free_1.shp", bbox=bb)
    pa = pa[pa.fclass.isin(["suburb", "neighbourhood", "village", "town", "quarter"]) & pa.name.notna()].to_crs(L.crs)
    metro = gpd.read_file(OUT / "metro.geojson").to_crs(L.crs)
    metro = metro[metro.status == "işləyir"].reset_index(drop=True)
    ray = gpd.read_file(OUT / "baku_rayons.geojson").to_crs(L.crs)[["rayon", "geometry"]]
    places = gpd.sjoin(places, ray, predicate="within").drop(columns="index_right")
    pa["rp"] = pa.representative_point()
    pa = gpd.sjoin(pa.set_geometry("rp"), ray, predicate="within").drop(columns="index_right").set_geometry("geometry")

    # ---- zonalar
    Zg = L.dissolve(by="zone", as_index=False, aggfunc="first")[["zone", "geometry"]]
    rows = []
    used = Counter()
    for zone, grp in L.groupby("zone"):
        wp = grp["pop"]
        W = wp.sum()
        pm = {k: round(float((grp["p_" + k] * wp).sum() / W)) for k in KEYS}
        c = Zg.loc[Zg.zone == zone, "geometry"].iloc[0]
        cx = (grp.geometry.representative_point().x * wp).sum() / W
        cy = (grp.geometry.representative_point().y * wp).sum() / W
        cen = gpd.GeoSeries(gpd.points_from_xy([cx], [cy]), crs=L.crs)
        # ad: eyni rayonda yaşayış yeri (1,5 km), metro stansiyası (1,2 km), yaşayış yeri (3 km), poliqon, rayon
        rname = grp.rayon.mode().iloc[0]
        same = places[places.rayon == rname]
        d = same.distance(cen.iloc[0]) if len(same) else None
        dm = metro.distance(cen.iloc[0])
        if d is not None and d.min() <= 1500:
            name = same.name.iloc[int(d.values.argmin())]
        elif dm.min() <= 1200:
            name = f"{metro.name.iloc[int(dm.values.argmin())]} ətrafı"
        elif d is not None and d.min() <= 3000:
            name = same.name.iloc[int(d.values.argmin())]
        else:
            inside = pa[pa.intersects(c) & (pa.rayon == rname)]
            name = inside.assign(a=inside.intersection(c).area).sort_values("a").name.iloc[-1] if len(inside) else rname
        name = name.replace(" st. ", " ")
        used[name] += 1
        rows.append({"zone": zone, "name": name, "rayon": grp.rayon.mode().iloc[0], "pop": int(W), "blocks": len(grp),
                     "area_km2": round(float(grp.area_km2.sum()), 2), "need": round(float(sum(pm.values()) / len(KEYS)), 1),
                     **{"p_" + k: v for k, v in pm.items()},
                     "lst": round(float((grp.lst * wp).sum() / W), 1), "green_pct": round(float((grp.green_pct * wp).sum() / W), 1),
                     "stop_m": int((grp.stop_m * wp).sum() / W), "metro_m": int((grp.metro_m * wp).sum() / W),
                     "svc_500": round(float((grp.svc_500 * wp).sum() / W), 1), "inter_km2": round(float((grp.inter_km2 * wp).sum() / W)),
                     "lon": None, "lat": None, "_c": cen.to_crs(4326).iloc[0]})
    Z = pd.DataFrame(rows)
    # təkrarlanan adlara nömrə
    seen = Counter()
    for i, r in Z.sort_values("pop", ascending=False).iterrows():
        seen[r["name"]] += 1
        if used[r["name"]] > 1:
            Z.at[i, "name"] = f"{r['name']} {seen[r['name']]}"
    Z["lon"] = [round(p.x, 4) for p in Z._c]
    Z["lat"] = [round(p.y, 4) for p in Z._c]
    Z = Z.drop(columns="_c")
    # prioritet: əhali x ehtiyac
    Z["score"] = Z["pop"] * Z["need"]
    Z = Z.sort_values("score", ascending=False).reset_index(drop=True)
    Z["rank"] = range(1, len(Z) + 1)
    q1, q2 = np.percentile(Z.need, [33.3, 66.7])
    Z["level"] = np.where(Z.need >= q2, "yüksək", np.where(Z.need >= q1, "orta", "aşağı"))

    # zona proqramı: bloklardakı həllər, təsir etdikləri insan sayı ilə
    prog = {}
    for zone, grp in L.groupby("zone"):
        c = defaultdict(lambda: [0, 0])
        for sol, pp in zip(grp.sol, grp["pop"]):
            for k in filter(None, sol.split(",")):
                c[k][0] += 1
                c[k][1] += int(pp)
        prog[zone] = sorted(([k, v[0], v[1]] for k, v in c.items()), key=lambda t: -t[2])[:4]
    Z["program"] = Z.zone.map(prog)

    def recs(r):
        probs = sorted(((k, r["p_" + k]) for k in KEYS if r["p_" + k] >= 60), key=lambda t: -t[1])[:3]
        if not probs:
            probs = sorted(((k, r["p_" + k]) for k in KEYS), key=lambda t: -t[1])[:1]
        out, seen_r = [], set()
        for k, n_, pp in r["program"]:
            rid = SOLUTIONS[k][2]
            if rid not in seen_r:
                seen_r.add(rid)
                out.append({"rule": rid, "title": RULES[rid], "for": k, "action": SOLUTIONS[k][1]})
        if r["level"] == "yüksək" and 3 not in seen_r:
            out.append({"rule": 3, "title": RULES[3], "for": None, "action": "ilk sınaq bu zonada"})
        return {"problems": [[k, int(v)] for k, v in probs], "recs": out}

    R = Z.apply(recs, axis=1)
    Z["problems"] = [r["problems"] for r in R]
    Z["recs"] = [r["recs"] for r in R]

    # ---- yaz
    zmap = Z.set_index("zone")
    L["zone_rank"] = L.zone.map(zmap["rank"])
    blocks = L[["bid", "rayon", "pop", "area_km2", "lst", "green_pct", "elev", "slope", "inter_km2", "deadend_pct", "major_km2", "stop_m", "metro_m", "svc_500",
                "major_m", "cross_n", "under_n", "school_m", "kinder_m", "shop_m", "pharm_m", "park_m", "sol",
                *["p_" + k for k in KEYS], "need", "overlap", "zone_rank", "geometry"]].copy()
    blocks["geometry"] = blocks.geometry.simplify(6)
    blocks = blocks.to_crs(4326)
    for c in ["lst", "green_pct", "elev", "slope", "deadend_pct"]:
        blocks[c] = blocks[c].round(1)
    blocks.to_file(OUT / "zoning_blocks.geojson", driver="GeoJSON", COORDINATE_PRECISION=5)
    Zg["rank"] = Zg.zone.map(zmap["rank"])
    Zg["geometry"] = Zg.geometry.buffer(12).buffer(-12).simplify(10)
    zg = Zg.to_crs(4326).merge(Z[["rank", "name", "rayon", "pop", "need", "level", *["p_" + k for k in KEYS]]], on="rank")[["rank", "name", "rayon", "pop", "need", "level", *["p_" + k for k in KEYS], "geometry"]]
    zg.to_file(OUT / "zoning_zones.geojson", driver="GeoJSON", COORDINATE_PRECISION=5)
    summary = {
        "method": {"unit": "məhəllə bloku (əsas küçələr, dəmir yolu, sahil)", "blocks": int(len(B)), "live_blocks": int(n), "live_min_pop": LIVE,
                   "zone_pop": [MIN_POP, MAX_POP], "algorithm": "SKATER tipli regionalizasiya (qonşuluq + problem profili)",
                   "sources": {"pop": "WorldPop 2020 100 m → DSK 2024", "lst": "Landsat LC08 2026-08-01, 30 m", "relief": "SRTM 30 m",
                               "streets": "OSM (Geofabrik 2025-11-02)", "stops": "opendata.az + OSM", "services": "OSM (2GIS gələndə əvəz olunacaq)"}},
        "layers": {"heat": "İstilik stressi", "green_gap": "Yaşıllıq çatışmazlığı", "transit_gap": "Nəqliyyat boşluğu", "fragment": "Şəbəkə qırıqlığı",
                   "car": "Avtomobil hökmranlığı", "slope": "Relyef maneəsi", "lowland": "Alçaq sahil riski", "service_gap": "Xidmət çatışmazlığı"},
        "rules": RULES,
        "solutions": {k: {"title": v[0], "program": v[1], "rule": v[2]} for k, v in SOLUTIONS.items()},
        "lst_city": round(lst_city, 1),
        "solution_totals": {k: {"blocks": int(sum(k in s_.split(",") for s_ in L.sol)), "pop": int(sum(pp for s_, pp in zip(L.sol, L["pop"]) if k in s_.split(",")))} for k in SOLUTIONS},
        "pop": int(Z["pop"].sum()),
        "zones": json.loads(Z.drop(columns=["score"]).to_json(orient="records", force_ascii=False)),
    }
    (OUT / "zoning.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1))
    print(Z[["rank", "name", "rayon", "pop", "blocks", "need", "level"]].head(15).to_string())
    print("səviyyələr:", Z.level.value_counts().to_dict())
    print("qayda sayı:", Counter(x["rule"] for rs in Z.recs for x in rs))
    print("blok həlləri:", Counter(k for s_ in L.sol for k in filter(None, s_.split(","))), "həllsiz blok:", int((L.sol == "").sum()))


if __name__ == "__main__":
    sys.exit(main())
