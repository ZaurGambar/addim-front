// SmartUrban marşrut API-si (multimodal marşrut planlayıcısı + AYNA bildiriş paneli). CORS: *.
// Ünvan .env-dən dəyişdirilə bilər: VITE_ROUTING_API
export const ROUTING_API = import.meta.env.VITE_ROUTING_API || "https://smartflow.runasp.net/api";

const req = async (path, opts = {}) => {
  const r = await fetch(`${ROUTING_API}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  if (!r.ok) {
    let msg = `Marşrut xidməti ${r.status}`;
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

// SmartUrban profili → marşrut mühərrikinin profili (standard, senior "pilləkənsiz, az piyada", child)
export const SF_PROFILE = { adult: "standard", elderly: "senior", wheel: "senior", stroller: "child" };

// Anonim cihaz identifikatoru (bildirişlər üçün)
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
