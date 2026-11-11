// SmartUrban admin panelinin içində (iframe) açılanda ADDIM öz menyusunu, başlığını və footer-ini gizlədir.
// İlk açılış: /addim/index.html?embed=1&go=/analiz → router-dən əvvəl ünvan /addim/analiz-ə çevrilir.
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

const detect = () => {
  try {
    const sp = new URLSearchParams(window.location.search);
    // ?embed=0: ayrıca pəncərədə tam sayt kimi
    if (sp.get("embed") === "0") { sessionStorage.removeItem("addim-embed"); return false; }
    if (sp.has("embed")) sessionStorage.setItem("addim-embed", "1");
    return sp.has("embed") || sessionStorage.getItem("addim-embed") === "1" || window.self !== window.top;
  } catch {
    return true; // cross-origin iframe: window.top oxunmur → embed
  }
};

export const EMBED = detect();

/** Router yaranmadan əvvəl: ?go=/səhifə parametrini real ünvana çevirir. */
export const applyDeepLink = () => {
  const sp = new URLSearchParams(window.location.search);
  const go = sp.get("go");
  if (!go || !go.startsWith("/")) return;
  sp.delete("go");
  const rest = sp.toString();
  window.history.replaceState(null, "", `${BASE}${go}${rest ? `?${rest}` : ""}${window.location.hash}`);
};

export const ROUTER_BASENAME = BASE || "/";

// router modul yüklənəndə yaranır (App.jsx): ünvan ondan əvvəl düzəlməlidir, ona görə burada, modulun özündə
applyDeepLink();

// SmartUrban admin içində tema adminin temasına bağlıdır (next-themes açarı "theme", default açıq);
// admin temanı dəyişəndə "storage" hadisəsi iframe-ə də gəlir.
const syncTheme = () => {
  let t = "light";
  try {
    t = localStorage.getItem("theme") === "dark" ? "dark" : "light";
  } catch {
    /* yaddaş bağlıdır */
  }
  document.documentElement.setAttribute("data-theme", t);
};
if (EMBED) {
  syncTheme();
  window.addEventListener("storage", (e) => e.key === "theme" && syncTheme());
}
