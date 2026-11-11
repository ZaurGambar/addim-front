// İnklüziv və kompleks planlama: iki əsas anlayış, alt anlayışlar, saytdakı yeri və AI mövzuları.
// status: "ölçülür" — datamızla ölçülür; "qismən" — proksi və ya qismən; "boşluq" — data/iş yoxdur.

export const CORE = {
  I: {
    code: "İ",
    title: "İnklüziv planlama",
    en: "Inclusive planning",
    short: "Kimə çatır, kim kənarda qalır?",
    def: "Şəhərin imkanlarını (hərəkət, xidmət, ictimai məkan, təhlükəsizlik) yaşından, sağlamlığından, cinsindən, gəlirindən və yaşadığı yerdən asılı olmayaraq hər kəsə bərabər çatdıran və qərar prosesinə insanların özlərini cəlb edən planlama.",
    question: "Bu qərardan kim faydalanır, kim kənarda qalır, kim səs verdi?",
    color: "--accent",
  },
  K: {
    code: "K",
    title: "Kompleks planlama",
    en: "Comprehensive planning",
    short: "Problemlər birlikdə həll olunurmu?",
    def: "Torpaq istifadəsi, nəqliyyat, ətraf mühit, xidmətlər, risk və büdcəni ayrı-ayrı yox, bir sistem kimi, bütün miqyaslarda (blokdan şəhərə) və uzunmüddətli üfüqdə birlikdə planlayan, nəticəni ölçən yanaşma.",
    question: "Bu həll başqa sahələrə necə təsir edir, kim birlikdə icra etməlidir, nəticə necə ölçülür?",
    color: "--good",
  },
};

