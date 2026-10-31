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
- WorldPop 2020: CC BY 4.0
- Landsat 8 C2 L2 (Microsoft Planetary Computer), SRTM (AWS Terrain Tiles)

Peyk və 2GIS ekran görüntüləri lisenziya səbəbindən repoya daxil edilməyib. Saytda yalnız onlardan çıxan nəticələr göstərilir.

Data hazırlama skriptləri (Python) ayrıca `pedastrainized/data` qovluğundadır: `collect_opendata.py`, `build_geojson.py`, `concepts.py`, `baku/analysis.py`, `baku/synthesis.py`.
