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

// 2GIS alt xəritəsi (raster, adlar şəklin içindədir)
const TWOGIS_TILES = "https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1";
const ATTR = { ofm: "OpenFreeMap © OpenMapTiles", "2gis": "© 2GIS" };

// Alt xəritə seçimi bütün xəritələr üçün birdir və yadda qalır
const SRC_KEY = "addim-basemap";
const readSrc = () => {
  try {
    return localStorage.getItem(SRC_KEY) === "2gis" ? "2gis" : "ofm";
  } catch {
    return "ofm";
  }
};
export const setBasemapSource = (src) => {
  try {
    localStorage.setItem(SRC_KEY, src);
  } catch {
    /* gizli rejim */
  }
  window.dispatchEvent(new CustomEvent("addim-basemap", { detail: src }));
};
export const useBasemapSource = () => {
  const [src, setSrc] = useState(readSrc);
  useEffect(() => {
    const on = (e) => setSrc(e.detail);
    window.addEventListener("addim-basemap", on);
    return () => window.removeEventListener("addim-basemap", on);
  }, []);
  return src;
};

// Xəritənin küncündə alt xəritə düyməsi
const SourceControl = L.Control.extend({
  options: { position: "bottomright" },
  onAdd() {
    const el = L.DomUtil.create("div", "basemap-switch");
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", "Alt xəritə");
    [
      ["ofm", "OpenFreeMap"],
      ["2gis", "2GIS"],
    ].forEach(([k, t]) => {
      const b = L.DomUtil.create("button", "", el);
      b.type = "button";
      b.textContent = t;
      b.dataset.src = k;
      L.DomEvent.on(b, "click", (e) => {
        L.DomEvent.stop(e);
        setBasemapSource(k);
      });
    });
    L.DomEvent.disableClickPropagation(el);
    this._el = el;
    return el;
  },
  setActive(src) {
    this._el?.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.src === src));
  },
});

// Leaflet xəritəsini ref-ə bağlayır; xəritə yalnız bir dəfə yaradılır.
export const useLeafletMap = ({ bounds, minZoom = 9, maxZoom = 18, attribution = "© OpenStreetMap iştirakçıları", basemap = true }) => {
  const ref = useRef(null);
  const [state, setState] = useState({ map: null, renderer: null });
  const gl = useRef(null); // OpenFreeMap: [küçələr, adlar]
  const raster = useRef(null); // 2GIS
  const control = useRef(null);
  const dark = useColorScheme();
  const src = useBasemapSource();
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
    m.attributionControl.setPrefix(false).addAttribution(attribution);
    if (basemap) {
      const labels = m.createPane("labels");
      labels.style.zIndex = 450;
      labels.style.pointerEvents = "none";
      control.current = new SourceControl().addTo(m);
    }
    // Renderer xəritə ilə birlikdə yaradılır (StrictMode-da köhnə xəritəyə bağlı qalmasın)
    setState({ map: m, renderer: L.canvas({ padding: 0.3 }) });
    return () => {
      m.remove();
      gl.current = null;
      raster.current = null;
      control.current = null;
      setState({ map: null, renderer: null });
    };
  }, [boundsKey, minZoom, maxZoom, attribution, basemap]);

  // alt xəritə: OpenFreeMap (vektor) və ya 2GIS (raster)
  useEffect(() => {
    const m = state.map;
    if (!m || !basemap) return undefined;
    let alive = true;
    control.current?.setActive(src);
    m.attributionControl.addAttribution(ATTR[src]);
    if (src === "2gis") {
      if (!raster.current) raster.current = L.tileLayer(TWOGIS_TILES, { subdomains: "0123", maxZoom: 18, updateWhenZooming: false, keepBuffer: 3 });
      raster.current.addTo(m);
    } else if (gl.current) {
      gl.current.forEach((t) => t.addTo(m));
    } else {
      Promise.all([loadGL(), loadStyles(isDark())])
        .then(([, [base, names]]) => {
          if (!alive || gl.current) return;
          gl.current = [
            L.maplibreGL({ style: base, interactive: false, attributionControl: false }),
            L.maplibreGL({ style: names, interactive: false, attributionControl: false, pane: "labels" }),
          ];
          gl.current.forEach((t) => t.addTo(m));
        })
        .catch(() => {}); // alt xəritə gəlməsə də məlumat qatları işləyir
    }
    return () => {
      alive = false;
      m.attributionControl.removeAttribution(ATTR[src]);
      if (src === "2gis") raster.current && m.removeLayer(raster.current);
      else gl.current?.forEach((t) => m.removeLayer(t));
    };
  }, [state.map, src, basemap]);

  // tema dəyişəndə OpenFreeMap üslubu da dəyişir
  useEffect(() => {
    if (!gl.current) return undefined;
    let alive = true;
    loadStyles(dark)
      .then(
        (st) =>
          alive &&
          gl.current?.forEach((t, i) => {
            t.options.style = st[i]; // xəritədən çıxıb qayıdanda da düzgün tema
            t.getMaplibreMap()?.setStyle(st[i]);
          })
      )
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
