"""index.src.html + Leaflet CSS -> index.html; GeoJSON fayllarını site/geojson-a köçürür."""
import os, shutil, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
css = urllib.request.urlopen("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css").read().decode()
src = open(os.path.join(HERE, "index.src.html"), encoding="utf-8").read()
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(src.replace("/*LEAFLET_CSS*/", css))
dst = os.path.join(HERE, "geojson")
shutil.rmtree(dst, ignore_errors=True)
shutil.copytree(os.path.join(HERE, "..", "data", "geojson"), dst)
print("ok", sorted(os.listdir(dst)))
