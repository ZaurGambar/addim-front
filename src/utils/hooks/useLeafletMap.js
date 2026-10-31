import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Leaflet xəritəsini ref-ə bağlayır; xəritə yalnız bir dəfə yaradılır.
export const useLeafletMap = ({ bounds, minZoom = 9, maxZoom = 18, attribution = "© OpenStreetMap iştirakçıları" }) => {
  const ref = useRef(null);
  const [state, setState] = useState({ map: null, renderer: null });
  const boundsKey = JSON.stringify(bounds);

  useEffect(() => {
    if (!ref.current) return undefined;
    const m = L.map(ref.current, { preferCanvas: true, zoomSnap: 0.5, minZoom, maxZoom });
    m.fitBounds(JSON.parse(boundsKey));
    m.attributionControl.setPrefix(false).addAttribution(attribution);
    // Renderer xəritə ilə birlikdə yaradılır (StrictMode-da köhnə xəritəyə bağlı qalmasın)
    setState({ map: m, renderer: L.canvas({ padding: 0.3 }) });
    return () => {
      m.remove();
      setState({ map: null, renderer: null });
    };
  }, [boundsKey, minZoom, maxZoom, attribution]);

  return { ref, map: state.map, renderer: state.renderer };
};

// Rəng tokenləri tema dəyişəndə yenidən oxunsun deyə
export const useColorScheme = () => {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => setDark(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return dark;
};
