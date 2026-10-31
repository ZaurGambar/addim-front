export const CITIES = [
  {
    name: "Seul",
    coord: "37.57°N 126.98°E",
    items: [
      ["Çonqeçon (2003–2005)", "estakada yolu söküldü. Yerində 5.8 km açıq çay və piyada dəhlizi yarandı."],
      ["Seoullo 7017 (2017)", "köhnə avtomobil estakadası 1 km-lik piyada bağına çevrildi."],
      ["Yerüstü keçidlər", "yeraltı keçidlərin yanında zebra keçidləri bərpa olundu."],
      ["TOPIS", "nəqliyyatı real vaxtda izləyən mərkəz. Şəhərdə IoT sensor şəbəkəsi var."],
    ],
    take: "Yeraltı keçid əvəzinə yerüstü keçid. Magistral yolun yerini piyada dəhlizinə vermək.",
  },
  {
    name: "Amsterdam",
    coord: "52.37°N 4.90°E",
    items: [
      ["30 km/s (dekabr 2023)", "küçələrin çoxunda sürət həddi 50-dən 30-a endirildi."],
      ["Parkinq siyasəti", "küçə parkinq yerləri mərhələli azaldılır, yer piyadaya və yaşıllığa verilir."],
      ["Alqoritm reyestri", "şəhərin istifadə etdiyi AI sistemləri açıq reyestrdə dərc olunur."],
      ["Velosiped şəbəkəsi", "ayrılmış zolaqlar və stansiyalarda böyük parkinq."],
    ],
    take: "Sürətin azaldılması və AI şəffaflığı. Velosiped modelini isə adaptasiya etmək lazımdır.",
  },
  {
    name: "Barselona",
    coord: "41.39°N 2.17°E",
    items: [
      ["Superilla (superblok)", "3×3 məhəllə qrupunda tranzit avtomobil daxili küçələrə buraxılmır. Pilotlar: Poblenou (2016), Sant Antoni (2018)."],
      ["Eixample yaşıl oxları (2023)", "Consell de Cent kimi küçələr piyada-yaşıl oxa çevrildi."],
      ["Sentilo", "şəhərin açıq sensor platforması."],
    ],
    take: "Mərkəzin düzbucaqlı tikinti hissəsində superblok pilotu.",
  },
  {
    name: "Paris",
    coord: "48.86°N 2.35°E",
    items: [
      ["15 dəqiqəlik şəhər (2020-dən)", "gündəlik ehtiyaclar piyada 15 dəqiqəlik məsafədə olmalıdır."],
      ["Rue aux écoles", "məktəblərin qarşısındakı küçələr avtomobilə bağlanır."],
      ["Sena sahili", "sağ sahildə avtomobil yolu piyada parkına çevrildi (2016)."],
    ],
    take: "Məktəb küçələri. Metro stansiyaları ətrafında 15 dəqiqəlik qovşaqlar.",
  },
  {
    name: "Kopenhagen",
    coord: "55.68°N 12.57°E",
    items: [
      ["Strøget (1962)", "Avropanın ilk uzun piyada küçələrindən biri."],
      ["“İctimai həyat” ölçmələri", "Jan Gehl metodu ilə insanlar müntəzəm sayılır və müşahidə olunur. Qərarlar bu dataya əsaslanır."],
      ["Velosiped magistralları", "şəhərətrafı ərazilər mərkəzə bağlanır."],
    ],
    take: "Ölçmədən qərar verilmir. AI həmin sayma işini avtomatlaşdırır.",
  },
  {
    name: "Sinqapur",
    coord: "1.35°N 103.82°E",
    items: [
      ["Virtual Singapore", "bütün şəhərin 3D rəqəmsal əkizi."],
      ["Green Man+", "yaşlı və əlil insanlar kartı oxutduqda yaşıl işıq uzanır."],
      ["ERP", "mərkəzə girişdə tıxac haqqı elektron yığılır (1998-dən)."],
      ["Kölgəli keçidlər", "isti iqlimdə metroya gedən yollar örtülüdür."],
    ],
    take: "Rəqəmsal əkiz, inklüziv svetofor və istiyə uyğun dizayn.",
  },
];

