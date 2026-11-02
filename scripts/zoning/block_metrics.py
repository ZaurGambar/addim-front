"""Addım 2: hər məhəllə bloku üçün göstəricilər.

  pop        WorldPop 2020 (100 m, constrained), rayon üzrə DSK 2024 cəminə kalibrlənmiş.
             Piksel 4x4 alt-pikselə bölünür ki, kiçik bloklar da öz payını alsın.
  lst, ndvi  Landsat C2 L2, 30 m (su, bulud, kölgə maskalanır); green_pct = NDVI > 0.3 payı
  elev, slope  SRTM 1" (30 m)
  inter_km2  piyada şəbəkəsində kəsişmə sıxlığı (dərəcə >= 3), dalan payı deadend_pct
  major_km2  blokun 150 m ətrafında magistral (motorway/trunk/primary) sıxlığı, km/km²
  stop_m     blokun əhali mərkəzindən ən yaxın avtobus dayanacağına (opendata.az + OSM), m
  metro_m    ən yaxın işləyən metro stansiyasına, m
  svc_500    500 m-də gündəlik xidmət sayı (OSM: market, aptek, məktəb, bağça, klinika ...)
  major_m    blokun 150 m ətrafında magistral uzunluğu, m
  cross_n    həmin magistralda yer üstü piyada keçidi sayı (OSM crossing / traffic_signals, yola 25 m)
  under_n    həmin ərazidə yeraltı keçid sayı (ADDIM siyahısı + OSM tuneldə piyada yolu)
  school_m, kinder_m, shop_m, pharm_m, park_m   ən yaxın məktəb, bağça, market, aptek, park (>= 0,5 ha), m

Giriş: data-raw/zoning/blocks_raw.gpkg; Çıxış: data-raw/zoning/blocks_attr.gpkg
"""

import json
import os
import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import rasterize
from rasterio.transform import Affine
from shapely.geometry import Point
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from calibrate_population import DSK_2024  # noqa: E402

SRC = ROOT / "data-raw" / "zoning" / "src"
OSM = Path(os.environ.get("OSM_DIR", "/Users/faritt0/Documents/QGIS/SeaBreeze/azerbaijan-251102-free.shp"))
SRTM = [Path(os.environ.get("SRTM_DIR", "/Users/faritt0/Documents/QGIS/SeaBreeze")) / n for n in ("N40E049.hgt", "N40E050.hgt")]
LANDSAT = Path(os.environ.get("LANDSAT_NPZ", "/private/tmp/claude-501/-Users-faritt0/0e3a8a6b-af38-4375-af80-6c8898552a3c/scratchpad/lscache/LC08_L2SP_166032_20260801_02_T1.npz"))
UTM = 32639
WALK = {"residential", "living_street", "unclassified", "tertiary", "tertiary_link", "secondary", "secondary_link", "primary", "primary_link",
        "footway", "pedestrian", "path", "steps", "service"}
MAJOR = {"motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link"}
DAILY = {"supermarket", "convenience", "pharmacy", "school", "kindergarten", "clinic", "doctors", "dentist", "hospital", "bakery",
         "greengrocer", "butcher", "bank", "atm", "post_office", "hairdresser", "library", "community_centre", "playground", "mall", "department_store"}


def zonal(blocks_in_crs, shape, transform, values, ok, sub=1, how="mean"):
    """Blok id-lərini rastra yazır və hər blok üçün orta / cəm qaytarır."""
    if sub > 1:
        transform = transform * Affine.scale(1 / sub)
        shape = (shape[0] * sub, shape[1] * sub)
        values = np.repeat(np.repeat(values, sub, 0), sub, 1) / (sub * sub if how == "sum" else 1)
        ok = np.repeat(np.repeat(ok, sub, 0), sub, 1)
    ids = rasterize(((g, i + 1) for i, g in enumerate(blocks_in_crs.geometry)), out_shape=shape, transform=transform, fill=0, dtype="int32")
    m = (ids > 0) & ok
    n = len(blocks_in_crs) + 1
    s = np.bincount(ids[m], weights=values[m], minlength=n)
    if how == "sum":
        return s[1:]
    c = np.bincount(ids[m], minlength=n)
    with np.errstate(all="ignore"):
        return (s / c)[1:]


