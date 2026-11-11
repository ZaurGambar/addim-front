"""ADDIM saytının hakatonun 5 istiqaməti üzrə ekspert qiymətləndirməsi (Excel).

Çıxış: ../ADDIM_istiqametler_qiymetlendirme.xlsx
"""
import os

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.formatting.rule import CellIsRule, ColorScaleRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ADDIM_istiqametler_qiymetlendirme.xlsx")

TRACKS = [
    ("01", "Rahat şəhər – ictimai məkanlar və şəhər həyatı",
     "Parkların, meydanların, küçələrin, məhəllələrin və digər ictimai məkanların gündəlik ehtiyaclara uyğun, rahat, funksional və cəlbedici təşkili və canlandırılması."),
    ("02", "Hər kəs üçün şəhər – inklüzivlik və əlçatanlıq",
     "Uşaqlar, yaşlılar, əlilliyi olan şəxslər və müxtəlif ehtiyacları olan sakinlər üçün maneəsiz, təhlükəsiz və bərabər istifadə imkanları."),
    ("03", "Hərəkətdə şəhər – piyada və dayanıqlı mobillik",
     "Piyada rahatlığı, velosiped infrastrukturu, ictimai nəqliyyata əlçatanlıq, yol təhlükəsizliyi və şəhərdaxili hərəkətin səmərəli təşkili."),
    ("04", "Yaşıl şəhər – iqlim və dayanıqlı mühit",
     "Yaşıllığın artırılması, şəhər istiliyinin azaldılması, ekoloji infrastruktur, su və enerji səmərəliliyi, iqlim dəyişmələrinə dayanıqlı həllər."),
    ("05", "Ağıllı şəhər – rəqəmsal həllər və insan üçün texnologiya",
     "Süni intellekt və rəqəmsal texnologiyalarla xidmət səmərəliliyi, sakinlərin idarəçilikdə iştirakı, problemlərin operativ həlli, həyat keyfiyyəti."),
]

