# docs

Saytın kodundan kənar layihə materialları.

## evaluation/
- `ADDIM_istiqametler_qiymetlendirme.xlsx` — saytın hakatonun 5 istiqaməti üzrə ekspert qiymətləndirməsi
  (33 meyar, 0–10 bal, çatışmazlıqlar, tövsiyələr, hakatona qədər işlər). Düsturlar Excel-də açılanda hesablanır.
- `build_evaluation_xlsx.py` — faylı yaradan skript (`openpyxl`).
  Qeyd: ballar 10.11.2026 vəziyyətinə aiddir; sonrakı işlər (ictimai məkan, sel riski, məktəb yolu,
  büdcə kalkulyatoru, həssaslıq analizi, sahil, 24 saat) balları qaldırıb, fayl hələ yenilənməyib.

## hackathon/
- `research_areas/01–05.jpg` — hakatonun 5 istiqaməti: 01 Rahat şəhər, 02 Hər kəs üçün şəhər
  (komandaya təyin olunan mövzu), 03 Hərəkətdə şəhər, 04 Yaşıl şəhər, 05 Ağıllı şəhər.
- `business_model_canvas.jpg` — hakatonun “Business Model Canvas — Simple” forması (9 xana).

## pipeline/
İlk data hazırlama skriptləri (tarixi versiya). Yollar orijinal `pedastrainized/data/` qovluğuna görədir,
xam data (OSM, opendata.az, WorldPop, Landsat, SRTM; ≈ 250 MB) repoya daxil edilməyib.
Hazırkı skriptlər `../scripts/` qovluğundadır.
- `collect_opendata.py`, `build_opendata_geojson.py` — opendata.az datasetlərinin yığılması və GeoJSON-a çevrilməsi
  (`opendata_catalog.md` — tapılan 130 dataset)
- `build_geojson.py` — mərkəzi zonanın piyada indeksi (250 m)
- `concepts.py` — 29 insanyönümlü şəhərsalma anlayışının göstəriciləri və korrelyasiyası
- `satellite_check.py` — yeraltı keçid namizədlərinin peyk yoxlaması
- `baku/build_rayons.py`, `baku/analysis.py`, `baku/synthesis.py` — bütün Bakı: rayonlar, tematik analiz, sintez
- `field_check.csv` — sahə yoxlaması şablonu

## prototype/
claude.ai artifakt versiyasının mənbəyi (`index.src.html`, `build.py`). Peyk (Esri) və 2GIS ekran görüntüləri
lisenziya səbəbindən daxil edilməyib.
