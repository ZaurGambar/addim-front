# SmartFlow kod analizi və ADDIM datasının inteqrasiyası

Tarix: 11.11.2026. Mənbə: `smartflow-fe-main` (sərnişin tətbiqi), `smartflow-admin-main` (AYNA paneli) və
`https://smartflow.runasp.net/api` cavabları. Backend (server) kodu təqdim olunmayıb: server daxilində nəyin necə
hesablandığı yalnız API cavablarından görünür, bilinməyənlər ayrıca qeyd olunub.

Məqsəd: yekun məhsul **SmartUrban** — SmartFlow platforması + ADDIM-in inklüziv əlçatanlıq datası. ADDIM-in rolu
**data formalaşdırmaq**: SmartFlow-un analitikası, ssenariləri və təklifləri hər sakin qrupu üçün düzgün çıxsın.

## 1. SmartFlow nədir (koddan)

| Hissə | Nə edir | Data / API |
|---|---|---|
| Sərnişin tətbiqi | “Hara gedirik?” → ən yaşıl / sürətli / ucuz variant; addım-addım naviqasiya; “Burada nə çatmır?” bildirişi; xal və kupon; AI köməkçi | `/journeys/plan`, `/journeys/choose`, `/reports`, `/ai/ask`, `/bonus` |
| Admin: İcmal | Səfər, CO₂, nəqliyyat bölgüsü, **profil bölgüsü**, zona üzrə O-D matris, avtomatik tapıntılar | `/admin/report`, `/admin/insights`, `/admin/zones` |
| Admin: Bildirişlər | Vətəndaş və **avtomatik** bildirişlər, status axını (yeni → icrada → həll) | `/admin/reports` |
| Admin: Velozolaq | Real velo səfərlərinin zolaqsız küçədən keçməsi + bildirişlər → küçə prioriteti (PCT/LCWIP) | `/admin/lanes` |
| Admin: Mobility Hub | 52 namizəd, 4 çəkili göstərici (tələb, qovşaq, əhali 400 m, POI), rəsmi hablarla yoxlama; büdcə optimallaşdırması | `/hubs`, `/scenarios/*` |
| Admin: Əlçatanlıq | TfL PTAL xanaları, dayanacaqdan uzaq əhali, Park & Ride | `/access/ptal`, `/access/gaps` |
| Admin: Proqnoz | Metro/BakuBus gündəlik sərnişin proqnozu; dəhliz simulyatoru (velo/avtobus zolağı) | `/forecast`, `/admin/simulate` |
| Admin: Qaydalar | Tarif, bonus, antifraud, P&R, ssenari xərcləri, simulyator fərziyyələri (redaktə olunur) | `/admin/rules` |
| Admin: AI analitik | Sual → mətn, rəqəm, cədvəl, qrafik, keçid | `/admin/ai/ask` |

Metodologiya səhifəsində (`smartflow-admin-main/src/pages/Methodology/index.jsx`) sintetik data açıq yazılıb:
Safe Parking Zone, ssenari vahid xərcləri, canlı avtobuslar.

## 2. İnklüzivlik SmartFlow-da artıq necə var (dəlillə)

1. **Sərnişin profilləri**: `standard` (Adi), `senior` (“Əlil: pilləkənsiz, az piyada”), `child` (“Uşaqla: velosiz, təhlükəsiz”)
   — `smartflow-fe-main/src/utils/lib/journeyParams.js:2-6`. Profil marşrut sorğusu ilə serverə gedir (`usePlan.js:7`).
2. **Server profili nəzərə alır** (API testi, 28 May → Gənclik, 11.11.2026):

   | Profil | Variantlar |
   |---|---|
   | standard | APAR velosiped 17.3 dəq · Avtobus M7S 19.2 · Piyada 36.4 (2.9 km) · Metro 8.9 |
   | senior | Avtobus 5 + 83 24.7 · Metro 9.1 — velosiped və uzun piyada çıxarılıb, başqa avtobus seçilib |
   | child | Avtobus M7S 19.9 · Piyada 44.5 · Metro 9.0 — velosiped çıxarılıb, piyada yavaş hesablanıb |

   Serverin `senior` üçün hansı qaydaları işlətdiyi (pilləkən, lift, yamac, keçid) kod olmadan **məlum deyil**.
3. **Analitikada profil**: İcmalda “Profil bölgüsü” (`Dashboard/index.jsx`), filtr `Hər profil / Adi / Əlil / Uşaqla`
   (`components/report/ReportFilterBar.jsx`), səfər detalında profil (`Trips/TripDetail.jsx:142`).
4. **Səfər qeydində profil və marşrut həndəsəsi** saxlanılır (`fe/pages/site/Navigate/index.jsx:197`).
5. **Demoqrafiya**: qeydiyyatda doğum tarixi və cins toplanır (`fe/pages/site/Profile/PersonalForm.jsx:12-13`).
6. **Bildiriş növləri**: velozolaq, velo parkinq, dayanacaq, avtobus gecikir, təhlükəli keçid, digər
   (`admin/src/components/common/format.js:14`). Pandus, lift, səki, oturacaq kimi əlçatanlıq növü **yoxdur**.

## 3. ADDIM datası SmartFlow-un hara qoşulur