# ID, istiqamət kodu, meyar, saytda nə var (sübut), bal, çatışmazlıq, peşəkar tövsiyə, data mənbəyi, prioritet, hakatona qədər (24 saat), səy (saat)
ROWS = [
    # ---------- 01 ----------
    ("1.1", "01", "İctimai məkan inventarı və təminat norması",
     "Mərkəzi zonada OSM parkları (407), piyada küçələri (19.7 km, OSM redaktə tarixi və 2GIS vizual yoxlaması ilə), İçərişəhər; bütün Bakı üçün NDVI ilə yaşıl örtük payı (/analiz, /xerite).",
     5,
     "Bütün Bakı üzrə ictimai məkan inventarı (park, meydan, bulvar, həyət, cib parkı) yoxdur; parklar yalnız mərkəzi 9×9 km zonada. Adambaşına ictimai/yaşıl məkan (m²/nəfər) və SDG 11.7.1 (açıq ictimai məkanın tikili ərazidə payı) hesablanmayıb. Məkan tipologiyası və ölçü sinifləri yoxdur.",
     "OSM leisure=park|garden|playground, place=square, area:highway=pedestrian obyektlərini 12 rayon üzrə toplayıb tipologiya qurmaq; SDG 11.7.1 və m²/nəfər göstəricisini rayon və 237 zona üzrə vermək (WHO tövsiyəsi ≥ 9 m²/nəfər); 400 m və 800 m şəbəkə məsafəsində ictimai məkana çatan əhalinin payı.",
     "OSM, Bakı Şəhər İcra Hakimiyyəti park reyestri, Dənizkənarı Bulvar İdarəsi", "P1", "Bəli", 4),
    ("1.2", "01", "İctimai məkanın keyfiyyəti (Gehl 12 meyarı)",
     "Konseptual səviyyədə: “29 anlayış” bölməsində Gehl və placemaking proksiləri (/anlayislar); zonalarda “Cib parkı və oturacaq” həlli (D).",
     2,
     "Məkanların keyfiyyəti ölçülmür: qorunma (trafik, cinayət, iqlim), rahatlıq (oturmaq, durmaq, gəzmək, danışmaq), zövq (miqyas, mikroiqlim, estetika) üzrə audit yoxdur. Oturacaq, kölgə, içməli su, tualet, zibil qabı kimi küçə mebeli inventarı yoxdur.",
     "Gehl “Public Space Quality – 12 Criteria” çeklistini sahə yoxlaması formasına əlavə etmək; 3 pilot zonada 10–15 məkan üzrə audit, nəticəni xəritədə 0–36 bal kimi göstərmək; küçə mebeli üçün OSM amenity=bench|drinking_water|toilets|waste_basket qatı.",
     "Sahə auditi (komanda), OSM", "P1", "Bəli", 3),
    ("1.3", "01", "İctimai həyatın müşahidəsi (Whyte / PSPL)",
     "Metro sərnişin sayı proksi kimi istifadə olunur; sahə yoxlaması formasında 15 dəqiqəlik piyada sayımı sahəsi var (/pilot, Netlify Forms).",
     4,
     "Real istifadə datası yoxdur: hərəkət sayı (gün ərzində), stasionar fəaliyyət (oturmaq, oynamaq, ticarət), yaş və cins üzrə paylanma, gecə həyatı ölçülmür. Forma var, amma doldurulmuş data yoxdur.",
     "Gehl PSPL (Public Space Public Life) protokolu: 4 zaman kəsiyində (səhər, günorta, axşam, həftəsonu) piyada sayımı və stasionar fəaliyyət xəritəsi; pilot üçün anonim edge-AI sayğac; nəticələri “əvvəl/sonra” panelində göstərmək.",
     "Sahə sayımı, gələcəkdə edge kamera", "P2", "Xeyr", 12),
    ("1.4", "01", "Küçə canlılığı və qarışıq istifadə (Jacobs)",
     "Qarışıq istifadə indeksi (Shannon, 8 kateqoriya) rayon və hücrə üzrə; POI sıxlığı; 2GIS ilə OSM müqayisəsi 350 hücrədə (/2gis); pilot zonalarda kafe və mağaza sayı.",
     7,
     "Aktiv fasad (zəmin mərtəbənin küçəyə açıq payı), iş saatları üzrə 24 saatlıq aktivlik profili, icarə dinamikası və kiçik biznesə təsir ölçülmür.",
     "2GIS iş saatları ilə saatlıq aktivlik xəritəsi; pilot küçələrdə zəmin mərtəbə istifadəsi sahə auditi (aktiv/passiv fasad %); piyadalaşmanın biznes dövriyyəsinə təsiri üçün əvvəl/sonra göstəricisi.",
     "2GIS API, sahə auditi", "P3", "Xeyr", 8),
    ("1.5", "01", "Məhəllə miqyasında həllər (blok və zona səviyyəsi)",
     "7 065 məhəllə bloku, 237 planlama zonası (SKATER), 9 həll tipi; məs. “Cib parkı və oturacaq” 534 blok / 304 750 nəfər, “Kölgəli səki” 900 blok (/bolgeleme).",
     7,
     "Həllərin yeri torpaq mülkiyyəti və boş sahə ilə yoxlanılmayıb; həll tipləri üçün tipik dizayn (eskiz, en kəsiyi) və vahid xərc (AZN/m², AZN/obyekt) yoxdur, ona görə büdcə və prioritet sıralaması xərcsizdir.",
     "Hər həll tipi (A–I) üçün 1 səhifəlik dizayn kartı: tipik en kəsiyi, materiallar, vahid xərc, icra müddəti; dövlət torpaqları/kadastr qatı ilə uyğunluq yoxlaması; xərc/fayda (nəfər başına AZN) reytinqi.",
     "Dövlət Torpaq və Xəritəçəkmə xidməti (kadastr), smeta normativləri", "P2", "Qismən", 6),
    ("1.6", "01", "Sahil və bulvar əlçatanlığı (Bakıya xas)",
     "Dənizkənarı bulvar mətnlərdə və xəritədə var; Neftçilər prospekti boyunca yeraltı keçidlər və keçidsiz magistral hissələri göstərilir (/xerite).",
     4,
     "Sahilə çıxışın analizi yoxdur: sahil boyu fasiləsiz piyada xəttinin uzunluğu, şəhərdən bulvara keçidlər arası məsafə, Xəzər, Pirallahı və Abşeron çimərliklərinə ictimai giriş göstəricisi ölçülmür.",
     "Sahil boyu 100 m zolaqda piyada əlçatanlığı: fasiləsiz promenad km-i, keçidlər arası orta məsafə, sahilə 10 dəqiqəlik piyada çatımlılığı olan əhali; “Bakı – dənizə açılan şəhər” xüsusi göstəricisi.",
     "OSM, Dənizkənarı Bulvar İdarəsi", "P2", "Bəli", 3),
    ("1.7", "01", "Təhlükəsizlik hissi və işıqlandırma (CPTED)",
     "CPTED proksisi: aktiv fasad, OSM lit=yes teqi, yeraltı keçid cəriməsi (/anlayislar).",
     3,
     "Gecə işıqlandırması, görünürlük və qadınların təhlükəsizlik hissi ölçülmür; OSM-də lit teqi yalnız 289 yolda var (10%).",
     "VIIRS / Black Marble gecə işığı (500 m) ilə işıqlandırma proksisi; Safetipin (UN Women Safe Cities) metodu ilə gecə auditi; Azərişıq küçə işıqlandırması datası.",
     "NASA Black Marble, Azərişıq ASC", "P2", "Xeyr", 6),

    # ---------- 02 ----------
    ("2.1", "02", "Əlilliyi olan şəxslərin coğrafiyası",
     "DSK 2026: rayonlar üzrə əlilliyi olan şəxslər (cəmi 96 286), 1000 nəfərə düşən say; ən yüksək Suraxanı və Xəzər (/analiz); universal dizayn proksisi (/anlayislar).",
     6,
     "Əlilliyin növü (hərəkət, görmə, eşitmə) üzrə ehtiyac xəritəsi yoxdur; data rayon səviyyəsindədir, blok/zona səviyyəsinə endirilməyib; il uyğunsuzluğu (DSK 2026 / əhali 2024).",
     "Əlilliyin növü üzrə DSK cədvəllərini əlavə etmək; zona səviyyəsinə əhali çəkisi ilə paylamaq (dasimetrik xəritəçəkmə); ehtiyac indeksinə “əlçatanlıq çəkisi” əlavə etmək.",
     "DSK (opendata.az), ƏƏSMN", "P2", "Bəli", 3),
    ("2.2", "02", "Fiziki əlçatanlıq auditi (pandus, lift, taktil, səki)",
     "83 yeraltı keçid nöqtəsi; top-15 namizəd üçün peyk yoxlaması (zebra var/yox); qaydada “hər keçiddə pandus və ya lift” tələbi; “Maneəsiz yamac” həlli H (457 blok) (/pilot, /qaydalar, /bolgeleme).",
     3,
     "Real maneə inventarı yoxdur: pandusun mailliyi, lift işləkliyi, taktil plitə, səki eni (≥ 1.5 m), bordür hündürlüyü, metro stansiyalarında lift statusu ölçülməyib. OSM wheelchair teqi cəmi 124 obyektdə var.",
     "AzDTN / ISO 21542 əsasında 20 bəndlik əlçatanlıq çeklisti (sahə formasına); Bakı Metropoliteni stansiyaları üzrə lift və eskalator reyestri; M3 modulunun (kompüter görmə) BakuBus kamera görüntüləri ilə pilotu; nəticəni “maneə xəritəsi” qatı kimi göstərmək.",
     "Sahə auditi, Bakı Metropoliteni, Mapillary küçə görüntüləri", "P1", "Qismən", 8),
    ("2.3", "02", "Uşaqlar və təhlükəsiz məktəb yolu",
     "Məktəb, bağça, xəstəxana POI-ləri; uşaq dostu şəhər göstəricisi; “Təhlükəsiz məktəb yolu” həlli B (742 blok, 881 828 nəfər); 30 km/saat qaydası; İnşaatçılar məktəb küçəsi pilotu.",
     6,
     "Məktəb girişləri və şagird sayı yoxdur; məktəbə 400–800 m marşrut boyunca keçid riski (keçidsiz magistral, işıqforsuz keçid) ölçülməyib; oyun meydançalarına çatımlılıq yalnız mərkəzdədir.",
     "Elm və Təhsil Nazirliyinin məktəb reyestri (şagird sayı ilə) – açıq data; hər məktəb üçün 10 dəqiqəlik piyada zonasında “risk keçidləri” siyahısı; UNICEF Child Friendly Cities göstəriciləri.",
     "Elm və Təhsil Nazirliyi (opendata.az), OSM", "P1", "Qismən", 5),
    ("2.4", "02", "Yaşlılar (age-friendly city)",
     "Yaşlıların payı yalnız şəhər üzrə (WorldPop: 6.4%); qaydada oturacaq və kölgə tələbi.",
     3,
     "Yaş strukturu məkan üzrə fərqlənmir (WorldPop rayonlara eyni pay verir), ona görə yaşlıların sıx yaşadığı məhəllələr bilinmir; oturacaq aralığı, istirahət nöqtələri, poliklinikaya piyada çatımlılıq ölçülmür.",
     "DSK 2019 siyahıyaalma yaş qrupları (rayon/qəsəbə); WHO Age-friendly Cities 8 domeni üzrə göstəricilər; poliklinika və aptekə 10 dəqiqəlik çatımlılıq; 100–150 m oturacaq aralığı standartı.",
     "DSK siyahıyaalma 2019, Səhiyyə Nazirliyi", "P2", "Xeyr", 6),
    ("2.5", "02", "Gender perspektivi və təhlükəsizlik",
     "Yalnız “29 anlayış” bölməsində qeyd olunub; data yoxdur.",
     2,
     "Qadınların hərəkət nümunələri (zəncirvari səfərlər, uşaqla səfər), gecə təhlükəsizliyi, işıqlandırma və gender üzrə istifadə ölçülmür.",
     "UN Women “Safe Cities and Safe Public Spaces” audit metodu; sahə sayımında cins/yaş qeydi; gecə nəqliyyat və dayanacaq işıqlandırması göstəricisi.",
     "Sahə auditi, sorğu", "P3", "Xeyr", 8),
    ("2.6", "02", "Sosial bərabərlik (mərkəz–periferiya)",
     "Gini 0.269; mərkəzdən halqalar üzrə indeks; metrosuz rayonlarda 880 100 nəfər; qaynar nöqtələrdə 443 130 nəfər; rayon üzrə ehtiyac; büdcəni ehtiyaca görə bölmə qaydası (/sintez, /qaydalar).",
     7,
     "Gəlir, mənzil qiyməti və mənzil sıxlığı datası yoxdur; ehtiyac indeksinə sosial zəiflik (yaş, əlillik, işsizlik) daxil edilməyib.",
     "Sosial Zəiflik İndeksi (SoVI tipli): əlillik, yaşlılar, uşaqlar, işsizlik, mənzil sıxlığı; ehtiyac = fiziki problem × sosial zəiflik; mənzil qiymətləri üçün açıq elan datası (aqreqat).",
     "DSK, ƏƏSMN", "P2", "Qismən", 5),
    ("2.7", "02", "Platformanın özünün əlçatanlığı (WCAG 2.2)",
     "Sadə dil, “necə oxumalı” bələdçisi, tur xəritəsi, prefers-reduced-motion dəstəyi, mobil uyğunluq.",
     5,
     "WCAG 2.2 AA auditi aparılmayıb; xəritələrin mətn/cədvəl alternativi yoxdur; ekran oxuyucu ilə test olunmayıb; yalnız Azərbaycan dili (rus və ingilis yoxdur).",
     "axe / Lighthouse ilə WCAG 2.2 AA yoxlaması; hər xəritə üçün “cədvəl kimi göstər” düyməsi; rəng kontrastı ≥ 4.5:1; rus və ingilis dili interfeysi.",
     "Lighthouse, axe-core", "P2", "Bəli", 4),

    # ---------- 03 ----------
    ("3.1", "03", "Piyada rahatlığı indeksi",
     "Mərkəzdə 250 m hücrələrdə piyada indeksi (808 hücrə, 8 komponent); bütün Bakıda 1 km hücrə və blok səviyyəsində ehtiyac balı; Seul ssenarisi (/xerite).",
     8,
     "İndeksin çəkiləri ekspert qaydasıdır, real piyada sayımı ilə kalibrlənməyib və həssaslıq analizi yoxdur; 250 m dəqiqlik yalnız mərkəzdədir; məsafələrin bir hissəsi düz xətlə (Evklid) hesablanır.",
     "Sahə sayımı ilə regressiya kalibrasiyası (çəkiləri datadan öyrənmək); Monte Carlo həssaslıq analizi; bütün məsafələri piyada şəbəkəsi üzrə (OSMnx / pgRouting) hesablamaq.",
     "Sahə sayımı, OSM", "P2", "Qismən", 6),
    ("3.2", "03", "Piyada şəbəkəsi və maneələr",
     "Keçidsiz magistral hissələri 63.2 km; 83 yeraltı keçid nöqtəsi; dalan küçə payı və kəsişmə sıxlığı rayon/blok üzrə; “Məhəllə keçidi” həlli F; 77 min yol seqmenti (/analiz, /bolgeleme).",
     8,
     "Səki şəbəkəsi (sidewalk graph), səki eni və vəziyyəti yoxdur; Space Syntax inteqrasiya göstəriciləri hesablanmayıb; yeraltı keçidlərin iş saatı/işləkliyi bilinmir.",
     "OSM sidewalk=* və kompüter görmə ilə səki qrafı; Space Syntax angular integration (r = 800 m, 2 000 m); keçid arası məsafə həddi (mərkəzdə 200–300 m) üzrə uyğunsuzluq xəritəsi.",
     "OSM, Mapillary", "P2", "Xeyr", 10),
    ("3.3", "03", "İctimai nəqliyyata əlçatanlıq",
     "SDG 11.2.1: əhalinin 89.5%-i dayanacağa 500 m; metro sərnişini (gündə 555 509), BakuBus dayanacaqları (3 600) və marşrut yükü; “Dayanacağı yaxınlaşdırmaq” həlli E (1 254 blok); 2GIS ilə metroya piyada marşrutu.",
     8,
     "Xidmət tezliyi və iş saatları (GTFS) yoxdur, ona görə “dayanacaq var” ilə “xidmət var” fərqlənmir; PTAL tipli əlçatanlıq səviyyəsi, iş yerlərinə 30/45 dəqiqəlik çatımlılıq ölçülməyib.",
     "BNA-dan GTFS tələbi; PTAL (TfL) metodu ilə 0–6b əlçatanlıq səviyyəsi; r5py / OpenTripPlanner ilə 30 və 45 dəqiqəlik izoxronlar və iş yerinə çatımlılıq.",
     "Bakı Nəqliyyat Agentliyi (GTFS), BakuBus", "P1", "Xeyr", 10),
    ("3.4", "03", "Velosiped və mikromobillik",
     "68 velosiped zolağı hissəsi, 641 velosiped parkinqi (mərkəz); Amsterdam modelinin relyef və Xəzri baxımından risk analizi; meyl xəritəsi (/modeller, /xerite).",
     5,
     "Şəbəkə bağlılığı, LTS (Level of Traffic Stress) təsnifatı, meylə uyğun marşrutlar, skuter/velosiped paylaşımı datası yoxdur; bütün Bakı üzrə velo-infrastruktur ölçülməyib.",
     "LTS 1–4 təsnifatı (sürət, zolaq sayı, ayrılmış zolaq); meyli ≤ 5% olan velosiped dəhlizi xəritəsi; metro stansiyalarına 3 km “son mil” çatımlılığı; paylaşım operatorlarından səfər datası.",
     "OSM, Yerüstü Nəqliyyat Agentliyi, paylaşım operatorları", "P3", "Qismən", 6),
    ("3.5", "03", "Yol təhlükəsizliyi (Vision Zero)",
     "Proksi göstərici: magistralda işıqforlu keçid payı və keçidsiz hissələr; 30 km/saat və piyada keçidi standartı qaydaları.",
     3,
     "Yol-nəqliyyat hadisələrinin koordinatlı datası yoxdur, ona görə “yüksək zədə şəbəkəsi” (High-Injury Network) qurulmayıb; sürət datası yoxdur. Vision Zero iddiası data ilə təsdiqlənmir.",
     "DİN Dövlət Yol Polisindən koordinatlı YNH datası (son 5 il); High-Injury Network; iRAP ulduz reytinqi ilə prioritet küçələr; sürət kameraları və orta sürət datası.",
     "DİN Dövlət Yol Polisi, iRAP", "P1", "Xeyr", 8),
    ("3.6", "03", "Hərəkətin idarə olunması (tıxac, parkinq, sürət)",
     "Parkinq qaydaları və 30 km/saat qaydası təklif kimi; Seul ssenarisi yalnız piyada indeksinə təsiri göstərir.",
     4,
     "Nəqliyyat axını, orta sürət və parkinq doluluğu datası yoxdur; ssenarilərin avtomobil gecikməsinə və tıxaca təsiri modelləşdirilməyib, ona görə “tıxac artacaq” etirazına cavab yoxdur.",
     "BNA intellektual nəqliyyat sistemi datası və ya TomTom/HERE sürət datası; yerüstü keçid ssenarisi üçün kəsişmə səviyyəsində gecikmə hesabı (HCM / Webster); parkinq doluluğu sayımı.",
     "BNA, TomTom/HERE", "P2", "Xeyr", 10),

    # ---------- 04 ----------
    ("4.1", "04", "Şəhər istiliyi (yer səthinin temperaturu)",
     "Landsat 8, 01.08.2026, 30 m; rayon, 1 km hücrə və blok səviyyəsində LST; əhaliyə görə 43.0 °C; “tərs istilik adası” tapıntısı; istilik stressi qatı (/analiz, /sintez).",
     7,
     "Tək bir yay günü istifadə olunur; gecə istiliyi (insan sağlamlığı üçün kritik) yoxdur; yer səthi temperaturu hava temperaturu və hiss olunan istilik (UTCI) deyil.",
     "2019–2026 iyul–avqust Landsat medianı (çoxillik sabit xəritə); MODIS/ECOSTRESS gecə LST; UTCI və ya WBGT ilə hiss olunan istilik; istilik dalğası günləri üçün “sərin marşrut” qatı.",
     "Landsat, MODIS, ECOSTRESS, ERA5", "P2", "Qismən", 6),
    ("4.2", "04", "Yaşıllıq və ağac örtüyü",
     "NDVI və yaşıl örtük payı (əhaliyə görə 24.7%); yaşıllıq çatışmazlığı qatı; “Kölgəli səki” (900 blok) və “Cib parkı” (534 blok) həlləri; kölgə və yaşıllıq norması qaydası.",
     6,
     "Ağac tacı örtüyü (canopy %) və küçə ağacı inventarı yoxdur; adambaşına yaşıl sahə hesablanmayıb; 3-30-300 qaydasına uyğunluq ölçülmür; quraq iqlim üçün suvarma tələbi nəzərə alınmayıb.",
     "Meta/WRI 1 m ağac hündürlüyü xəritəsi və ya Sentinel-2 10 m ilə canopy %; 3-30-300 qaydası (evdən 3 ağac görünür, 30% canopy, 300 m-də park) göstəricisi; quraqlığa davamlı yerli növlər siyahısı və damcı suvarma tələbi.",
     "Meta / WRI canopy height, Sentinel-2, Ekologiya Nazirliyi", "P1", "Qismən", 5),
    ("4.3", "04", "Su və mavi infrastruktur (leysan, drenaj)",
     "Alçaq sahil riski qatı (−20 m-dən aşağı ərazi); “Quru səki” (səki drenajı) həlli I (248 blok); sahil və alçaq ərazilər qaydası; M7 sel xəbərdarlığı modulu konsept kimi.",
     3,
     "Səth axını və su yığılma nöqtələri modelləşdirilməyib; keçirməyən səth payı ölçülməyib; leysan zamanı yeraltı keçidlərin su basması riski hesablanmayıb; su qıtlığı (Abşeron) və təkrar sudan istifadə yoxdur.",
     "DEM-dən axın toplanması (flow accumulation) və TWI ilə su yığılma nöqtələri; ESA WorldCover ilə keçirməyən səth payı; yağış bağları (rain garden) üçün yer seçimi; yeraltı keçidlər üçün sel risk reytinqi.",
     "SRTM / Copernicus DEM, ESA WorldCover, Azərsu", "P1", "Qismən", 6),
    ("4.4", "04", "Hava keyfiyyəti və səs-küy",
     "opendata.az-dan avtomobil emissiyaları (yalnız şəhər/ölkə səviyyəsi) yığılıb, saytda məkan üzrə istifadə olunmur.",
     2,
     "Hava keyfiyyətinin məkan paylanması və səs-küy xəritəsi yoxdur; magistral yanında yaşayan əhalinin məruz qalması ölçülmür.",
     "Sentinel-5P NO₂ (rayon üzrə), Ekologiya Nazirliyinin monitorinq stansiyaları; magistrallar üçün CNOSSOS-EU sadələşdirilmiş səs-küy buferi; magistraldan 100 m-də yaşayan əhali göstəricisi.",
     "Sentinel-5P, Ekologiya və Təbii Sərvətlər Nazirliyi", "P3", "Xeyr", 6),
    ("4.5", "04", "Enerji və resurs səmərəliliyi",
     "Yoxdur (yalnız “sərin dam” tövsiyəsi qayda mətnində).",
     1,
     "Dam günəş potensialı, küçə işıqlandırmasının enerji sərfi, soyuq dam/albedo, dairəvi iqtisadiyyat (tikinti tullantısı, təkrar material) göstəriciləri yoxdur.",
     "PVGIS + bina izi ilə dam günəş potensialı (kWh/il); albedo (Landsat) ilə “sərin dam” prioritet blokları; LED küçə işıqlandırmasına keçid üçün qənaət hesabı; Azərişıq dayanıqlıq datasının istifadəsi.",
     "PVGIS, Microsoft Building Footprints, Azərişıq", "P3", "Xeyr", 8),
    ("4.6", "04", "İqlim riskləri və adaptasiya",
     "Alçaq sahil payı rayon üzrə (Pirallahı 76%), dik yamac/sürüşmə proksisi; istilik və alçaq sahil problem qatları sintezdə.",
     4,
     "Xəzər səviyyəsinin dəyişmə ssenariləri, Xəzri küləyi komfortu, quraqlıq və istilik dalğası proqnozları, seysmik risk xəritəsi yoxdur.",
     "Xəzər səviyyəsi ssenariləri (−30 / −27 m) ilə sahil ekspozisiyası; Xəzri üçün küçə kanyonu külək komfortu (Lawson meyarları); CMIP6 istilik günləri proqnozu; seysmik mikrorayonlaşdırma (AMEA Respublika Seysmoloji Xidmət Mərkəzi).",
     "Copernicus Climate, AMEA RSXM, Hidrometeorologiya", "P2", "Xeyr", 10),

    # ---------- 05 ----------
    ("5.1", "05", "Data infrastrukturu və açıq data inteqrasiyası",
     "OSM, opendata.az (130 dataset), WorldPop/DSK 2024, Landsat, SRTM, 2GIS API; Python ETL skriptləri; hər deploy üçün data keşinin versiyalanması.",
     8,
     "ETL əl ilə işə salınır (planlı yenilənmə yoxdur); data kataloqu və metadata standartı (DCAT) yoxdur; dataların keyfiyyət və etibarlılıq balı xəritədə göstərilmir.",
     "GitHub Actions ilə həftəlik avtomatik yenilənmə; DCAT-AP formatında data kataloqu səhifəsi; hər hücrə/blok üçün “data etibarlılığı” (mənbə sayı, tarix) qatı.",
     "GitHub Actions, opendata.az API", "P2", "Xeyr", 6),
    ("5.2", "05", "Analitika və AI modelləri",
     "Qaydaya əsaslanan indekslər, Spearman korrelyasiyası, Getis-Ord Gi*, k-means tipologiyası, SKATER regionalizasiyası; 8 AI modulu təsvir olunub (/ai).",
     5,
     "8 AI modulunun heç biri öyrədilmiş model kimi işləmir (konseptdir); model validasiyası, xəta göstəriciləri və qeyri-müəyyənlik intervalları yoxdur; “AI platforması” iddiası ilə real imkan arasında fərq münsiflər tərəfindən görünəcək.",
     "Hakaton üçün ən azı 1 modulu işlək demo etmək: M6 (Azərbaycan dilində müraciət təsnifatı, LLM ilə) və ya M3 (Mapillary şəkillərində səki maneəsi aşkarlanması); indekslər üçün həssaslıq analizi və etibarlılıq intervalı.",
     "LLM API, Mapillary, açıq modellər (YOLO)", "P1", "Qismən", 10),
    ("5.3", "05", "Qərar dəstəyi və ssenarilər (rəqəmsal əkiz)",
     "Seul ssenarisi (indeksin yenidən hesablanması), 237 zona üzrə proqramlar, prioritet zonalar, 10 qayda, “büdcə ehtiyaca görə” məntiqi (/xerite, /bolgeleme, /qaydalar).",
     6,
     "Ssenari yalnız indeks dəyişikliyini göstərir; xərc, müddət, faydalanan əhali və nəqliyyat təsiri birlikdə hesablanmır; 3D/rəqəmsal əkiz yoxdur.",
     "Hər həll üçün “xərc → faydalanan əhali → indeks artımı” kalkulyatoru; çoxmeyarlı qərar (AHP/TOPSIS) ilə investisiya sıralaması; CityJSON 3D bloklar (gələcək mərhələ).",
     "Smeta normativləri, OSM", "P1", "Bəli", 6),
    ("5.4", "05", "Vətəndaş iştirakı",
     "Sahə yoxlaması forması (şəkil ilə), “Data xətası bildir” forması (Netlify Forms), sadə dil və tur xəritəsi.",
     4,
     "Sakinlərin təklif verməsi, xəritədə şərh və səsvermə, “siz dediniz – biz etdik” cavab dövrü yoxdur; formaların cavabları saytda görünmür; e-gov/ASAN inteqrasiyası yoxdur.",
     "Xəritədə nöqtə qoyub təklif/şikayət bildirmə və səsvermə (Maptionnaire/Decidim modeli); cavabların ictimai paneli; M6 ilə müraciətlərin avtomatik təsnifatı; məktəb və bələdiyyələrlə iştirak kampaniyası.",
     "Netlify Forms → baza (Supabase və s.)", "P1", "Qismən", 8),
    ("5.5", "05", "Operativ xidmət və real vaxt",
     "Yoxdur: bütün data statikdir.",
     2,
     "Real vaxt avtobus gəlişi, istilik dalğası və sel xəbərdarlığı, keçid/lift nasazlığı bildirişi yoxdur.",
     "BakuBus real vaxt API-si ilə dayanacaqda gəliş vaxtı; Hidrometeorologiya xəbərdarlıqları ilə “bu gün sərin marşrut” bildirişi; lift/eskalator nasazlığı üçün sakin bildirişi.",
     "BakuBus, Milli Hidrometeorologiya Xidməti", "P3", "Xeyr", 12),
    ("5.6", "05", "Etika, məxfilik, təhlükəsizlik və idarəetmə",
     "Konseptdə alqoritm reyestri, edge-AI anonimləşdirmə, “AI təklif edir – insan təsdiq edir” prinsipi (/ai).",
     4,
     "2GIS API açarı ictimai GitHub reposunda kodun içində açıq yazılıb (src/utils/api/twogis.js); 2GIS datasının saxlanması və yayımı lisenziya baxımından yoxlanılmayıb; məxfilik siyasəti və alqoritm reyestri səhifəsi yoxdur.",
     "Açarı dərhal dəyişmək, mühit dəyişəninə (VITE_2GIS_KEY) keçirmək və 2GIS Platform Manager-də domenlə məhdudlaşdırmaq; 2GIS istifadə şərtlərinə uyğunluğu yoxlamaq; məxfilik siyasəti və açıq alqoritm reyestri səhifəsi (Fərdi məlumatlar haqqında Qanun).",
     "2GIS Platform Manager, hüquqi yoxlama", "P1", "Bəli", 2),
    ("5.7", "05", "Miqyaslanma, davamlılıq və biznes modeli",
     "B2G SaaS və “piyada balı” API modeli; Gəncə, Sumqayıt üçün təkrarlanma; GitHub + Netlify deploy (/pilot, /metodologiya).",
     5,
     "Netlify kreditləri bitib, yeni deploy-lar dayandırılıb (10.11.2026) – hakaton zamanı yeniləmə mümkün deyil; xərc modeli, KPI paneli və texniki dəstək planı yoxdur.",
     "Ehtiyat hostinq (Cloudflare Pages / Vercel) və ya Netlify planının yüksəldilməsi; pilot üçün xərc smetası və 3 KPI (keçid gözləmə vaxtı, piyada sayı, kölgə %); şəhər üçün tətbiq yol xəritəsi.",
     "Cloudflare Pages, Netlify", "P1", "Bəli", 2),
]

