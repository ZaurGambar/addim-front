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
  const token = Cookies.get("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Accept-Language"] = localStorage.getItem("lang") || "az";
  return config;
});

export default axiosInstance;
