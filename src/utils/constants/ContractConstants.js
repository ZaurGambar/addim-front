import { BarChart3, BrainCircuit, Building2, Database, Footprints, Home, Layers, Lightbulb, MapPinned, Ruler, Scale, Target } from "lucide-react";

export const SITE_NAME = "ADDIM Bakı";
export const SITE_URL = import.meta.env.VITE_SITE_URL || "";

export const NAV_ITEMS = [
  { path: "/", label: "Ana səhifə", short: "Ana", icon: Home, tab: true },
  { path: "/analiz", label: "Bakı analizi", short: "Analiz", icon: BarChart3, tab: true },
  { path: "/sintez", label: "Sintez", short: "Sintez", icon: Layers, tab: true },
  { path: "/swot", label: "SWOT", short: "SWOT", icon: Target },
  { path: "/xerite", label: "Mərkəzi xəritə", short: "Xəritə", icon: MapPinned, tab: true },
  { path: "/modeller", label: "Şəhər modelləri", short: "Modellər", icon: Building2 },
  { path: "/anlayislar", label: "29 anlayış", short: "Anlayışlar", icon: Lightbulb },
  { path: "/ai", label: "AI modulları", short: "AI", icon: BrainCircuit },
  { path: "/pilot", label: "Pilot", short: "Pilot", icon: Footprints, tab: true },
  { path: "/2gis", label: "2GIS datası", short: "2GIS", icon: Database },
  { path: "/qaydalar", label: "Qayda təklifləri", short: "Qaydalar", icon: Scale },
  { path: "/metodologiya", label: "Metodologiya", short: "Metod", icon: Ruler },
];

// SiteRoot üçün route qrupları (":param" dəstəklənir)
export const pagesWithHeaderAndTab = ["/", "/analiz", "/sintez", "/swot", "/xerite", "/pilot"];
export const pagesWithHeaderWebBackMobile = ["/modeller", "/anlayislar", "/ai", "/qaydalar", "/2gis"];
export const pagesWithOnlyBack = ["/metodologiya"];