SCALE = [
    (0, 2, "Yoxdur / çox zəif", "İstiqamət saytda praktiki olaraq əks olunmur və ya yalnız mətndə qeyd edilir."),
    (3, 4, "Səthi", "Proksi göstəricilər və ya konsept var; real data, məkan analizi və həll zəifdir."),
    (5, 6, "Orta", "Data və xəritə var, amma əsas göstəricilərin bir hissəsi yoxdur və ya kalibrlənməyib."),
    (7, 8, "Dərin", "Çoxmənbəli data, məkan analizi, həll və qayda təklifləri bir-birinə bağlıdır."),
    (9, 10, "Peşəkar / tətbiqə hazır", "Validasiya edilmiş data və modellər, xərc və təsir hesabı, real istifadəçi dövrü var."),
]

# ---------- stil ----------
F = "Arial"
H_FILL = PatternFill("solid", fgColor="165A7A")
T_FILL = PatternFill("solid", fgColor="D6E7EF")
WHITE = Font(name=F, bold=True, color="FFFFFF", size=10)
BOLD = Font(name=F, bold=True, size=10)
NORM = Font(name=F, size=10)
SMALL = Font(name=F, size=9, color="44565E")
TITLE = Font(name=F, bold=True, size=14, color="165A7A")
INPUT = Font(name=F, size=10, color="0000FF", bold=True)
thin = Side(style="thin", color="CDD8D5")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(horizontal="center", vertical="top", wrap_text=True)