| # | SmartFlow modulu | Hazırkı vəziyyət | ADDIM-in verdiyi data | Nəticə analitikada |
|---|---|---|---|---|
| 1 | İcmal, zona filtri, O-D | Zonalar `/admin/zones` | 237 planlama zonası, 2 685 blok: əhali (DSK 2024), yaşlı/uşaq/əlilliyi olan təxmini sayı, sosial zəiflik indeksi | Səfər sayı **həssas qrupun sayına nisbətdə** (məs. 1 000 yaşlıya “Əlil” profilli səfər) → az xidmət alan zonalar görünür |
| 2 | Əlçatanlıq (PTAL, boşluqlar) | Yalnız ictimai nəqliyyat, bir profil | 4 profil × 6 xidmət üçün 10 dəqiqəlik çatım (dayanacaq, aptek, səhiyyə, ərzaq, park, bağça); maneə qatı | “Əlçatanlıq” səhifəsinə profil seçimi: eyni xəritə yaşlı və əlil arabası üçün |
| 3 | Mobility Hub reytinqi | 4 çəki: tələb, qovşaq, əhali, POI | 5-ci çəki: **inklüziv ehtiyac** (zəiflik indeksi × əlçatanlıq boşluğu); hub ətrafında maneələr | Hab seçimi həm axına, həm kənarda qalan insana görə |
| 4 | Hab ssenariləri | Xərc, yeni səfər, CO₂, velo parkinq örtüyü | Əlçatanlıq tədbirləri (lift, pandus, kölgə, oturacaq) və nəticə göstəricisi: hər profil üçün 10 dəq çatım dəyişməsi | Ssenari kartında “+N yaşlı / əlilliyi olan 10 dəqiqəlik məhəlləyə” |
| 5 | Bildirişlər | 6 növ, vətəndaş + avtomatik (velozolaq boşluğu) | Yeni növlər: pandus, lift, səki, pilləkən, oturacaq/kölgə; **avtomatik**: “Əlil” profilli səfərin piyada hissəsi ADDIM maneəsinə (83 yeraltı keçid, > 8% yamac) toxunanda | Velozolaq modulunun eyni məntiqi ilə “maneə prioriteti” siyahısı |
| 6 | Marşrut mühərriki (server) | `senior`/`child` qaydaları bilinmir | Maneə qatı (`barriers_access.json`), profil sürətləri, yamac (SRTM) | Server qaydalarına data; nəticəni API testləri ilə müqayisə |
| 7 | AI analitik | Mobillik sualları | İnklüziv suallar üçün data: “Harada yaşlılar aptekə 10 dəqiqədə çatmır?”, “Hansı hab əlil arabası üçün ən çox insanı qaytarır?” | Cavab rəqəm + cədvəl + xəritə keçidi ilə |
| 8 | Metodologiya | SUMP, MoLo, PTAL, PCT, MDS, Moskva TMC | Gi*, k-means, SKATER, Monte Carlo həssaslıq, profil üzrə şəbəkə çatımı, zəiflik indeksi | Metod şəffaflığı |

## 4. Harmonizasiya məsələləri (data uyğunlaşdırması)

| Məsələ | SmartFlow | ADDIM | Lazım olan |
|---|---|---|---|
| Ərazi və əhali | PTAL xanalarında cəmi **3 072 599** nəfər (Xırdalan da daxil görünür) | 12 rayon, **2 227 909** nəfər (WorldPop → DSK 2024) | Ortaq sərhəd və əhali mənbəyi; Abşeron üçün ADDIM-i genişləndirmək |
| Xana ölçüsü | API: 0.00333° (~280 × 370 m); metodologiyada “100 m xanalar” yazılıb | Məhəllə blokları (küçələrlə) + 1 km hücrə | Ortaq vahid: blok → zona; PTAL xanasına blokdan əhali paylanması |
| Dayanacaqdan uzaq əhali | `/access/gaps`: 322 808 nəfər (hədd API-də göstərilmir) | 400 m şəbəkə üzrə 1 264 202, 800 m üzrə 524 550 | Həddi və məsafə növünü (düz xətt / şəbəkə) razılaşdırmaq |
| Dayanacaqlar | “OpenStreetMap-dəndir (az sayda xəttdə fərz olunur)” — API qeydi | BakuBus opendata.az + OSM + metro: 5 441 nöqtə | ADDIM dayanacaq bazasını SmartFlow-a vermək |
| Profillər | 3: standard, senior, child | 4: orta, yaşlı, əlil arabası, uşaq arabası | Ortaq siyahı: `senior`-u “yaşlı” və “əlil arabası”na bölmək (ayrı qaydalar) |

## 5. Backend tərəfdən lazım olanlar

1. Server kodu və ya sənədi: `senior` və `child` profillərinin marşrut qaydaları, `/access/gaps` həddi, əhali mənbəyi.
2. `/reports` üçün yeni `type` dəyərləri (əlçatanlıq) — admin paneldə `REPORT_TYPE` siyahısına əlavə.
3. `/admin/zones` üçün ADDIM göstəricilərinin qəbulu (statik JSON və ya cədvəl).
4. Hub reytinqinə 5-ci çəki və ssenari nəticəsinə profil üzrə çatım göstəricisi.

## 6. ADDIM-in hazır data məhsulları (`addim-front/public/data/`)

| Fayl | Məzmun |
|---|---|
| `zoning_zones.geojson`, `zoning.json` | 237 zona: əhali, 8 problem qatı, ehtiyac, tədbirlər |
| `zoning_blocks.geojson` | 2 685 blok: əhali, məsafələr, problemlər |
| `inclusive_access.json`, `inclusive_blocks.json` | 4 profil × xidmət çatımı, qruplar, rayonlar, zonalar, ssenarilər |
| `planning_lens.json` | Bərabərlik (Gini, ən pis/ən yaxşı 20%), zəiflik indeksi, sektor üst-üstə düşməsi |
| `barriers_access.json` | 83 yeraltı keçid, 6 330 dik (> 8%) şəbəkə nöqtəsi |
| `transit_access.json`, `transit_stops.geojson` | Dayanacağa şəbəkə məsafəsi, 5 441 dayanacaq, yeni dayanacaq təklifləri |
| `schools_safety.geojson` | 940 məktəb və bağça: yol riski |
