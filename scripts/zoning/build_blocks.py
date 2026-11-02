"""Addım 1: məhəllə blokları.

Əsas küçələr (trunk, primary, secondary, tertiary + link), dəmir yolu, sahil və rayon
sərhədləri ilə əhatələnmiş poliqonlar. 2 km²-dən böyük və ya 5 000-dən çox insan yaşayan bloklar
daxili küçələrlə bölünür (əvvəl residential/unclassified, lazım olsa living_street/service). 0,01 km²-dən kiçik qırıntılar qonşuya birləşdirilir.

Giriş: Geofabrik Azerbaijan OSM (OSM_DIR), public/data/baku_rayons.geojson
Çıxış: data-raw/zoning/blocks_raw.gpkg
"""

import os
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString
from shapely.ops import polygonize, unary_union

ROOT = Path(__file__).resolve().parents[2]
OSM = Path(os.environ.get("OSM_DIR", "/Users/faritt0/Documents/QGIS/SeaBreeze/azerbaijan-251102-free.shp"))
OUT = ROOT / "data-raw" / "zoning"
OUT.mkdir(parents=True, exist_ok=True)
UTM = 32639  # UTM 39N, metr

MAIN = {"motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link", "secondary", "secondary_link", "tertiary", "tertiary_link"}
INNER = [{"residential", "unclassified"}, {"residential", "unclassified", "living_street", "service"}]
SPLIT_KM2 = 2.0
SPLIT_POP = 5000  # bundan çox insan yaşayan blok daxili küçələrlə bölünür (WorldPop 2020)
SLIVER_KM2 = 0.01


def main():
    ray = gpd.read_file(ROOT / "public/data/baku_rayons.geojson").to_crs(UTM)
    land = unary_union(ray.geometry.buffer(0))
    bbox = tuple(gpd.GeoSeries([land], crs=UTM).to_crs(4326).total_bounds)
    roads = gpd.read_file(OSM / "gis_osm_roads_free_1.shp", bbox=bbox).to_crs(UTM)
    rail = gpd.read_file(OSM / "gis_osm_railways_free_1.shp", bbox=bbox).to_crs(UTM)
    rail = rail[rail.fclass.isin(["rail", "subway", "light_rail", "narrow_gauge"]) & (rail.tunnel != "T")]
    main_lines = list(roads[roads.fclass.isin(MAIN) & (roads.tunnel != "T")].geometry) + list(rail.geometry)
    edges = main_lines + [g.boundary for g in ray.geometry]  # rayon sərhədi və sahil
    print("xətlər:", len(main_lines))
    merged = unary_union(edges)
    polys = [p for p in polygonize(merged) if land.intersection(p.representative_point()).is_empty is False]
    blocks = gpd.GeoDataFrame(geometry=polys, crs=UTM)
    blocks["geometry"] = blocks.geometry.intersection(land)
    blocks = blocks[blocks.area > 0].explode(index_parts=False).reset_index(drop=True)
    print("ilkin bloklar:", len(blocks))

    # böyük (sahə və ya əhali) blokları daxili küçələrlə böl
    import numpy as np
    import rasterio
    from rasterio.features import rasterize

    with rasterio.open(ROOT / "data-raw/zoning/src/aze_ppp_2020_constrained.tif") as r:
        w = rasterio.windows.from_bounds(*bbox, r.transform).round_offsets().round_lengths()
        wp = r.read(1, window=w).astype("f8")
        wtr = r.window_transform(w)
    wp[~np.isfinite(wp) | (wp < 0)] = 0
    ys, xs = np.nonzero(wp)
    px = gpd.GeoDataFrame({"v": wp[ys, xs]}, geometry=gpd.points_from_xy(*rasterio.transform.xy(wtr, ys, xs)), crs=4326).to_crs(UTM)

    def popof(gdf):
        j = gpd.sjoin(px, gdf[["geometry"]], predicate="within")
        return j.groupby("index_right").v.sum().reindex(gdf.index).fillna(0)

    def cut(g, kinds):
        ls = list(roads[roads.fclass.isin(kinds) & roads.intersects(g)].geometry)
        if not ls:
            return [g]
        pp = [p.intersection(g) for p in polygonize(unary_union(ls + [g.boundary])) if g.contains(p.representative_point())]
        return [p for p in pp if p.area > 0] or [g]

    for kinds in INNER:
        blocks["wp"] = popof(blocks)
        big = (blocks.area > SPLIT_KM2 * 1e6) | (blocks.wp > SPLIT_POP)
        parts = [blocks.loc[~big, ["geometry"]]]
        for g in blocks[big].geometry:
            parts.append(gpd.GeoDataFrame(geometry=cut(g, kinds), crs=UTM))
        blocks = gpd.GeoDataFrame(pd.concat(parts, ignore_index=True), geometry="geometry", crs=UTM).explode(index_parts=False).reset_index(drop=True)
        print(f"bölmə ({len(kinds)} növ küçə): {int(big.sum())} blok bölündü -> {len(blocks)}")

    # qırıntıları ən uzun ortaq sərhədli qonşuya birləşdir
    for _ in range(3):
        small = blocks.index[blocks.area < SLIVER_KM2 * 1e6]
        if not len(small):
            break
        sidx = blocks.sindex
        drop = set()
        geoms = blocks.geometry.copy()
        for i in small:
            if i in drop:
                continue
            g = geoms[i]
            best, bl = None, 0
            for j in sidx.query(g, predicate="intersects"):
                if j == i or j in drop or geoms[j].area < SLIVER_KM2 * 1e6 and geoms[j].area < g.area:
                    continue
                L = g.boundary.intersection(geoms[j].boundary).length
                if L > bl:
                    best, bl = j, L
            if best is not None and bl > 0:
                geoms[best] = geoms[best].union(g)
                drop.add(i)
        blocks = gpd.GeoDataFrame(geometry=geoms.drop(index=list(drop)), crs=UTM).reset_index(drop=True)
    blocks["geometry"] = blocks.geometry.buffer(0)
    blocks = blocks.explode(index_parts=False).reset_index(drop=True)
    blocks = blocks[blocks.area >= 2000].reset_index(drop=True)  # 0,002 km²-dən kiçik qalanları at
    blocks["area_km2"] = (blocks.area / 1e6).round(4)
    # rayon
    rp = blocks.representative_point()
    j = gpd.sjoin(gpd.GeoDataFrame(geometry=rp, crs=UTM), ray[["rayon", "geometry"]], how="left", predicate="within")
    blocks["rayon"] = j.groupby(level=0).rayon.first()
    blocks["bid"] = range(1, len(blocks) + 1)
    blocks.to_file(OUT / "blocks_raw.gpkg", driver="GPKG")
    a = blocks.area_km2
    print(f"bloklar: {len(blocks)}; sahə km² median {a.median():.3f}, p90 {a.quantile(.9):.2f}, max {a.max():.1f}")
    print(blocks.rayon.value_counts().to_dict())


if __name__ == "__main__":
    sys.exit(main())