wb = Workbook()

# ================= Qiymətləndirmə =================
ws = wb.active
ws.title = "Qiymətləndirmə"
ws["A1"] = "ADDIM Bakı – istiqamətlər üzrə meyar səviyyəsində qiymətləndirmə"
ws["A1"].font = TITLE
ws["A2"] = "Ekspert: şəhərsalma mühəndisi baxışı. Sübut: addim-front kodu və public/data faylları (commit 5b12212, 10.11.2026). Göy rəngli bal xanaları redaktə oluna bilər; bütün cəmlər düsturla yenilənir."
ws["A2"].font = SMALL
ws.merge_cells("A2:L2")
headers = ["ID", "İstiqamət", "Meyar", "Saytda nə var (sübut)", "Bal (0–10)", "Dərinlik səviyyəsi", "Çatışmazlıq", "Peşəkar tövsiyə", "Data mənbəyi", "Prioritet", "Hakatona qədər (24 saat)?", "Səy (saat)"]
HR = 4
for i, h in enumerate(headers, 1):
    c = ws.cell(row=HR, column=i, value=h)
    c.font = WHITE
    c.fill = H_FILL
    c.alignment = CENTER
    c.border = BORDER
first = HR + 1
for r, row in enumerate(ROWS, first):
    rid, tr, crit, have, score, gap, rec, src, prio, h24, effort = row
    vals = [rid, tr, crit, have, score, None, gap, rec, src, prio, h24, effort]
    for col, v in enumerate(vals, 1):
        c = ws.cell(row=r, column=col, value=v)
        c.font = NORM
        c.alignment = WRAP
        c.border = BORDER
    ws.cell(row=r, column=5).font = INPUT
    ws.cell(row=r, column=5).alignment = CENTER
    ws.cell(row=r, column=6, value=f'=IF(E{r}>=9,"Peşəkar",IF(E{r}>=7,"Dərin",IF(E{r}>=5,"Orta",IF(E{r}>=3,"Səthi","Yoxdur/zəif"))))').alignment = CENTER
    ws.cell(row=r, column=6).font = NORM
    for col in (1, 2, 10, 11, 12):
        ws.cell(row=r, column=col).alignment = CENTER