def main():
    B = gpd.read_file(ROOT / "data-raw/zoning/blocks_raw.gpkg")
    bb = tuple(B.to_crs(4326).total_bounds)

    # --- əhali
    with rasterio.open(SRC / "aze_ppp_2020_constrained.tif") as r:
        w = rasterio.windows.from_bounds(*bb, r.transform).round_offsets().round_lengths()
        pop = r.read(1, window=w).astype("f8")
        tr = r.window_transform(w)
        nod = r.nodata
    ok = np.isfinite(pop) & (pop >= 0) & (pop != nod)
    pop[~ok] = 0
    B4 = B.to_crs(4326)
    wp = zonal(B4, pop.shape, tr, pop, ok, sub=4, how="sum")
    B["wp2020"] = wp
    k = {r: DSK_2024[r] * 1000 / B.loc[B.rayon == r, "wp2020"].sum() for r in DSK_2024 if (B.rayon == r).any()}
    B["pop"] = (B.wp2020 * B.rayon.map(k)).round().astype(int)
    print("kalibrləmə əmsalı:", {r: round(v, 2) for r, v in k.items()})

    # --- Landsat
    z = np.load(LANDSAT, allow_pickle=True)
    lst = z["lwir11"].astype("f8") * 0.00341802 + 149 - 273.15
    red = z["red"].astype("f8") * 2.75e-05 - 0.2
    nir = z["nir08"].astype("f8") * 2.75e-05 - 0.2
    with np.errstate(all="ignore"):
        ndvi = np.clip((nir - red) / (nir + red), -1, 1)
    qa = z["qa_pixel"]
    bad = (z["lwir11"] == 0) | ((qa >> 7) & 1).astype(bool)
    for bit in (1, 2, 3, 4):
        bad |= ((qa >> bit) & 1).astype(bool)
    ltr = Affine(*z["transform"])
    BL = B.to_crs(str(z["crs"]))
    B["lst"] = zonal(BL, lst.shape, ltr, lst, ~bad).round(1)
    B["ndvi"] = zonal(BL, ndvi.shape, ltr, ndvi, ~bad).round(3)
    B["green_pct"] = (100 * zonal(BL, ndvi.shape, ltr, (ndvi > 0.3).astype("f8"), ~bad)).round(1)

    # --- SRTM
    els, trs = [], []
    for p in SRTM:
        with rasterio.open(p) as r:
            els.append(r.read(1).astype("f8"))
            trs.append(r.transform)
    el = np.hstack([els[0][:, :-1], els[1]])  # bitişik plitələr (ortaq sütun)
    etr = trs[0]
    dy = 6371000 * np.radians(abs(etr.e))
    dx = 6371000 * np.radians(etr.a) * np.cos(np.radians(40.4))
    gy, gx = np.gradient(el, dy, dx)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))
    eok = el > -1000
    B["elev"] = zonal(B4, el.shape, etr, el, eok).round(1)
    B["slope"] = zonal(B4, slope.shape, etr, slope, eok).round(1)

    # --- küçə şəbəkəsi
    R = gpd.read_file(OSM / "gis_osm_roads_free_1.shp", bbox=bb).to_crs(UTM)
    walk = R[R.fclass.isin(WALK) & (R.tunnel != "T")]
    net = unary_union(list(walk.geometry))  # planar node: hər kəsişmədə bölünür
    segs = list(getattr(net, "geoms", [net]))
    ends = {}
    for s in segs:
        for c in (s.coords[0], s.coords[-1]):
            key = (round(c[0]), round(c[1]))
            ends[key] = ends.get(key, 0) + 1
    nodes = gpd.GeoDataFrame({"deg": list(ends.values())}, geometry=[Point(k) for k in ends], crs=UTM)
    nodes = nodes[nodes.deg != 2]
    j = gpd.sjoin(nodes, B[["bid", "geometry"]], predicate="within")
    g = j.groupby("bid").deg
    inter = g.apply(lambda d: (d >= 3).sum())
    dead = g.apply(lambda d: (d == 1).sum())
    B["inter_km2"] = (B.bid.map(inter).fillna(0) / B.area_km2).round(1)
    tot = B.bid.map(inter).fillna(0) + B.bid.map(dead).fillna(0)
    B["deadend_pct"] = (100 * B.bid.map(dead).fillna(0) / tot.where(tot > 0)).round(1)

    major = R[R.fclass.isin(MAJOR)]
    buf = B.geometry.buffer(150)
    mj = gpd.sjoin(gpd.GeoDataFrame(geometry=major.geometry, crs=UTM), gpd.GeoDataFrame({"bid": B.bid}, geometry=buf, crs=UTM), predicate="intersects")
    bufmap = dict(zip(B.bid, buf))
    mj["len"] = [geom.intersection(bufmap[b]).length for geom, b in zip(mj.geometry, mj.bid)]
    B["major_km2"] = (B.bid.map(mj.groupby("bid")["len"].sum()).fillna(0) / 1000 / (buf.area / 1e6)).round(2)

    # --- əhali mərkəzi (blok poliqonunda 100 m əhali pikselləri ilə çəkili)
    pts = B.representative_point()

    # --- nəqliyyat
    od = gpd.read_file(ROOT / "public/data/od_bus_stops.geojson").to_crs(UTM)
    T = gpd.read_file(OSM / "gis_osm_transport_free_1.shp", bbox=bb).to_crs(UTM)
    osm_stops = T[T.fclass.isin(["bus_stop", "bus_station"])]
    stops = gpd.GeoDataFrame(geometry=list(od.geometry) + list(osm_stops.geometry), crs=UTM)
    B["stop_m"] = gpd.sjoin_nearest(gpd.GeoDataFrame({"bid": B.bid}, geometry=pts, crs=UTM), stops, distance_col="d").groupby("bid").d.min().reindex(B.bid).round().values
    M = gpd.read_file(ROOT / "public/data/metro.geojson").to_crs(UTM)
    M = M[M.status == "işləyir"]
    B["metro_m"] = gpd.sjoin_nearest(gpd.GeoDataFrame({"bid": B.bid}, geometry=pts, crs=UTM), M[["geometry"]], distance_col="d").groupby("bid").d.min().reindex(B.bid).round().values

    # --- gündəlik xidmətlər (OSM; 2GIS gələndə əvəz olunacaq)
    P = gpd.read_file(OSM / "gis_osm_pois_free_1.shp", bbox=bb)
    Pa = gpd.read_file(OSM / "gis_osm_pois_a_free_1.shp", bbox=bb)
    Pa["geometry"] = Pa.to_crs(UTM).representative_point().to_crs(4326)
    P = gpd.GeoDataFrame(list(P[P.fclass.isin(DAILY)].geometry) + list(Pa[Pa.fclass.isin(DAILY)].geometry), columns=["geometry"], crs=4326).to_crs(UTM)
    sv = gpd.sjoin(P, gpd.GeoDataFrame({"bid": B.bid}, geometry=pts.buffer(500), crs=UTM), predicate="within")
    B["svc_500"] = B.bid.map(sv.groupby("bid").size()).fillna(0).astype(int)

    # --- insan miqyası: keçidlər, yeraltı keçidlər, gündəlik yerlərə məsafə
    B["major_m"] = B.bid.map(mj.groupby("bid")["len"].sum()).fillna(0).round().astype(int)
    tr = gpd.read_file(OSM / "gis_osm_traffic_free_1.shp", bbox=bb).to_crs(UTM)
    cr = tr[tr.fclass.isin(["crossing", "traffic_signals"])]
    near_major = unary_union(list(major.geometry)).buffer(25)
    cr = cr[cr.within(near_major)]
    cj = gpd.sjoin(cr[["geometry"]], gpd.GeoDataFrame({"bid": B.bid}, geometry=buf, crs=UTM), predicate="within")
    B["cross_n"] = B.bid.map(cj.groupby("bid").size()).fillna(0).astype(int)
    up = gpd.read_file(ROOT / "public/data/underpasses.geojson").to_crs(UTM)[["geometry"]]
    ft = R[R.fclass.isin(["footway", "steps", "path", "pedestrian"]) & (R.tunnel == "T")]
    ft = gpd.GeoDataFrame(geometry=ft.geometry.centroid, crs=UTM)
    ft = ft[ft.within(near_major)]
    U = gpd.GeoDataFrame(geometry=list(up.geometry) + list(ft.geometry), crs=UTM)
    U = U[~U.geometry.buffer(60).duplicated()] if len(U) else U
    uj = gpd.sjoin(U, gpd.GeoDataFrame({"bid": B.bid}, geometry=buf, crs=UTM), predicate="within")
    B["under_n"] = B.bid.map(uj.groupby("bid").size()).fillna(0).astype(int)

    allp = gpd.GeoDataFrame(
        {"fclass": list(gpd.read_file(OSM / "gis_osm_pois_free_1.shp", bbox=bb).fclass) + list(Pa.fclass)},
        geometry=list(gpd.read_file(OSM / "gis_osm_pois_free_1.shp", bbox=bb).to_crs(UTM).geometry) + list(Pa.to_crs(UTM).geometry),
        crs=UTM,
    )
    lu = gpd.read_file(OSM / "gis_osm_landuse_a_free_1.shp", bbox=bb).to_crs(UTM)
    parks = lu[(lu.fclass == "park") & (lu.area >= 5000)]
    targets = {
        "school_m": allp[allp.fclass == "school"],
        "kinder_m": allp[allp.fclass == "kindergarten"],
        "shop_m": allp[allp.fclass.isin(["supermarket", "convenience", "greengrocer", "bakery", "butcher"])],
        "pharm_m": allp[allp.fclass == "pharmacy"],
        "park_m": gpd.GeoDataFrame(geometry=parks.geometry.boundary, crs=UTM),
    }
    PT = gpd.GeoDataFrame({"bid": B.bid}, geometry=pts, crs=UTM)
    for col, T_ in targets.items():
        T_ = T_[["geometry"]].reset_index(drop=True)
        d = gpd.sjoin_nearest(PT, T_, distance_col="d").groupby("bid").d.min().reindex(B.bid).values
        B[col] = np.round(d)
    inpark = gpd.sjoin(PT, parks[["geometry"]], predicate="within").bid.unique()
    B.loc[B.bid.isin(inpark), "park_m"] = 0

    B.to_file(ROOT / "data-raw/zoning/blocks_attr.gpkg", driver="GPKG")
    live = B[B["pop"] >= 100]
    print(f"bloklar {len(B)}, insan yaşayan (>=100) {len(live)}, əhali {B['pop'].sum():,} ({live['pop'].sum():,} yaşayan bloklarda)")
    print(live[["pop", "lst", "ndvi", "green_pct", "elev", "slope", "inter_km2", "deadend_pct", "major_km2", "stop_m", "metro_m", "svc_500", "major_m", "cross_n", "under_n", "school_m", "kinder_m", "shop_m", "pharm_m", "park_m"]].describe().round(1).to_string())


if __name__ == "__main__":
    sys.exit(main())