export const SUB = [
  // ---- İnklüziv ----
  { id: "I1", core: "I", title: "Paylanma ədaləti", en: "Distributive equity", status: "ölçülür", def: "İmkanlar əhali arasında nə qədər bərabər paylanıb.", measure: "Blok səviyyəsində əhali ilə çəkili Gini və ən pis / ən yaxşı 20% nisbəti (7 xidmət).", where: ["/planlama", "Addım 3"] },
  { id: "I2", core: "I", title: "Universal dizayn və əlçatanlıq", en: "Universal design", status: "qismən", def: "Küçə, keçid və nəqliyyat hər bədən üçün işləyir: əlil arabası, uşaq arabası, yaşlı.", measure: "Pilləkən, yamac, yeraltı keçid proksiləri; pandus və lift datası OSM-də yoxdur, sahə auditi ilə.", where: ["/pilot", "Əlçatanlıq auditi"] },
  { id: "I3", core: "I", title: "Həssas qruplar", en: "Vulnerable groups", status: "qismən", def: "Uşaq, yaşlı, əlilliyi olan, uşaqlı valideyn üçün xidmətə məsafə ayrıca ölçülür.", measure: "Qrup əlçatanlığı: məktəb/bağça, aptek, metro, yamac. Yaş strukturu yalnız şəhər səviyyəsindədir.", where: ["/planlama", "Addım 3"] },
  { id: "I4", core: "I", title: "Gender həssas planlama", en: "Gender-sensitive planning", status: "boşluq", def: "Qadınların gündəlik marşrutu (uşaq, alış-veriş, iş zənciri), gecə təhlükəsizliyi və işıqlandırma.", measure: "Axşam aktivliyi (OSM) var; işıqlandırma (NASA Black Marble) və təhlükəsizlik sorğusu yoxdur.", where: ["/analiz", "Küçə həyatı"] },
  { id: "I5", core: "I", title: "İştirakçılıq", en: "Participatory planning", status: "qismən", def: "Sakin problemi bildirir, təklifə səs verir, qərarın nəticəsini görür.", measure: "Sahə auditi və data bildirişi formaları var; sakin tələb xəritəsi planlaşdırılır.", where: ["/pilot", "Sahə yoxlaması"] },
  { id: "I6", core: "I", title: "Prosedur ədaləti və şəffaflıq", en: "Procedural justice", status: "qismən", def: "Qərarın necə verildiyi açıqdır: data, metod, alqoritm, məhdudiyyət.", measure: "Açıq data və metodologiya; alqoritm reyestri və ədalət auditi planlaşdırılır.", where: ["/metodologiya", "Metodologiya"] },
  { id: "I7", core: "I", title: "Əlverişlilik", en: "Affordability", status: "boşluq", def: "Nəqliyyat, mənzil və xidmət gəlirə görə əlçatandır.", measure: "Gəlir, kirayə və gediş xərci datası məkan üzrə yoxdur.", where: null },
  { id: "I8", core: "I", title: "Məkan ədaləti: periferiya", en: "Spatial justice", status: "ölçülür", def: "Mərkəzlə qəsəbə arasında imkan uçurumu.", measure: "Dayanacağa şəbəkə məsafəsi, rayonlar arası nisbət (Nəsimi 76% / Qaradağ 12%).", where: ["/dayanacaq", "Dayanacağa 5 dəqiqə"] },
  { id: "I9", core: "I", title: "Yol təhlükəsizliyi", en: "Road safety / Vision Zero", status: "qismən", def: "Ən zəif yol iştirakçısı (uşaq, yaşlı) üçün təhlükəsiz keçid və sürət.", measure: "Məktəb ətrafı risk (940 məktəb), yeraltı keçidlər, keçidsiz magistrallar; qəza datası yoxdur.", where: ["/pilot", "Məktəb yolu"] },
  // ---- Kompleks ----
  { id: "K1", core: "K", title: "Sektorlararası inteqrasiya", en: "Cross-sector integration", status: "ölçülür", def: "Nəqliyyat, ətraf mühit, risk və xidmət problemləri eyni yerdə birlikdə həll olunur.", measure: "Zonada kəskin sektor sayı (4 sektor), sektor cütləri, blokda birlikdə lazım olan həllər.", where: ["/planlama", "Addım 4"] },
  { id: "K2", core: "K", title: "Çoxmiqyaslı planlama", en: "Multi-scale planning", status: "ölçülür", def: "Blok (insan miqyası) → zona (15 dəq məhəllə) → rayon → şəhər qaydası.", measure: "2 685 blok, 237 zona, 12 rayon; həll blokda, proqram zonada, qayda şəhərdə.", where: ["/bolgeleme", "Bölgələmə"] },
  { id: "K3", core: "K", title: "Sübut əsaslı planlama", en: "Evidence-based planning", status: "ölçülür", def: "Qərar açıq data və təkrarlana bilən metodla verilir.", measure: "OSM, opendata.az, WorldPop, Landsat, SRTM; Gi*, k-means, SKATER; həssaslıq ρ 0.989.", where: ["/metodologiya", "Metodologiya"] },
  { id: "K4", core: "K", title: "Ssenari planlaması", en: "Scenario planning", status: "qismən", def: "Bir neçə variant (büdcə, say, prioritet) əvvəlcədən müqayisə olunur.", measure: "Büdcə kalkulyatoru, dayanacaq simulyatoru; nəqliyyat axını modeli yoxdur.", where: ["/dayanacaq", "Simulyator"] },
  { id: "K5", core: "K", title: "Mərhələlilik", en: "Phasing", status: "qismən", def: "Pilot → ölçmə → standart → şəhər qaydası.", measure: "3 pilot zona, 6–12 ay; qayda 3 (pilot rejimi).", where: ["/pilot", "Pilot"] },
  { id: "K6", core: "K", title: "İnstitusional koordinasiya", en: "Institutional coordination", status: "qismən", def: "Hər həll üçün məsul qurumlar və birgə işləməli olanlar.", measure: "Sektor → qurum xəritəsi; rəsmi razılaşma yoxdur.", where: ["/planlama", "Addım 4"] },
  { id: "K7", core: "K", title: "Monitorinq və qiymətləndirmə", en: "Monitoring & evaluation", status: "qismən", def: "Hər layihənin əvvəl/sonra ölçülməsi və illik yenilənmə.", measure: "Qayda 10; sahə sayım forması; avtomatik ETL planlaşdırılır.", where: ["/qaydalar", "Qayda 10"] },
  { id: "K8", core: "K", title: "İqlimə uyğunlaşma", en: "Climate adaptation", status: "ölçülür", def: "İstilik, sel və sahil riskinə qarşı küçə səviyyəsində tədbirlər.", measure: "Landsat səth temperaturu, SRTM çökəklik, alçaq sahil.", where: ["/analiz", "İqlim"] },
  { id: "K9", core: "K", title: "Büdcə və icra", en: "Implementation & budgeting", status: "ölçülür", def: "Büdcə ehtiyaca və insan sayına görə paylanır.", measure: "Büdcə kalkulyatoru (vahid xərclər ekspert təxminidir), nəfərə xərc.", where: ["/bolgeleme", "Büdcə"] },
];
export const SUB_BY_ID = Object.fromEntries(SUB.map((s) => [s.id, s]));