last = first + len(ROWS) - 1
widths = [6, 9, 26, 46, 9, 13, 50, 56, 28, 9, 12, 8]
for i, w in enumerate(widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = ws.cell(row=first, column=4)
ws.auto_filter.ref = f"A{HR}:L{last}"
ws.conditional_formatting.add(f"E{first}:E{last}", ColorScaleRule(start_type="num", start_value=0, start_color="F8D3D0", mid_type="num", mid_value=5, mid_color="FFF2CC", end_type="num", end_value=10, end_color="C9E7C8"))
ws.conditional_formatting.add(f"J{first}:J{last}", CellIsRule(operator="equal", formula=['"P1"'], fill=PatternFill("solid", fgColor="F6E1DD"), font=Font(name=F, bold=True, color="A8352B")))
dv = DataValidation(type="whole", operator="between", formula1="0", formula2="10", showErrorMessage=True, errorTitle="Bal", error="0 ilə 10 arasında tam ədəd yazın")
ws.add_data_validation(dv)
dv.add(f"E{first}:E{last}")
dvp = DataValidation(type="list", formula1='"P1,P2,P3"')
ws.add_data_validation(dvp)
dvp.add(f"J{first}:J{last}")
ws.cell(row=HR, column=5).comment = Comment("Ekspert balı 0–10. Şkala: 'Bal şkalası və metod' vərəqi.", "ADDIM")
ws.cell(row=HR, column=10).comment = Comment("P1: hakaton və pilot üçün kritik; P2: pilot mərhələsi (0–6 ay); P3: miqyaslanma mərhələsi.", "ADDIM")
ws.cell(row=HR, column=12).comment = Comment("Komandanın təxmini iş saatı (1 nəfər). Ekspert təxminidir.", "ADDIM")
for r in range(first, last + 1):
    ws.row_dimensions[r].height = 120

# ================= Xülasə =================
sm = wb.create_sheet("Xülasə", 0)
sm["A1"] = "ADDIM Bakı – hakatonun 5 istiqaməti üzrə ekspert qiymətləndirməsi"
sm["A1"].font = TITLE
sm["A2"] = "Qiymətləndirən: şəhərsalma mühəndisi baxışı · Obyekt: https://addim-baku.netlify.app və addim-front reposu · Tarix: 10.11.2026"
sm["A2"].font = SMALL
sm.merge_cells("A2:J2")
sh = ["Kod", "İstiqamət", "İstiqamətin təsviri (hakaton)", "Orta bal (0–10)", "Dərinlik", "Meyar sayı", "Zəif meyarlar (bal < 5)", "P1 çatışmazlıqlar", "Çəki", "Çəkili bal"]
for i, h in enumerate(sh, 1):
    c = sm.cell(row=4, column=i, value=h)
    c.font = WHITE
    c.fill = H_FILL
    c.alignment = CENTER
    c.border = BORDER
Q = "'Qiymətləndirmə'"
for k, (code, name, desc) in enumerate(TRACKS, 5):
    vals = [code, name, desc,
            f'=ROUND(AVERAGEIF({Q}!$B${first}:$B${last},A{k},{Q}!$E${first}:$E${last}),1)',
            f'=IF(D{k}>=9,"Peşəkar",IF(D{k}>=7,"Dərin",IF(D{k}>=5,"Orta",IF(D{k}>=3,"Səthi","Yoxdur/zəif"))))',
            f'=COUNTIF({Q}!$B${first}:$B${last},A{k})',
            f'=COUNTIFS({Q}!$B${first}:$B${last},A{k},{Q}!$E${first}:$E${last},"<5")',
            f'=COUNTIFS({Q}!$B${first}:$B${last},A{k},{Q}!$J${first}:$J${last},"P1")',
            0.2,
            f"=ROUND(D{k}*I{k},2)"]
    for col, v in enumerate(vals, 1):
        c = sm.cell(row=k, column=col, value=v)
        c.font = NORM
        c.alignment = WRAP if col in (2, 3) else CENTER
        c.border = BORDER
    sm.cell(row=k, column=9).font = INPUT
    sm.cell(row=k, column=9).number_format = "0%"
    sm.cell(row=k, column=4).number_format = "0.0"
tot = 5 + len(TRACKS)
sm.cell(row=tot, column=2, value="Ümumi (çəkili)").font = BOLD
sm.cell(row=tot, column=4, value=f"=ROUND(SUMPRODUCT(D5:D{tot-1},I5:I{tot-1})/SUM(I5:I{tot-1}),1)").font = BOLD
sm.cell(row=tot, column=4).number_format = "0.0"
sm.cell(row=tot, column=5, value=f'=IF(D{tot}>=9,"Peşəkar",IF(D{tot}>=7,"Dərin",IF(D{tot}>=5,"Orta",IF(D{tot}>=3,"Səthi","Yoxdur/zəif"))))').font = BOLD
sm.cell(row=tot, column=6, value=f"=SUM(F5:F{tot-1})").font = BOLD
sm.cell(row=tot, column=7, value=f"=SUM(G5:G{tot-1})").font = BOLD
sm.cell(row=tot, column=8, value=f"=SUM(H5:H{tot-1})").font = BOLD
sm.cell(row=tot, column=9, value=f"=SUM(I5:I{tot-1})").font = BOLD
sm.cell(row=tot, column=9).number_format = "0%"
for col in range(1, 11):
    sm.cell(row=tot, column=col).border = BORDER
    sm.cell(row=tot, column=col).fill = T_FILL
    sm.cell(row=tot, column=col).alignment = CENTER
sm.cell(row=4, column=9).comment = Comment("Çəkilər bərabər götürülüb (hər istiqamət 20%). Göy xanaları dəyişib prioritetinizi əks etdirə bilərsiniz; cəmi 100% olmalıdır.", "ADDIM")
sm.conditional_formatting.add(f"D5:D{tot}", ColorScaleRule(start_type="num", start_value=0, start_color="F8D3D0", mid_type="num", mid_value=5, mid_color="FFF2CC", end_type="num", end_value=10, end_color="C9E7C8"))
for i, w in enumerate([6, 34, 52, 11, 11, 9, 12, 12, 8, 10], 1):
    sm.column_dimensions[get_column_letter(i)].width = w
for r in range(5, tot):
    sm.row_dimensions[r].height = 62

# Ekspert rəyi (mətn)
VERDICT = [
    ("Ümumi rəy", "ADDIM güclü məkan-analitik əsasa malikdir: bütün Bakı üzrə 9 mövzulu analiz, 1 km və blok səviyyəsində sintez (Gi*, k-means, SKATER), 237 planlama zonası, 9 həll tipi və 10 qayda bir-birinə bağlıdır. Ən güclü istiqamət “Hərəkətdə şəhər”dir. Ən zəif yerlər: ictimai məkanın keyfiyyəti, real əlçatanlıq auditi, su/enerji/hava keyfiyyəti və işlək AI modulları. Platforma hazırda “ölç → tap → təklif et” mərhələsindədir; “sına → ölç → yay” dövrü üçün sahə datası və vətəndaş iştirakı lazımdır."),
    ("01 · Rahat şəhər", "Küçə canlılığı və məhəllə səviyyəsində həllər yaxşıdır. Amma ictimai məkanın özü (inventar, keyfiyyət, istifadə) ölçülmür. Münsiflər “parklar və meydanlar haqqında nə bilirsiniz?” sualını verəcək."),
    ("02 · Hər kəs üçün şəhər", "Əlillik datası və sosial bərabərlik analizi var. Fiziki maneə auditi, yaşlı və gender datası yoxdur. Yeraltı keçid hekayəsi güclüdür, amma pandus/lift üzrə real rəqəm yoxdur."),
    ("03 · Hərəkətdə şəhər", "Ən dərin istiqamət: piyada indeksi, maneələr, nəqliyyat əlçatanlığı və marşrut. Kritik boşluq: yol qəzası datası olmadan Vision Zero iddiası zəif qalır; GTFS olmadan dayanacaq xidmət demək deyil."),
    ("04 · Yaşıl şəhər", "İstilik və yaşıllıq üzrə peyk analizi yaxşıdır, “tərs istilik adası” orijinal tapıntıdır. Su (leysan, drenaj, qıtlıq), hava keyfiyyəti və enerji demək olar ki, yoxdur. Bu istiqamət üçün ən azı drenaj/su yığılma qatı əlavə olunmalıdır."),
    ("05 · Ağıllı şəhər", "Data inteqrasiyası və analitika güclüdür, amma 8 AI modulu konseptdir. Ən təcili məsələ texnikidir: 2GIS API açarı ictimai repoda açıqdır və Netlify deploy-ları dayanıb. Hakatonda ən azı bir işlək AI demosu “AI platforması” iddiasını təsdiqləyər."),
]
vr = tot + 2
sm.cell(row=vr, column=1, value="Ekspert rəyi").font = TITLE
for i, (h, t) in enumerate(VERDICT, vr + 1):
    sm.cell(row=i, column=1, value=h).font = BOLD
    sm.merge_cells(start_row=i, start_column=1, end_row=i, end_column=2)
    sm.cell(row=i, column=3, value=t).font = NORM
    sm.cell(row=i, column=3).alignment = WRAP
    sm.merge_cells(start_row=i, start_column=3, end_row=i, end_column=10)
    sm.row_dimensions[i].height = 70 if i > vr + 1 else 95
    sm.cell(row=i, column=1).alignment = WRAP

# ================= Hakatona qədər =================
hk = wb.create_sheet("Hakatona qədər")
hk["A1"] = "Hakatona qədər (24 saat) edilə biləcək işlər – prioritet sırası ilə"
hk["A1"].font = TITLE
hk["A2"] = "Mənbə: “Qiymətləndirmə” vərəqində “Hakatona qədər” = Bəli və ya Qismən olan meyarlar. Sıralama: P1 → P2, sonra az səy."
hk["A2"].font = SMALL
hh = ["#", "ID", "İstiqamət", "Meyar", "Görüləcək iş (qısa)", "Prioritet", "Səy (saat)", "Cari bal", "Gözlənilən bal"]
for i, h in enumerate(hh, 1):
    c = hk.cell(row=4, column=i, value=h)
    c.font = WHITE
    c.fill = H_FILL
    c.alignment = CENTER
    c.border = BORDER
QUICK = {
    "5.6": ("2GIS açarını dəyiş, env-ə köçür, domenlə məhdudlaşdır", 6),
    "5.7": ("Ehtiyat hostinq (Cloudflare Pages) qur, son versiyanı yayımla", 6),
    "1.1": ("Bütün Bakı üçün park/meydan inventarı + m²/nəfər və SDG 11.7.1", 7),
    "1.2": ("Gehl 12 meyarı çeklistini sahə formasına əlavə et", 4),
    "1.6": ("Sahil boyu fasiləsiz promenad və bulvara keçid göstəricisi", 6),
    "2.1": ("Əlilliyi zona səviyyəsinə paylama (dasimetrik)", 7),
    "2.2": ("20 bəndlik əlçatanlıq çeklisti + metro lift reyestri", 5),
    "2.3": ("Məktəb 10 dəq zonasında risk keçidləri siyahısı", 7),
    "2.6": ("Ehtiyac indeksinə sosial zəiflik çəkisi", 8),
    "2.7": ("Lighthouse/axe yoxlaması, kontrast düzəlişləri", 6),
    "3.1": ("İndeks çəkiləri üçün həssaslıq analizi", 9),
    "3.4": ("Meyli ≤ 5% velosiped dəhlizi xəritəsi", 6),
    "4.1": ("2019–2026 çoxillik yay LST medianı", 8),
    "4.2": ("3-30-300 göstəricisi (canopy ilə)", 7),
    "4.3": ("DEM-dən su yığılma nöqtələri + yeraltı keçid sel riski", 5),
    "5.2": ("1 işlək AI demo: AZ müraciət təsnifatı (M6)", 7),
    "5.3": ("Həll kalkulyatoru: xərc → faydalanan əhali → bal artımı", 8),
    "5.4": ("Xəritədə təklif/şikayət nöqtəsi və ictimai cavab paneli", 6),
    "1.5": ("9 həll tipi üçün vahid xərc cədvəli", 8),
}
quick_rows = [r for r in ROWS if r[9] in ("Bəli", "Qismən") and r[0] in QUICK]
quick_rows.sort(key=lambda r: (r[8], r[10]))
for n, row in enumerate(quick_rows, 1):
    rr = 4 + n
    rid = row[0]
    vals = [n, rid,
            f'=INDEX({Q}!$B${first}:$B${last},MATCH(B{rr},{Q}!$A${first}:$A${last},0))',
            f'=INDEX({Q}!$C${first}:$C${last},MATCH(B{rr},{Q}!$A${first}:$A${last},0))',
            QUICK[rid][0],
            f'=INDEX({Q}!$J${first}:$J${last},MATCH(B{rr},{Q}!$A${first}:$A${last},0))',
            f'=INDEX({Q}!$L${first}:$L${last},MATCH(B{rr},{Q}!$A${first}:$A${last},0))',
            f'=INDEX({Q}!$E${first}:$E${last},MATCH(B{rr},{Q}!$A${first}:$A${last},0))',
            QUICK[rid][1]]
    for col, v in enumerate(vals, 1):
        c = hk.cell(row=rr, column=col, value=v)
        c.font = NORM
        c.alignment = WRAP if col in (4, 5) else CENTER
        c.border = BORDER
    hk.cell(row=rr, column=9).font = INPUT
qe = 4 + len(quick_rows)
hk.cell(row=qe + 1, column=6, value="Cəmi səy:").font = BOLD
hk.cell(row=qe + 1, column=7, value=f"=SUM(G5:G{qe})").font = BOLD
hk.cell(row=qe + 2, column=6, value="Orta bal artımı:").font = BOLD
hk.cell(row=qe + 2, column=7, value=f"=ROUND(AVERAGE(I5:I{qe})-AVERAGE(H5:H{qe}),1)").font = BOLD
hk.cell(row=4, column=9).comment = Comment("Ekspert təxmini: iş görüləndən sonra meyarın ehtimal olunan balı.", "ADDIM")
for i, w in enumerate([5, 6, 9, 30, 52, 9, 9, 9, 11], 1):
    hk.column_dimensions[get_column_letter(i)].width = w
for r in range(5, qe + 1):
    hk.row_dimensions[r].height = 34

# ================= Bal şkalası və metod =================
mt = wb.create_sheet("Bal şkalası və metod")
mt["A1"] = "Bal şkalası və qiymətləndirmə metodu"
mt["A1"].font = TITLE
for i, h in enumerate(["Bal (min)", "Bal (max)", "Səviyyə", "Meyar"], 1):
    c = mt.cell(row=3, column=i, value=h)
    c.font = WHITE
    c.fill = H_FILL
    c.alignment = CENTER
    c.border = BORDER
for r, (a, b, lv, d) in enumerate(SCALE, 4):
    for col, v in enumerate([a, b, lv, d], 1):
        c = mt.cell(row=r, column=col, value=v)
        c.font = NORM
        c.alignment = WRAP if col == 4 else CENTER
        c.border = BORDER
METHOD = [
    "1. Obyekt: ADDIM Bakı veb-tətbiqi (13 səhifə) və onun data faylları (public/data, 31 fayl), GitHub commit 5b12212, 10.11.2026.",
    "2. İstiqamətlər hakatonun rəsmi 5 istiqamətidir (research areas qovluğu). Hər istiqamət 6–7 meyara bölünüb (cəmi 33 meyar).",
    "3. Meyarlar beynəlxalq çərçivələrə əsaslanır: Gehl (Public Space Quality, PSPL), WHO Age-friendly Cities, UNICEF Child Friendly Cities, UN Women Safe Cities, SDG 11 (11.2.1, 11.7.1), Vision Zero / iRAP, TfL PTAL, LTS, 3-30-300 qaydası, WCAG 2.2.",
    "4. Bal yalnız saytda real olaraq mövcud olan data, analiz, xəritə və həllə görə verilir. Konsept və mətnlə qeyd olunan, amma işləməyən imkan maksimum 3–4 bal alır.",
    "5. İstiqamətin balı meyarların sadə ortalamasıdır; ümumi bal istiqamətlərin çəkili ortalamasıdır (default çəki 20%).",
    "6. Bütün ballar, prioritetlər və səy təxminləri ekspert rəyidir; göy rəngli xanaları dəyişdikdə cəmlər avtomatik yenilənir.",
    "7. Prioritet: P1 – hakaton və pilot üçün kritik; P2 – pilot mərhələsi (0–6 ay); P3 – miqyaslanma mərhələsi.",
]
for i, t in enumerate(METHOD, 11):
    c = mt.cell(row=i, column=1, value=t)
    c.font = NORM
    c.alignment = WRAP
    mt.merge_cells(start_row=i, start_column=1, end_row=i, end_column=4)
    mt.row_dimensions[i].height = 32
mt.cell(row=10, column=1, value="Metod").font = BOLD
for i, w in enumerate([10, 10, 22, 80], 1):
    mt.column_dimensions[get_column_letter(i)].width = w

for sheet in wb.worksheets:
    sheet.sheet_view.showGridLines = False
# Excel açılanda bütün düsturları yenidən hesablasın
from openpyxl.workbook.properties import CalcProperties
wb.calculation = CalcProperties(fullCalcOnLoad=True)
wb.save(OUT)
print(OUT, len(ROWS), "meyar")
