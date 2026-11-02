"""Bakı analizinin səth temperaturu (LST) və NDVI qatlarını yeni Landsat şəklinə keçirir.

Üsul (fərq üsulu): hər hücrə və rayon üçün
    yeni = köhnə + (orta_yeni_şəkil - orta_köhnə_şəkil)
Hər iki ortanı eyni piksellər üzərində hesablayırıq (hər iki şəkildə su, bulud,
bulud kölgəsi və boş piksel olmayan piksellər). Belə olanda ilk emaldakı kiçik üsul
fərqləri silinir, yalnız il fərqi qalır.

Yenilənir: baku_grid.geojson (lst, ndvi), baku_rayons.geojson və baku_analysis.json
(lst_mean, lst_p90, ndvi_mean, green_pct, uhi), şəhər (lst_popw, green_pct_popw,
landsat_scene). uhi = rayonun lst_mean - şəhərin əhaliyə görə çəkili LST-si.
Sintez faylları (baku_synth.*) bundan sonra scripts/update_synthesis.py ilə yenilənir.

Asılılıqlar: numpy rasterio pystac-client planetary-computer shapely pyproj
  python3 scripts/update_landsat.py LC08_L2SP_166032_20260801_02_T1 [--cache DIR]
"""

import argparse
import json
from pathlib import Path

import numpy as np
import planetary_computer
import pystac_client
import rasterio
from affine import Affine
from pyproj import Transformer
from rasterio.features import geometry_mask
from rasterio.windows import from_bounds
from shapely.geometry import mapping, shape
from shapely.ops import transform as stx

DATA = Path(__file__).resolve().parent.parent / "public" / "data"
STAC = "https://planetarycomputer.microsoft.com/api/stac/v1"
GREEN_NDVI = 0.3


