import axios from "axios";
import Cookies from "js-cookie";

// Statik data üçün VITE_API_URL boş qalır: sorğular saytın öz domeninə gedir (/data/*.json).
export const MAIN_URL = import.meta.env.VITE_API_URL || "";
export const HUB_URL = import.meta.env.VITE_HUB_URL || "";

const axiosInstance = axios.create({
  baseURL: MAIN_URL,
  timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
  // Statik data: hər deploy-da yeni ünvan, brauzer keşi köhnə faylı qaytarmır
  if (config.url?.includes("/data/")) {
    config.params = { ...config.params, v: __BUILD_ID__ };
  }
  const token = Cookies.get("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  let lang = "az";
  try {
    lang = localStorage.getItem("lang") || "az";
  } catch {
    /* gizli rejimdə localStorage olmaya bilər */
  }
  config.headers["Accept-Language"] = lang;
  return config;
});

export default axiosInstance;
