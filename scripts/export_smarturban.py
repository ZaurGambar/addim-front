"""ADDIM datasını SmartUrban backend-inin SeedData qovluğuna ixrac edir (əlçatanlıq / əlillik fokusu).

Çıxış (smarturban-be/src/SmartUrban.Api/SeedData/):
  access_summary.json   şəhər üzrə: 4 profil × xidmət çatımı, qruplar, rayonlar, maneələr, ssenarilər, metod
  access_zones.json     237 planlama zonası: əhali, əlilliyi olanların təxmini sayı, zəiflik indeksi (SVI),
                        profil üzrə 10 dəq çatım balı, çatmayan xidmətlər, tədbir paketi, sadələşdirilmiş poliqon
  access_barriers.json  83 yeraltı keçid və > 8% yamaclı piyada şəbəkəsi nöqtələri (marşrut yoxlaması üçün)

Əvvəlcə: scripts/inclusive_access.py, scripts/planning_lens.py
  python3 scripts/export_smarturban.py [--out <SeedData qovluğu>]
"""
import argparse
import json
from pathlib import Path

from shapely.geometry import mapping, shape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
DEFAULT_OUT = ROOT.parent / "smarturban-be" / "src" / "SmartUrban.Api" / "SeedData"


def rnd(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 5), round(coords[1], 5)]
    return [rnd(c) for c in coords]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    out = Path(ap.parse_args().out)
    out.mkdir(parents=True, exist_ok=True)

    inc = json.load(open(DATA / "inclusive_access.json"))
    lens = json.load(open(DATA / "planning_lens.json"))
    zoning = json.load(open(DATA / "zoning.json"))
    zgeo = {f["properties"]["rank"]: f["geometry"] for f in json.load(open(DATA / "zoning_zones.geojson"))["features"]}
    svi = {z["rank"]: z for z in lens["zones"]}
    zinfo = {z["rank"]: z for z in zoning["zones"]}

    zones = []
    for z in inc["zones"]:
        k = z["rank"]
        g = shape(zgeo[k]).simplify(0.0004, preserve_topology=True)
        s = svi.get(k, {})
        zones.append({
            "id": k, "name": z["name"], "rayon": z["rayon"], "pop": z["pop"],
            "disabled": z["disabled"], "vulnPop": z["vuln_pop"], "svi": s.get("svi"),
            "score": z["score"], "inclusive": z["inc"], "gap": z["gap"], "priority": z["priority"], "rank": z["pos"],
            "missing": z["missing"], "underpasses": z["underpasses"], "lst": z["lst"],
            "actions": z["actions"], "need": zinfo.get(k, {}).get("need"),
            "lon": zinfo.get(k, {}).get("lon"), "lat": zinfo.get(k, {}).get("lat"),
            "geometry": {"type": g.geom_type, "coordinates": rnd(mapping(g)["coordinates"])},
        })

    summary = {
        "source": "ADDIM (SmartUrban data qatı)",
        "minutes": inc["method"]["minutes"],
        "profiles": inc["profiles"], "groups": inc["groups"], "barriers": inc["barriers"],
        "scenarios": inc["scenarios"], "rayons": inc["rayons"], "method": inc["method"],
        "popTotal": inc["summary"]["pop_total"],
        "equity": lens["equity"],
    }
    barriers = json.load(open(DATA / "barriers_access.json"))

    json.dump(summary, open(out / "access_summary.json", "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"zones": zones}, open(out / "access_zones.json", "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump(barriers, open(out / "access_barriers.json", "w"), separators=(",", ":"))
    for f in ("access_summary.json", "access_zones.json", "access_barriers.json"):
        print(f, round((out / f).stat().st_size / 1024), "KB")


if __name__ == "__main__":
    main()
