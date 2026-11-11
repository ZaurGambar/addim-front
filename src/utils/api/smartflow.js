// SmartFlow API (sərnişin marşrut planlayıcısı + AYNA bildiriş paneli). Açıq API, CORS: *.
// Əsas ünvan .env-dən dəyişdirilə bilər: VITE_SMARTFLOW_API=https://smartflow.runasp.net/api
export const SMARTFLOW_API = import.meta.env.VITE_SMARTFLOW_API || "https://smartflow.runasp.net/api";

const req = async (path, opts = {}) => {
  const r = await fetch(`${SMARTFLOW_API}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  if (!r.ok) {
    let msg = `SmartFlow ${r.status}`;
    try {
      const j = await r.json();
      msg = j.title || j.message || msg;
    } catch {
      /* boş */
    }
    throw new Error(msg);
  }
  return r.status === 204 ? null : r.json();
};

export const searchPlaces = (q) => req(`/places/search?q=${encodeURIComponent(q)}`);
export const planJourney = (body) => req("/journeys/plan", { method: "POST", body: JSON.stringify(body) });
export const sendReport = (body) => req("/reports", { method: "POST", body: JSON.stringify(body) });

// SmartUrban profili → SmartFlow profili (SmartFlow-da: standard, senior "pilləkənsiz, az piyada", child)
export const SF_PROFILE = { adult: "standard", elderly: "senior", wheel: "senior", stroller: "child" };

// Anonim cihaz identifikatoru (SmartFlow bildirişləri üçün)
export const deviceId = () => {
  try {
    let id = localStorage.getItem("su-device");
    if (!id) {
      id = `su-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("su-device", id);
    }
    return id;
  } catch {
    return "su-anon";
  }
};