// status: yes | part | no
export const GAPS = [
  ["Mərkəzdə piyada küçə şəbəkəsi", "Kopenhagen", "part", "Nizami küçəsi, İçərişəhər, Bulvar. Şəbəkə bir-birinə bağlı deyil.", "P2"],
  ["Yerüstü keçidə üstünlük", "Seul", "no", "Mərkəzdə 83 yeraltı keçid nöqtəsi var. Yaşlılar, uşaq arabası və əlil arabası üçün çətindir.", "P1"],
  ["Velosiped şəbəkəsi", "Amsterdam", "part", "opendata.az-a görə mərkəzdə 68 zolaq hissəsi və 641 parkinq var. Zolaqlar bağlı şəbəkə yaratmır.", "P2"],
  ["Şəhər daxilində 30 km/s zonaları", "Amsterdam", "no", "Məktəb və yaşayış küçələrində sistemli sürət zonası yoxdur.", "P1"],
  ["Məktəb küçələri", "Paris", "no", "Mərkəzdə 454 məktəb, bağça və xəstəxana var, ətraflarında piyada prioriteti yoxdur.", "P1"],
  ["Superblok", "Barselona", "no", "Mərkəzi düzbucaqlı tikinti buna uyğundur, mikrorayonlarda adaptasiya lazımdır.", "P2"],
  ["İnklüziv svetofor", "Sinqapur", "no", "Yaşlı və əlil insanlar üçün uzadılmış yaşıl işıq yoxdur.", "P1"],
  ["Nəqliyyat idarəetmə mərkəzi", "Seul TOPIS", "part", "Bakı Nəqliyyat Agentliyinin mərkəzi var. Fokus avtomobil axınıdır, piyada axını ölçülmür.", "P2"],
  ["Rəqəmsal əkiz", "Sinqapur", "no", "Küçə bağlananda nəticəni əvvəlcədən sınamaq üçün ictimai alət yoxdur.", "P2"],
  ["Açıq şəhər datası və sensorlar", "Barselona", "part", "Açıq data portalı var. Real vaxt piyada, istilik və hava datası açıq deyil.", "P2"],
  ["İctimai həyat ölçməsi", "Kopenhagen", "no", "Piyada sayı müntəzəm ölçülmür. Layihələrin təsiri qiymətləndirilmir.", "P1"],
  ["İstiyə və küləyə uyğun dizayn", "Sinqapur", "part", "Yeni parklar salınır. Dayanacaq və marşrutlarda kölgə sistemli planlanmır.", "P2"],
  ["Alqoritm reyestri", "Amsterdam", "no", "2025–2028 AI Strategiyası ilə uyğun açıq reyestr yaradıla bilər.", "P3"],
];

export const RISKS = [
  { src: "Amsterdam", title: "Velosiped şəhəri", sev: "hi",
    prob: "Mərkəz amfiteatr relyefindədir, yamaclar diktir. Güclü Xəzri küləyi və 35°C-dən yuxarı yay istisi var. Velosiped yolu çəkilsə də istifadə zəif ola bilər.",
    sol: "Əvvəlcə düz sahil xətti və metroya “son 1 km” bağlantısı. Elektrik velosiped paylaşımı. AI küləyə və istiyə görə marşrut təklif edir." },
  { src: "Seul", title: "Yeraltı keçidin bağlanması", sev: "hi",
    prob: "Neftçilər və Azadlıq kimi prospektlər 6–10 zolaqlıdır, sürət yüksəkdir. Keçidi birdən yerüstünə çıxarsaq piyada qəzaları və tıxac arta bilər.",
    sol: "Mərhələli plan: sığınacaq adası, 40 km/s, AI ilə adaptiv işıq. Model 83 nöqtədən prioritetli 15-ni seçir. Yeraltı keçid lift ilə əlçatan saxlanılır." },
  { src: "Barselona", title: "Superblok", sev: "md",
    prob: "Mikrorayonlar düzbucaqlı deyil, həyətlər parkinq kimi istifadə olunur. Tranzit bağlananda tıxac qonşu küçələrə keçir.",
    sol: "Pilot yalnız mərkəzin düzbucaqlı hissəsində. Əvvəlcə rəqəmsal əkizdə simulyasiya. Parkinq kənara, sakinlərə giriş icazəsi." },
  { src: "Paris", title: "15 dəqiqəlik şəhər", sev: "md",
    prob: "İş yerləri mərkəzdədir, əhali qəsəbələrdə yaşayır. Gündəlik gediş 15 dəqiqəyə sığmır.",
    sol: "Model metro qovşaqları ətrafında qurulur. AI hər stansiya ətrafında çatışmayan xidmətləri tapır." },
  { src: "Hamısı", title: "Leysan və su basması", sev: "hi",
    prob: "Güclü yağışda küçələr və yeraltı keçidlər su altında qalır.",
    sol: "Suyu keçirən örtük və yağış bağları. AI su yığılacaq nöqtələri əvvəlcədən göstərir." },
  { src: "Kopenhagen, Seul", title: "Kamera ilə sayma", sev: "md",
    prob: "Kamera datası şəxsi həyatın toxunulmazlığı ilə bağlı narahatlıq yaradır.",
    sol: "Edge AI: mərkəzə yalnız anonim saylar gedir. Bütün modellər açıq alqoritm reyestrində dərc olunur." },
  { src: "Nizami küçəsi təcrübəsi", title: "Turistləşmə və qiymət artımı", sev: "md",
    prob: "Piyada zonası icarə haqqını qaldırır, yerli biznes sıxışdırılır.",
    sol: "Pilotlar yaşayış və məktəb ərazilərində. Panel icarə və piyada axınını birlikdə izləyir." },
  { src: "AI-nin özü", title: "Natamam data", sev: "hi",
    prob: "OSM-də bəzi ərazilər natamamdır. Natamam data AI-ni səhv istiqamətləndirir.",
    sol: "BakuBus kameraları ilə avtomatik xəritələmə, könüllü kampaniya, hər hücrədə etibarlılıq balı." },
];
