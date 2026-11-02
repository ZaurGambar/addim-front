import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Alt qat: OpenFreeMap şəhər xəritəsi (vektor, MapLibre ilə). İki hissəyə bölünür:
// küçələr/binalar məlumat qatlarının ALTINDA, adlar isə ÜSTÜNDƏ (oxunsun deyə).
const OFM = "https://tiles.openfreemap.org/styles/";
const styleName = (dark) => (dark ? "dark" : "positron");
const NAME = ["coalesce", ["get", "name:az"], ["get", "name:latin"], ["get", "name"]];
const styles = new Map();
const loadStyles = (dark) => {
  const name = styleName(dark);
  if (!styles.has(name))
    styles.set(
      name,
      fetch(OFM + name)
        .then((r) => r.json())
        .then((st) => {
          const sym = (l) => l.type === "symbol";
          const az = (l) => (/label|name/.test(l.id) && l.layout?.["text-field"] ? { ...l, layout: { ...l.layout, "text-field": NAME } } : l);
          return [
            { ...st, layers: st.layers.filter((l) => !sym(l)) },
            { ...st, layers: st.layers.filter(sym).map(az) },
          ];
        })
        .catch((e) => {
          styles.delete(name);
          throw e;
        })
    );
  return styles.get(name);
};
// MapLibre ağırdır: yalnız xəritə açılanda yüklənir
const loadGL = () => Promise.all([import("@maplibre/maplibre-gl-leaflet"), import("maplibre-gl/dist/maplibre-gl.css")]);
const isDark = () => document.documentElement.getAttribute("data-theme") !== "light";

// Leaflet xəritəsini ref-ə bağlayır; xəritə yalnız bir dəfə yaradılır.
export const useLeafletMap = ({ bounds, minZoom = 9, maxZoom = 18, attribution = "© OpenStreetMap iştirakçıları", basemap = true }) => {
  const ref = useRef(null);
  const [state, setState] = useState({ map: null, renderer: null });
  const tiles = useRef(null);
  const dark = useColorScheme();
  const boundsKey = JSON.stringify(bounds);

  useEffect(() => {
    if (!ref.current) return undefined;
    // Siçan təkəri xəritəni yalnız klikdən sonra zoom edir: səhifə skrollu xəritədə ilişmir
    const m = L.map(ref.current, { preferCanvas: true, zoomSnap: 0.5, minZoom, maxZoom, scrollWheelZoom: false, wheelPxPerZoomLevel: 90 });
    const enableWheel = () => m.scrollWheelZoom.enable();
    const disableWheel = () => m.scrollWheelZoom.disable();
    m.on("click focus", enableWheel);
    m.on("mouseout blur", disableWheel);
    m.fitBounds(JSON.parse(boundsKey));
    m.attributionControl.setPrefix(false).addAttribution(basemap ? `${attribution} · OpenFreeMap © OpenMapTiles` : attribution);
    let alive = true;
    if (basemap) {
      const labels = m.createPane("labels");
      labels.style.zIndex = 450;
      labels.style.pointerEvents = "none";
      Promise.all([loadGL(), loadStyles(isDark())])
        .then(([, [base, names]]) => {
          if (!alive) return;
          tiles.current = [
            L.maplibreGL({ style: base, interactive: false, attributionControl: false }).addTo(m),
            L.maplibreGL({ style: names, interactive: false, attributionControl: false, pane: "labels" }).addTo(m),
          ];
        })
        .catch(() => {}); // alt xəritə gəlməsə də məlumat qatları işləyir
    }
    // Renderer xəritə ilə birlikdə yaradılır (StrictMode-da köhnə xəritəyə bağlı qalmasın)
    setState({ map: m, renderer: L.canvas({ padding: 0.3 }) });
    return () => {
      alive = false;
      m.remove();
      tiles.current = null;
      setState({ map: null, renderer: null });
    };
  }, [boundsKey, minZoom, maxZoom, attribution, basemap]);

  // tema dəyişəndə alt xəritə də dəyişir
  useEffect(() => {
    if (!tiles.current) return;
    let alive = true;
    loadStyles(dark)
      .then((st) => alive && tiles.current?.forEach((t, i) => t.getMaplibreMap()?.setStyle(st[i])))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [dark]);

  return { ref, map: state.map, renderer: state.renderer };
};

// Rəng tokenləri tema dəyişəndə yenidən oxunsun deyə (<html data-theme> izlənir)
export const useColorScheme = () => {
  const read = () => document.documentElement.getAttribute("data-theme") !== "light";
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return dark;
};
