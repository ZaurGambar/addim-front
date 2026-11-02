# ADDIM Bakı

Bakı üçün süni intellekt əsaslı piyada platforması. “İnsanyönümlü şəhərlər” hakatonu (Gənclər Fondu və Milli Süni İntellekt Mərkəzi, 11–13 noyabr 2026) üçün hazırlanıb.

Platforma Bakının 12 rayonunu 9 mövzu üzrə analiz edir, problemlərin üst-üstə düşdüyü zonaları tapır, SWOT çıxarır, 29 insanyönümlü şəhərsalma anlayışını real data ilə ölçür və dünya şəhərlərinin modellərini Bakıya uyğunlaşdırır.

## Səhifələr

| Route | Məzmun |
|---|---|
| `/` | Ana səhifə, əsas nəticələr |
| `/analiz` | Bakı: tematik analiz (12 rayon, 1 km hücrələr) |
| `/sintez` | Üst-üstə düşmə, Getis-Ord Gi*, məhəllə tipləri, prioritet zonalar |
| `/swot` | SWOT |
| `/xerite` | Mərkəzi zona: piyada indeksi, qatlar, Seul ssenarisi (`?c=` göstərici, `?s=` stansiya) |
| `/modeller` | 6 şəhər modeli, boşluq analizi, köçürmə riskləri |
| `/anlayislar` | 29 anlayış, korrelasiya matrisi |
| `/ai` | 8 AI modulu və arxitektura |
| `/pilot` | Pilot zonalar, peyk yoxlaması, sahə yoxlaması forması |
| `/metodologiya` | İndeks, mənbələr, müraciət mətni |

## Texnologiyalar

Vite + React 19 (JavaScript), styled-components 6, react-router-dom 7, @tanstack/react-query 5, axios, formik + yup, react-toastify, react-helmet-async, react-loading-skeleton, react-responsive, lucide-react, Leaflet.

## Lokal işə salma

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build      # dist/
```

`.npmrc` faylında `legacy-peer-deps=true` var. Backend yoxdur: bütün data `public/data/` qovluğundakı statik GeoJSON və JSON fayllarıdır. Gələcəkdə API qoşulanda `.env.example`-dakı `VITE_API_URL`-u doldurun.

## Netlify

`netlify.toml` hazırdır: build `npm run build`, publish `dist`. SPA yönləndirməsi `public/_redirects` faylındadır. Sahə yoxlaması (`field-check`) və data xətası (`data-report`) formaları Netlify Forms-a göndərilir. Formalar `index.html`-də gizli nüsxə kimi elan olunub, cavablar Netlify panelində **Forms** bölməsində görünür.

## Data və lisenziyalar

- OpenStreetMap iştirakçıları: ODbL
- opendata.az: Bakı Metropoliteni, Yerüstü Nəqliyyat Agentliyi, Dövlət Statistika Komitəsi
- Dövlət Statistika Komitəsi, rayonlar üzrə əhali, 2024-cü ilin əvvəlinə: CC0
- WorldPop 2020: CC BY 4.0 (yalnız rayon daxilində paylanma üçün)
- Landsat 8 C2 L2 (Microsoft Planetary Computer), 01.08.2026; SRTM (AWS Terrain Tiles)

Peyk və 2GIS ekran görüntüləri lisenziya səbəbindən repoya daxil edilməyib. Saytda yalnız onlardan çıxan nəticələr göstərilir.

Data hazırlama skriptləri (Python) ayrıca `pedastrainized/data` qovluğundadır: `collect_opendata.py`, `build_geojson.py`, `concepts.py`, `baku/analysis.py`, `baku/synthesis.py`.

### Əhali kalibrləməsi (DSK 2024)

`baku_*` faylları əvvəlcə WorldPop 2020 əhalisi ilə hazırlanıb. `scripts/calibrate_population.py` hər rayonun 1 km hücrələrini bir əmsalla vurur ki, rayonun cəmi DSK 2024 rəqəminə bərabər olsun (məs. Xəzər ×1.84, Səbail ×0.70). Sonra əhaliyə bağlı bütün göstəriciləri yenidən hesablayır: sıxlıq, 1000 nəfərə göstəricilər, qaynar/soyuq nöqtələrin əhalisi, problem kombinasiyaları, prioritet zonalar (sıra: əhali × ehtiyac) və şəhər cəmləri. Klasterlər, Gi* sinifləri, problem qatları və hücrə seçimi (`min_pop` = 300) dəyişmir.

- `python3 scripts/calibrate_population.py --check`: əmsal 1 ilə köhnə faylları dəqiq təkrar edir (düsturların yoxlanışı).
- Skript artıq kalibrlənmiş data üzərində işləmir. `baku/analysis.py` və `baku/synthesis.py` yenidən işlədiləndə skripti onlardan sonra bir dəfə işlədin, və ya DSK rəqəmlərini birbaşa həmin skriptlərə əlavə edin.

### Landsat yeniləməsi

`scripts/update_landsat.py <scene_id>` Bakı analizinin LST və NDVI qatlarını yeni Landsat C2 L2 şəklinə keçirir (hazırda `LC08_L2SP_166032_20260801_02_T1`). Fərq üsulu istifadə olunur: `yeni = köhnə + (yeni şəkil − köhnə şəkil)`, eyni təmiz piksellər üzərində (su, bulud və kölgə çıxılır). Yenilənir: hücrələrin `lst`/`ndvi`, rayonların `lst_mean`, `lst_p90`, `ndvi_mean`, `green_pct` (NDVI > 0.3), `uhi` və şəhərin `lst_popw`, `green_pct_popw`. Sonra `scripts/update_synthesis.py` sintezi yeniləyir (aşağıya baxın).

Asılılıqlar: `numpy rasterio pystac-client planetary-computer shapely pyproj`.

### Sintez yeniləməsi

`scripts/update_synthesis.py` sintezi (`baku_synth.*`) yeni LST/NDVI dəyərlərinə keçirir. Orijinal `baku/synthesis.py` faylındakı addımlar fayllardan bərpa olunub: qat faizləri 701 hücrə arasında sıra faizidir; problem sayı p ≥ 66.7 olan qatlardır; Gi* `need` üzərində 1.5 km (8 qonşu + hücrənin özü) ilə hesablanır, siniflər 1.645 / 1.96 / 2.576-dır; tiplər k-means mərkəzlərinə ən yaxın hücrələrdir; zonalar qonşu Gi* ≥ 95% hücrələrdir. Hər addımda fərq üsulu istifadə olunur. Landsat dəyişməyəndə skript köhnə faylları 0 fərqlə təkrar edir.

Məhdudiyyətlər: `need` indeksinin dəqiq düsturu bərpa olunmayıb (8 qatın ortası × əhali amili), ona görə `need` nisbət üsulu ilə yenilənir. k-means yenidən öyrədilmir: hücrələr köhnə mərkəzlərə bağlanır. Yeni zonaların adı əhaliyə görə çəkili ən çox rast gəlinən yaşayış məntəqəsidir.