// Saytın hər bölməsi hansı alt anlayışlara xidmət edir
export const PAGE_LENS = {
  "/analiz": { I: ["I1", "I3", "I8"], K: ["K1", "K3", "K8"], note: "Analiz kim üçün nə çatmadığını göstərir: rayonlar arası uçurum, qrup əlçatanlığı." },
  "/sintez": { I: ["I1", "I3"], K: ["K1", "K2", "K3"], note: "Sintez problemləri sektorlar üzrə birləşdirir və həssas qrupların çox olduğu zonaları önə çəkir." },
  "/bolgeleme": { I: ["I1", "I2", "I3"], K: ["K1", "K2", "K9"], note: "Həll blokda, proqram zonada, qayda şəhərdə: çoxmiqyaslı və sektorlararası." },
  "/dayanacaq": { I: ["I1", "I8", "I3"], K: ["K4", "K9", "K1"], note: "Periferiya ədaləti: alqoritm yeni dayanacaqları ən çox kənarda qalan insana görə yerləşdirir." },
  "/qaydalar": { I: ["I2", "I6", "I9"], K: ["K5", "K7", "K9"], note: "Hər qayda həm bir qrupu qoruyur, həm də bir neçə sahəni birlikdə tənzimləyir." },
  "/ai": { I: ["I5", "I6", "I2"], K: ["K3", "K4", "K7"], note: "AI ölçür və təklif edir; ədalət auditi və insan nəzarəti ilə." },
  "/pilot": { I: ["I2", "I5", "I9"], K: ["K5", "K7"], note: "Pilot sakinlə birlikdə sınayır və nəticəni ölçür." },
};

// 9 piyada həlli (A–I) və 10 qayda: alt anlayışlar
export const SOL_LENS = {
  A: ["I2", "I9", "K1"],
  B: ["I3", "I9", "K6"],
  C: ["I3", "K8", "K1"],
  D: ["I1", "I3", "K8"],
  E: ["I8", "I1", "K1"],
  F: ["I4", "K1"],
  G: ["I1", "K1", "K2"],
  H: ["I2", "I3"],
  I: ["K8", "I2", "K6"],
};
export const RULE_LENS = {
  1: ["I2", "I9", "K1"],
  2: ["I9", "I3"],
  3: ["K5", "K7", "I5"],
  4: ["K8", "I3"],
  5: ["K1", "I1"],
  6: ["I8", "I1", "K1"],
  7: ["K1", "K2", "I1"],
  8: ["K8", "K6"],
  9: ["I1", "K9"],
  10: ["I6", "K7", "K3"],
};

