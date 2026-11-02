"""2GIS Catalog API-dən hər 1 km hücrə üçün xam data toplayır (OSM əvəzinə).

Hər hücrə (baku_grid.geojson) üçün:
  poi        hücrə poliqonunda bütün təşkilatların (type=branch) sayı
  stops      hücrə poliqonunda ictimai nəqliyyat dayanacaqlarının (station_platform) sayı
  near_stop  yalnız sintez hücrələri (baku_synth): mərkəzdən ən yaxın dayanacağa düz məsafə, m
             (2 km-də dayanacaq yoxdursa 2000+ yazılır: None -> sonra 2500 qəbul edilir)

Nəticə data-raw/2gis/cells.json-a yazılır, hər 25 hücrədən bir saxlanılır və təkrar
işə salınanda qalan hücrələrdən davam edir. 429/403 gələndə dayanır (açarın limiti).

  TWOGIS_KEY=... python3 scripts/fetch_2gis.py
"""

import concurrent.futures as cf
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data-raw" / "2gis" / "cells.json"
KEY = os.environ.get("TWOGIS_KEY") or sys.exit("TWOGIS_KEY lazımdır")
API = "https://catalog.api.2gis.com/3.0/items"


class Quota(Exception):
    pass


def call(**params):
    url = API + "?" + urllib.parse.urlencode({**params, "key": KEY, "locale": "az_AZ"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                d = json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                raise Quota(f"HTTP {e.code}")
            time.sleep(2 ** attempt)
            continue
        except Exception:
            time.sleep(2 ** attempt)
            continue
        code = d["meta"]["code"]
        if code == 200:
            return d["result"]
        if code == 404:
            return {"total": 0, "items": []}
        if code in (403, 429):
            raise Quota(d["meta"].get("error"))
        raise RuntimeError(d["meta"])
    raise RuntimeError("şəbəkə xətası: " + url)


def wkt(ring):
    return "POLYGON((" + ",".join(f"{x:.6f} {y:.6f}" for x, y in ring) + "))"


def dist(lat1, lon1, lat2, lon2):
    p = math.pi / 180
    a = math.sin((lat2 - lat1) * p / 2) ** 2 + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(a))


def cell(f, synth):
    ring = f["geometry"]["coordinates"][0]
    poly = wkt(ring)
    out = {
        "poi": call(polygon=poly, type="branch", page_size=1)["total"],
        "stops": call(polygon=poly, type="station_platform", page_size=1)["total"],
    }
    if synth:
        pts = ring[:-1]
        lon = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        r = call(point=f"{lon:.6f},{lat:.6f}", radius=2000, type="station_platform", sort="distance", page_size=1, fields="items.point")
        it = [i for i in r.get("items", []) if i.get("point")]
        out["near_stop"] = round(dist(lat, lon, it[0]["point"]["lat"], it[0]["point"]["lon"])) if it else None
    return out


def main():
    grid = json.loads((ROOT / "public/data/baku_grid.geojson").read_text())["features"]
    synth_ids = {f["properties"]["id"] for f in json.loads((ROOT / "public/data/baku_synth.geojson").read_text())["features"]}
    done = json.loads(OUT.read_text()) if OUT.exists() else {}
    # əvvəl sintez hücrələri (analiz üçün vacib), sonra qalanlar
    todo = sorted((f for f in grid if str(f["properties"]["id"]) not in done), key=lambda f: f["properties"]["id"] not in synth_ids)
    print(f"{len(done)} hazır, {len(todo)} qalıb")
    n = 0
    try:
        with cf.ThreadPoolExecutor(4) as ex:
            futs = {ex.submit(cell, f, f["properties"]["id"] in synth_ids): f["properties"]["id"] for f in todo}
            for fu in cf.as_completed(futs):
                done[str(futs[fu])] = fu.result()
                n += 1
                if n % 25 == 0:
                    OUT.write_text(json.dumps(done, sort_keys=True))
                    print(f"  {len(done)}/{len(grid)}", flush=True)
    except Quota as e:
        print("Açarın limiti:", e)
        for fu in futs:
            fu.cancel()
    finally:
        OUT.write_text(json.dumps(done, sort_keys=True))
    print(f"Saxlandı: {len(done)}/{len(grid)}")


if __name__ == "__main__":
    main()