def load_json(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def save_json(name, data):
    fmt = {"indent": 1} if name.endswith(".json") else {"separators": (",", ":")}
    (DATA / name).write_text(json.dumps(data, ensure_ascii=False, **fmt), encoding="utf-8")


def fetch(scene, bounds, cache):
    path = Path(cache) / f"{scene}.npz" if cache else None
    if path and path.exists():
        z = np.load(path, allow_pickle=True)
        return {k: z[k] for k in z.files}
    cat = pystac_client.Client.open(STAC, modifier=planetary_computer.sign_inplace)
    item = cat.get_collection("landsat-c2-l2").get_item(scene)
    out = {}
    for band in ["lwir11", "red", "nir08", "qa_pixel"]:
        with rasterio.open(item.assets[band].href) as src:
            t = Transformer.from_crs(4326, src.crs, always_xy=True)
            x0, y0 = t.transform(bounds[0], bounds[1])
            x1, y1 = t.transform(bounds[2], bounds[3])
            w = from_bounds(x0, y0, x1, y1, src.transform).round_offsets().round_lengths()
            out[band] = src.read(1, window=w)
            out["transform"] = np.array(src.window_transform(w))[:6]
            out["crs"] = src.crs.to_string()
    if path:
        path.parent.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(path, **out)
    return out


def prepare(z):
    lst = z["lwir11"].astype("f8") * 0.00341802 + 149 - 273.15
    red = z["red"].astype("f8") * 2.75e-05 - 0.2
    nir = z["nir08"].astype("f8") * 2.75e-05 - 0.2
    with np.errstate(all="ignore"):
        ndvi = np.clip((nir - red) / (nir + red), -1, 1)
    qa = z["qa_pixel"]
    bad = (z["lwir11"] == 0) | ((qa >> 7) & 1).astype(bool)  # boş və ya su
    for bit in (1, 2, 3, 4):  # genişləndirilmiş bulud, sirrus, bulud, kölgə
        bad |= ((qa >> bit) & 1).astype(bool)
    return {"lst": lst, "ndvi": ndvi, "bad": bad, "tr": Affine(*z["transform"]), "crs": str(z["crs"])}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scene")
    ap.add_argument("--cache")
    args = ap.parse_args()

    analysis = load_json("baku_analysis.json")
    C = analysis["city"]
    old_scene = C["landsat_scene"]
    if old_scene == args.scene:
        raise SystemExit(f"Data artıq {args.scene} şəklindədir.")

    grid = load_json("baku_grid.geojson")
    rayons_geo = load_json("baku_rayons.geojson")
    pts = [p for f in grid["features"] for p in f["geometry"]["coordinates"][0]]
    bounds = (min(p[0] for p in pts) - 0.02, min(p[1] for p in pts) - 0.02,
              max(p[0] for p in pts) + 0.02, max(p[1] for p in pts) + 0.02)

    a, b = prepare(fetch(old_scene, bounds, args.cache)), prepare(fetch(args.scene, bounds, args.cache))
    assert a["lst"].shape == b["lst"].shape and a["tr"] == b["tr"], "şəkillər eyni torda deyil"
    ok = ~(a["bad"] | b["bad"])
    to_utm = Transformer.from_crs(4326, a["crs"], always_xy=True).transform

    def mask(geom):
        return ~geometry_mask([mapping(stx(to_utm, shape(geom)))], out_shape=ok.shape, transform=a["tr"]) & ok

    # --- hücrələr ---
    kept, d_cells = 0, []
    for f in grid["features"]:
        p = f["properties"]
        if p["lst"] is None:
            continue
        m = mask(f["geometry"])
        if not m.any():
            kept += 1
            continue
        dl = b["lst"][m].mean() - a["lst"][m].mean()
        dn = b["ndvi"][m].mean() - a["ndvi"][m].mean()
        d_cells.append((p["pop"], dl))
        p["lst"] = round(p["lst"] + dl, 1)
        p["ndvi"] = round(min(1.0, max(-1.0, p["ndvi"] + dn)), 3)

    # --- şəhər ---
    wp = sum(w for w, _ in d_cells)
    C["lst_popw"] = round(C["lst_popw"] + sum(w * d for w, d in d_cells) / wp, 1)

    # --- rayonlar ---
    new = {}
    for f in rayons_geo["features"]:
        p, m = f["properties"], mask(f["geometry"])
        new[p["rayon"]] = {
            "lst_mean": round(p["lst_mean"] + b["lst"][m].mean() - a["lst"][m].mean(), 1),
            "lst_p90": round(p["lst_p90"] + np.percentile(b["lst"][m], 90) - np.percentile(a["lst"][m], 90), 1),
            "ndvi_mean": round(p["ndvi_mean"] + b["ndvi"][m].mean() - a["ndvi"][m].mean(), 3),
            "green_pct": round(max(0.0, p["green_pct"] + 100 * (np.mean(b["ndvi"][m] > GREEN_NDVI) - np.mean(a["ndvi"][m] > GREEN_NDVI))), 1),
        }
        new[p["rayon"]]["uhi"] = round(new[p["rayon"]]["lst_mean"] - C["lst_popw"], 1)
    for p in [f["properties"] for f in rayons_geo["features"]] + analysis["rayons"]:
        p.update(new[p["rayon"]])

    pops = {p["rayon"]: p["pop"] for p in analysis["rayons"]}
    C["green_pct_popw"] = round(sum(new[r]["green_pct"] * pops[r] for r in pops) / sum(pops.values()), 1)
    C["landsat_scene"] = args.scene

    save_json("baku_grid.geojson", grid)
    save_json("baku_rayons.geojson", rayons_geo)
    save_json("baku_analysis.json", analysis)
    print(f"{old_scene} → {args.scene}; hücrə yeniləndi: {len(d_cells)}, köhnə qaldı (təmiz piksel yox): {kept}")
    print(f"şəhər LST (əhaliyə görə): {C['lst_popw']} °C, yaşıllıq: {C['green_pct_popw']}%")


if __name__ == "__main__":
    main()