// AI: inklüziv və kompleks planlama üçün əsas mövzular və təkliflər
export const AI_TOPICS = [
  {
    title: "Ədalət yönümlü optimallaşdırma",
    en: "Equity-aware optimization",
    sub: ["I1", "I8", "K4"],
    modules: ["M8"],
    status: "işləyir",
    what: "Alqoritm yalnız “ən çox insan” yox, “ən çox kənarda qalan insan” üçün optimallaşdırır: hər insanın çəkisi sosial zəiflik indeksi ilə artır.",
    suggestion: "Dayanacaq simulyatorunda “inklüziv” ssenari: SVI ilə çəkili maksimal əhatə. Büdcə kalkulyatorunda eyni çəki.",
  },
  {
    title: "Alqoritmik ədalət auditi",
    en: "Algorithmic fairness audit",
    sub: ["I6", "I1"],
    modules: ["M8"],
    status: "təklif",
    what: "Model qərarlarının qruplar və rayonlar üzrə paylanmasını yoxlayır: təkliflər periferiyaya, həssas qruplara çatırmı?",
    suggestion: "Hər model buraxılışında avtomatik hesabat: rayon üzrə fayda payı / əhali payı, SVI kvintillərinə görə fayda. Alqoritm reyestri səhifəsi.",
  },
  {
    title: "İştirakçı AI: sakin səsi",
    en: "Participatory AI",
    sub: ["I5", "I4", "K7"],
    modules: ["M6"],
    status: "təklif",
    what: "Azərbaycan dilində sakin müraciətlərini LLM mövzuya, qrupa (uşaq, yaşlı, əlil) və təcililiyə görə təsnif edir, xəritəyə bağlayır.",
    suggestion: "Təmsilçilik yoxlaması: müraciət sayı rayon əhalisinə görə azdırsa (səssiz rayon), sahə sorğusu planlaşdırılır. LLM açarı serverdə saxlanır.",
  },
  {
    title: "Əlçatanlıq auditi: kompüter görmə",
    en: "Computer vision accessibility audit",
    sub: ["I2", "I3", "I9"],
    modules: ["M3"],
    status: "təklif",
    what: "Küçə şəkillərindən pandus, səki eni, səkidə maşın, pilləkən və maneələri tapır.",
    suggestion: "Pilot zonada telefonla çəkilmiş şəkillərlə başlamaq; nəticəni Gehl/əlçatanlıq çeklisti ilə müqayisə edib dəqiqliyi ölçmək.",
  },
  {
    title: "Qrup marşrutları: sintetik əhali",
    en: "Synthetic population, trip chaining",
    sub: ["I3", "I4", "K4"],
    modules: ["M1", "M5"],
    status: "təklif",
    what: "Uşaq, yaşlı, işləyən ana kimi profillər üçün gündəlik marşrut zəncirləri (ev → bağça → market → iş) simulyasiya olunur.",
    suggestion: "Gender həssas planlama üçün: zəncirli səfərlərdə ən çətin keçid və dayanacaqları tapmaq.",
  },
  {
    title: "Sektorlararası paket tövsiyəsi",
    en: "Multi-criteria decision analysis, MCDA",
    sub: ["K1", "K6", "K9"],
    modules: ["M8"],
    status: "qismən",
    what: "Zonada birlikdə lazım olan həlləri (məs. keçid + məktəb yolu + dayanacaq) bir paketə yığır və məsul qurumları göstərir.",
    suggestion: "Çoxmeyarlı qərar dəstəyi (MCDA): paketin ümumi faydası > ayrı-ayrı layihələrin cəmi olan zonaları sıralamaq.",
  },
  {
    title: "Ssenari və rəqəmsal əkiz",
    en: "Scenario planning, digital twin",
    sub: ["K4", "K1"],
    modules: ["M5"],
    status: "təklif",
    what: "“Bu küçəni piyadalaşdırsaq” tipli sualda nəqliyyat, istilik və xidmət təsirlərini birlikdə hesablayır.",
    suggestion: "Əvvəlcə sadə surrogat model: piyada şəbəkəsində kənar silmək/əlavə etmək və əlçatanlığın dəyişməsi.",
  },
  {
    title: "Plan uyğunluq yoxlaması (LLM)",
    en: "Plan compliance checking",
    sub: ["K6", "K7", "I2"],
    modules: ["M6"],
    status: "təklif",
    what: "Layihə sənədini 10 qayda və inklüziv çeklistə görə yoxlayır: pandus varmı, kölgə varmı, keçid məsafəsi neçədir.",
    suggestion: "Çıxış: uyğunsuzluq siyahısı və mənbə səhifəsi; son qərar ekspertindir.",
  },
  {
    title: "Monitorinq: əvvəl / sonra",
    en: "Before–after monitoring",
    sub: ["K7", "K8", "K3"],
    modules: ["M4", "M7"],
    status: "qismən",
    what: "Peyk (istilik, yaşıllıq) və sahə sayımı ilə layihədən əvvəl və sonra dəyişikliyi avtomatik ölçür.",
    suggestion: "İllik ETL: Landsat, OSM və opendata yenilənir, göstəricilər yenidən hesablanır, dəyişiklik xəritəsi dərc olunur.",
  },
];

// İstənilən layihə üçün planlayıcı çeklisti
export const CHECKLIST = [
  ["I", "Layihə hansı qrupa (uşaq, yaşlı, əlilliyi olan, periferiya sakini) birbaşa xidmət edir?"],
  ["I", "Fayda ən pis təmin olunmuş 20% əhaliyə çatırmı, yoxsa onsuz da yaxşı olan yerlərə?"],
  ["I", "Əlil arabası və uşaq arabası ilə keçmək mümkündürmü (pilləkən, yamac, səki eni)?"],
  ["I", "Sakinlər layihədən əvvəl dinlənilibmi və nəticəni görə biləcəklərmi?"],
  ["I", "Gecə istifadə və təhlükəsizlik (işıq, görünmə) nəzərə alınıbmı?"],
  ["K", "Layihə eyni zonadakı digər problemlərə (istilik, sel, xidmət) necə təsir edir?"],
  ["K", "Hansı qurumlar birlikdə icra etməlidir və kim məsuldur?"],
  ["K", "Blok, zona və şəhər qaydası səviyyəsində ardıcıldırmı?"],
  ["K", "Bir neçə ssenari (büdcə, yer) müqayisə olunubmu?"],
  ["K", "Əvvəl/sonra ölçmə göstəricisi və tarixi müəyyən edilibmi?"],
];
