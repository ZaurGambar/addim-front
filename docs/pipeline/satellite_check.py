"""Top-15 yeraltı keçid namizədi üçün peyk görüntüsü çıxarır (Esri World Imagery, z19, 3×3 kafel).

Çıxış: data/satellite/<rank>.jpg — mərkəzdə qırmızı dairə namizəd nöqtəsidir (radius ≈ 30 m).
Mənbə: Esri, Maxar, Earthstar Geographics. Tədqiqat üçün, atribusiya ilə.
"""
import io
import json
import math
import os
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "satellite")
os.makedirs(OUT, exist_ok=True)
Z = 19
URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
UA = {"User-Agent": "ADDIM hackathon research"}


def tile_xy(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def fetch(z, x, y):
    req = urllib.request.Request(URL.format(z=z, x=x, y=y), headers=UA)
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return Image.open(io.BytesIO(r.read())).convert("RGB")
        except Exception:
            pass
    return Image.new("RGB", (256, 256), (40, 40, 40))


def render(u):
    fx, fy = tile_xy(u["lat"], u["lon"], Z)
    tx, ty = int(fx), int(fy)
    canvas = Image.new("RGB", (768, 768))
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            canvas.paste(fetch(Z, tx + dx, ty + dy), ((dx + 1) * 256, (dy + 1) * 256))
    px, py = (fx - tx + 1) * 256, (fy - ty + 1) * 256
    m_per_px = 156543.03 * math.cos(math.radians(u["lat"])) / 2 ** Z
    r = 30 / m_per_px
    d = ImageDraw.Draw(canvas)
    d.ellipse([px - r, py - r, px + r, py + r], outline=(255, 40, 40), width=3)
    # 512×512 kəsik, nöqtə mərkəzdə
    box = (int(px - 256), int(py - 256), int(px + 256), int(py + 256))
    img = canvas.crop(box)
    path = os.path.join(OUT, f"{u['rank']:02d}.jpg")
    img.save(path, quality=85)
    return path, round(m_per_px, 3)


summary = json.load(open(os.path.join(HERE, "geojson", "summary.json"), encoding="utf-8"))
with ThreadPoolExecutor(max_workers=5) as ex:
    for u, (p, mpp) in zip(summary["top_underpasses"], ex.map(render, summary["top_underpasses"])):
        print(u["rank"], p, f"{mpp} m/px")
