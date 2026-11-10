// 2GIS API: yerlər (Places), axtarış (Geocoder), piyada marşrutu (Routing).
// Açar koda yazılmır: lokalda .env.local, deploy-da hostinqin mühit dəyişəni (VITE_2GIS_KEY).
// Açar brauzerə yenə də gedir, ona görə 2GIS Platform Manager-də saytın domeni ilə məhdudlaşdırılmalıdır.
export const TWOGIS_KEY = import.meta.env.VITE_2GIS_KEY || "";
export const TWOGIS_ENABLED = Boolean(TWOGIS_KEY);
const CATALOG = "https://catalog.api.2gis.com/3.0/items";
const ROUTING = "https://routing.api.2gis.com/routing/7.0.0/global";
const cache = new Map();
const once = (key, fn) => {
  if (!cache.has(key))
    cache.set(
      key,
      fn().catch((e) => {
        cache.delete(key);
        throw e;
      })
    );
  return cache.get(key);
};
const noKey = () => Promise.reject(new Error("2GIS açarı yoxdur (VITE_2GIS_KEY)"));
const get = (url) =>
  !TWOGIS_ENABLED ? noKey() : fetch(url).then((r) => {
    if (!r.ok) throw new Error(`2GIS ${r.status}`);
    return r.json();
  });
const qs = (o) => new URLSearchParams({ ...o, key: TWOGIS_KEY, locale: "az_AZ" }).toString();
const r5 = (v) => Math.round(v * 1e5) / 1e5;

// Nöqtə ətrafında (radius m) bu növ yerlərin sayı
export const countPlaces = (q, [lat, lon], radius = 500) =>
  once(`c:${q}:${r5(lat)}:${r5(lon)}:${radius}`, () =>
    get(`${CATALOG}?${qs({ q, point: `${lon},${lat}`, radius, page_size: 1 })}`).then((d) => d.result?.total ?? 0)
  );

// Ünvan və ya yer adı axtarışı (Bakı ətrafında)
export const geocode = (text) =>
  once(`g:${text}`, () =>
    get(`${CATALOG}?${qs({ q: text, location: "49.87,40.41", radius: 40000, sort_point: "49.87,40.41", fields: "items.point", page_size: 6 })}`).then((d) =>
      (d.result?.items || []).filter((i) => i.point).map((i) => ({ id: i.id, name: i.name, address: i.full_name || i.address_name || "", lat: i.point.lat, lon: i.point.lon }))
    )
  );

// İki nöqtə arasında real piyada yolu: { duration (s), distance (m), line: [[lat, lon], ...] }
const parseWkt = (wkt) =>
  (wkt.match(/\(([^()]+)\)/)?.[1] || "")
    .split(",")
    .map((p) => p.trim().split(/\s+/).map(Number))
    .filter((p) => p.length === 2 && !p.some(Number.isNaN))
    .map(([lon, lat]) => [lat, lon]);
export const walkRoute = ([lat1, lon1], [lat2, lon2]) =>
  once(`r:${r5(lat1)}:${r5(lon1)}:${r5(lat2)}:${r5(lon2)}`, () =>
    !TWOGIS_ENABLED ? noKey() : fetch(`${ROUTING}?key=${TWOGIS_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: [{ type: "stop", lon: lon1, lat: lat1 }, { type: "stop", lon: lon2, lat: lat2 }], transport: "walking" }),
    })
      .then((r) => r.json())
      .then((d) => {
        const r = d.result?.[0];
        if (!r) throw new Error("2GIS marşrut yoxdur");
        const line = [];
        const add = (g) => g?.selection && line.push(...parseWkt(g.selection));
        r.begin_pedestrian_path?.geometry && add(r.begin_pedestrian_path.geometry);
        (r.maneuvers || []).forEach((m) => (m.outcoming_path?.geometry || []).forEach(add));
        r.end_pedestrian_path?.geometry && add(r.end_pedestrian_path.geometry);
        return { duration: r.total_duration, distance: r.total_distance, line };
      })
  );

// "Bu yer haqqında" üçün yaxınlıqdakı gündəlik xidmətlər (500 m = ~7 dəq piyada)
export const SERVICES = [
  ["aptek", "aptek"],
  ["market", "market"],
  ["məktəb", "məktəb"],
  ["uşaq bağçası", "uşaq bağçası"],
  ["poliklinika", "poliklinika"],
];
