// Bütün Bakı xəritəsi üçün göstəricilər: [key, label, unit, level] (level: r = rayon, g = 1 km hücrə)
export const BAKU_METRICS = [
  ["Demoqrafiya", [["pop", "Əhali", "nəfər", "r"], ["density", "Əhali sıxlığı", "nəfər/km²", "r"], ["disabled_per1000", "Əlilliyi olan şəxslər", "1000 nəfərə", "r"], ["g:pop", "Əhali (1 km hücrə)", "nəfər/km²", "g"]]],
  ["Sosial-iqtisadi", [["poi_km2", "Xidmət və ticarət sıxlığı", "obyekt/km²", "r"], ["commerce_per1000", "Ticarət və iaşə", "1000 nəfərə", "r"], ["office_per1000", "Ofislər", "1000 nəfərə", "r"], ["mix_index", "Qarışıq istifadə indeksi", "0–100", "r"], ["tourism_beds", "Mehmanxana və hostellər", "say", "r"], ["g:poi", "Obyektlər (1 km hücrə)", "say", "g"]]],
  ["Topoqrafiya", [["elev_mean", "Orta hündürlük", "m", "r"], ["slope_mean", "Orta meyl", "%", "r"], ["steep_pct", "Dik ərazi (meyl > 15%)", "ərazinin %-i", "r"], ["g:elev", "Hündürlük (1 km hücrə)", "m", "g"], ["g:slope", "Meyl (1 km hücrə)", "%", "g"]]],
  ["Küçə şəbəkəsi", [["road_km_km2", "Yol sıxlığı", "km/km²", "r"], ["intersections_km2", "Kəsişmə sıxlığı", "kəsişmə/km²", "r"], ["deadend_pct", "Dalan küçə payı", "%", "r"], ["major_share", "Magistral payı", "yolların %-i", "r"], ["ped_km_km2", "Piyada yolu sıxlığı", "km/km²", "r"], ["g:inter", "Kəsişmələr (1 km hücrə)", "say", "g"]]],
  ["Nəqliyyat", [["transit500_pct", "Dayanacağa 500 m (SDG 11.2.1)", "əhalinin %-i", "r"], ["metro_ride", "Metro sərnişini", "gündə", "r"], ["bus_stops_km2", "Avtobus dayanacağı sıxlığı", "dayanacaq/km²", "r"], ["g:stops", "Dayanacaqlar (1 km hücrə)", "say", "g"]]],
  ["İqlim və yaşıllıq", [["lst_mean", "Yer səthinin temperaturu", "°C, 30.08.2025", "r"], ["uhi", "Şəhər ortasından fərq", "°C", "r"], ["green_pct", "Yaşıl örtük (NDVI > 0.3)", "%", "r"], ["g:lst", "Səth temperaturu (1 km hücrə)", "°C", "g"], ["g:ndvi", "NDVI (1 km hücrə)", "indeks", "g"]]],
  ["Risk", [["below_m20_pct", "Alçaq sahil (−20 m-dən aşağı)", "ərazinin %-i", "r"], ["steep_pct", "Sürüşmə riski: dik yamac", "ərazinin %-i", "r"]]],
  ["Tarixi-mədəni", [["heritage", "Tarixi obyektlər", "say", "r"], ["culture", "Mədəniyyət obyektləri", "say", "r"]]],
  ["Piyada (mərkəz)", [["walk_score", "Piyada indeksi (mərkəzi zona)", "0–100", "r"]]],
];

export const BAKU_META = {};
BAKU_METRICS.forEach(([theme, ms]) => ms.forEach(([key, label, unit, level]) => (BAKU_META[key] = { theme, label, unit, level })));

export const BAKU_SOURCES = {
  pop: "DSK 2024; hücrələrdə WorldPop 2020 paylanması", density: "DSK 2024", disabled_per1000: "DSK 2026 / DSK 2024", poi_km2: "OSM", commerce_per1000: "OSM / DSK 2024",
  office_per1000: "OSM / DSK 2024", mix_index: "OSM, 8 kateqoriya", tourism_beds: "OSM", elev_mean: "SRTM", slope_mean: "SRTM", steep_pct: "SRTM",
  road_km_km2: "OSM", intersections_km2: "OSM", deadend_pct: "OSM", major_share: "OSM", ped_km_km2: "OSM", transit500_pct: "BakuBus, metro / WorldPop",
  metro_ride: "Bakı Metropoliteni 2026", bus_stops_km2: "BakuBus", lst_mean: "Landsat 8, 30.08.2025", uhi: "Landsat 8", green_pct: "Landsat 8 NDVI",
  below_m20_pct: "SRTM", heritage: "OSM", culture: "OSM", walk_score: "ADDIM indeksi, yalnız mərkəzi zona",
};

export const DATA_GAPS = [
  "Yaş strukturu: WorldPop rayonlar üzrə fərq vermir, yalnız şəhər üzrə istifadə olunub.",
  "Binalar: OSM-də Bakının binaları çox natamamdır (məs. Səbaildə 0). Bina sıxlığı ölçülməyib.",
  "Gəlir və mənzil: DSK yalnız “Bakı şəhəri – cəmi” verir.",
  "Rayon əhalisi DSK 2024 rəsmi rəqəmidir. Rayon daxilində paylanma WorldPop 2020-dən götürülüb, yeni tikililər tam əks olunmaya bilər.",
  "Səth temperaturu bir yay gününə aiddir (30.08.2025). Çoxillik ortalama deyil.",
  "Seysmik, daşqın və qəza datası açıq deyil. Risk proksilərlə qiymətləndirilib.",
];

export const TYPE_INFO = {
  nucleus: { name: "Kompakt şəhər nüvəsi", d: "Sıx, qarışıq istifadəli və nəqliyyatla yaxşı təmin olunmuş toxuma. Əsas problem magistralların hökmranlığı və kölgə çatışmazlığıdır.", rx: "Seul və Barselona: yerüstü keçid, magistralın sakitləşdirilməsi, superblok, kölgəli dəhlizlər." },
  suburb: { name: "Abşeron qəsəbələri", d: "Az sıx, alçaqmərtəbəli qəsəbə toxuması. Küçələrin üçdə biri dalandır, dayanacağa orta məsafə 500 m-dən çoxdur.", rx: "15 dəqiqəlik şəhər: dalan küçələri birləşdirmək, məktəb yolları, qəsəbə mərkəzi və BakuBus tezliyi." },
  slope: { name: "Dik yamac məhəllələri", d: "Amfiteatr relyefinin yuxarı hissəsi. Meyl 16%-dən çoxdur, dalan küçələr çoxdur, sahilə enmək çətindir.", rx: "Medellin modeli: açıq eskalator, lift və pilləkən dəhlizləri, universal dizayn, sürüşmə monitorinqi." },
  periphery: { name: "Təcrid olunmuş periferiya", d: "Sənaye və neft mədənləri arasında qalmış yaşayış yerləri. Dayanacaq uzaqdır, xidmət demək olar ki yoxdur.", rx: "Əsas xidmətlər: nəqliyyat xətti, kiçik xidmət mərkəzi, yaşıllaşdırma və istilik sığınacaqları." },
};
