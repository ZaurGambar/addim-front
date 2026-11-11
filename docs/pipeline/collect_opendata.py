"""opendata.az (CKAN) portalından ADDIM layihəsi ilə bağlı datasetləri yığır.

Hər HTTP sorğusunun timeout-u 2 saniyədir. Cavab gəlməsə, sorğu 2 dəfə təkrarlanır.
Çıxış:
  data/opendata/catalog.json  — tapılan bütün uyğun datasetlərin siyahısı
  data/opendata/catalog.md    — insan üçün oxunaqlı cədvəl
  data/opendata/files/<dataset>/<fayl>  — endirilmiş resurslar (CSV, XLSX, JSON, GeoJSON...)
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

API = "https://admin.opendata.az/api/3/action/"
TIMEOUT = 2          # saniyə, hər sorğu üçün
RETRIES = 2          # timeout olduqda əlavə cəhd sayı
MAX_FILE_MB = 25
UA = {"User-Agent": "Mozilla/5.0 (ADDIM hackathon research)"}

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "opendata")
FILES = os.path.join(OUT, "files")

# Layihə ilə birbaşa bağlı qruplar və təşkilatlar
GROUPS = ["transport", "cartography", "ecology", "hidrometeorologiya", "security", "health", "tourism"]
ORGS = [
    "baki-metropoliteni", "denizkenari-bulvar-idaresi", "azerbaycan-yerustu-neqliyyat-agentliyi",
    "yasamal-rayon-icra-hakimiyyeti", "fovqelade-hallar-nazirliyi", "azerisiq-asc",
    "azerbaycan-respublikasinin-ekologiya-ve-tebii-servetler-nazirliyi", "azerbaycan-dovlet-su-ehtiyatlari-agentliyi",
]
# Bütün portalda (əsasən Statistika Komitəsi) açar söz axtarışı
KEYWORDS = [
    "metro", "sərnişin", "avtobus", "nəqliyyat", "yol-nəqliyyat hadisə", "yol nəqliyyat hadisələri", "piyada",
    "avtomobil", "yol", "küçə", "dayanacaq", "velosiped", "park", "yaşıllaşdırma", "ağac", "bulvar",
    "Bakı", "əhali sıxlığı", "əhalinin sayı", "şəhər əhalisi", "məktəb", "xəstəxana", "turist",
    "hava", "temperatur", "yağıntı", "külək", "sel", "daşqın", "atmosfer havası", "çirkləndirici",
    "səs-küy", "işıqlandırma", "xəritə", "geojson", "koordinat", "shp", "əlil", "yaşlı",
]
# Uyğunluq balı üçün sözlər (başlıq + təsvir + teqlər)
RELEVANT = {
    "bakı": 3, "baku": 3, "metro": 4, "sərnişin": 3, "piyada": 5, "yol-nəqliyyat": 4, "nəqliyyat": 2,
    "avtobus": 3, "küçə": 2, "yol": 1, "park": 2, "yaşıl": 2, "bulvar": 3, "hava": 1, "temperatur": 2,
    "yağıntı": 2, "sel": 2, "daşqın": 2, "atmosfer": 2, "çirkləndir": 2, "əhali": 1, "sıxlıq": 2,
    "koordinat": 3, "xəritə": 2, "geojson": 4, "işıqlandırma": 2, "dayanacaq": 3, "velosiped": 4,
    "məktəb": 1, "xəstəxana": 1, "əlil": 2, "turist": 1, "rayon": 1, "şəhər": 1,
}
NOISE = ["rihb", "nümayəndəlik", "imtahan", "qəbul imtahan", "gömrük", "mərkəzi bank", "neft hasilatı"]


def get(url, binary=False):
    last = None
    for attempt in range(RETRIES + 1):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=TIMEOUT) as r:
                body = r.read()
                return body if binary else json.loads(body.decode("utf-8"))
        except Exception as e:  # timeout, 5xx, bad JSON
            last = e
            time.sleep(0.2 * (attempt + 1))
    raise last


def search(**params):
    """CKAN package_search, səhifələrlə (hər səhifə 100)."""
    out, start = [], 0
    while True:
        q = {"rows": 100, "start": start, **params}
        url = API + "package_search?" + urllib.parse.urlencode(q)
        try:
            res = get(url)["result"]
        except Exception as e:
            print(f"  ! {params}: {type(e).__name__}: {e}", file=sys.stderr)
            break
        out += res["results"]
        start += 100
        if start >= res["count"]:
            break
    return out


def score(ds):
    text = " ".join([
        ds.get("title", ""), ds.get("notes") or "",
        " ".join(t["name"] for t in ds.get("tags", [])),
        (ds.get("organization") or {}).get("title", ""),
    ]).lower()
    if any(n in text for n in NOISE):
        return 0
    return sum(w for k, w in RELEVANT.items() if k in text)


def slug(s):
    return re.sub(r"[^a-zA-Z0-9._-]+", "_", s)[:80].strip("_") or "file"


def download(ds):
    saved = []
    folder = os.path.join(FILES, slug(ds["name"]))
    for res in ds.get("resources", []):
        url = res.get("url") or ""
        fmt = (res.get("format") or "").lower()
        if not url.startswith("http") or (res.get("size") or 0) > MAX_FILE_MB * 1e6:
            continue
        name = slug(os.path.basename(urllib.parse.urlparse(url).path)) or slug(res["id"])
        if "." not in name and fmt:
            name += "." + fmt
        path = os.path.join(folder, name)
        if os.path.exists(path):
            saved.append(os.path.relpath(path, OUT))
            continue
        try:
            body = get(url, binary=True)
        except Exception as e:
            print(f"  ! yüklənmədi {ds['name']}/{name}: {type(e).__name__}", file=sys.stderr)
            continue
        os.makedirs(folder, exist_ok=True)
        with open(path, "wb") as f:
            f.write(body)
        saved.append(os.path.relpath(path, OUT))
    return saved


def main():
    os.makedirs(FILES, exist_ok=True)
    t0 = time.time()
    found = {}
    jobs = [{"fq": f"groups:{g}"} for g in GROUPS] + [{"fq": f"organization:{o}"} for o in ORGS] + [{"q": k} for k in KEYWORDS]
    with ThreadPoolExecutor(max_workers=6) as ex:
        for params, results in zip(jobs, ex.map(lambda p: search(**p), jobs)):
            for ds in results:
                found.setdefault(ds["id"], ds)
            print(f"  {params}: {len(results)}")
    print(f"Unikal dataset: {len(found)}  ({time.time() - t0:.1f}s)")

    picked = []
    for ds in found.values():
        s = score(ds)
        org = (ds.get("organization") or {}).get("name", "")
        groups = [g["name"] for g in ds.get("groups", [])]
        if org in ORGS or set(groups) & {"transport", "cartography", "hidrometeorologiya"}:
            s += 3
        if s >= 4:
            picked.append((s, ds))
    picked.sort(key=lambda x: -x[0])
    print(f"Uyğun dataset: {len(picked)}")

    with ThreadPoolExecutor(max_workers=6) as ex:
        files = list(ex.map(lambda p: download(p[1]), picked))

    catalog = []
    for (s, ds), saved in zip(picked, files):
        catalog.append({
            "score": s,
            "id": ds["id"],
            "name": ds["name"],
            "title": ds.get("title", ""),
            "organization": (ds.get("organization") or {}).get("title", ""),
            "groups": [g["display_name"] for g in ds.get("groups", [])],
            "tags": [t["name"] for t in ds.get("tags", [])],
            "modified": ds.get("metadata_modified", "")[:10],
            "license": ds.get("license_title", ""),
            "page": f"https://opendata.az/dataset/{ds['name']}",
            "formats": sorted({(r.get("format") or "?").upper() for r in ds.get("resources", [])}),
            "files": saved,
            "notes": (ds.get("notes") or "").strip()[:300],
        })
    with open(os.path.join(OUT, "catalog.json"), "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "catalog.md"), "w", encoding="utf-8") as f:
        f.write("| Bal | Dataset | Təşkilat | Format | Yenilənib |\n|---|---|---|---|---|\n")
        for c in catalog:
            title = c["title"].replace("|", "/")
            f.write(f"| {c['score']} | [{title}]({c['page']}) | {c['organization']} | {', '.join(c['formats'])} | {c['modified']} |\n")
    n_files = sum(len(c["files"]) for c in catalog)
    print(f"Endirilən fayl: {n_files}  Ümumi vaxt: {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
