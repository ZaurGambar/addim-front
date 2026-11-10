// Sahə auditləri: ictimai məkanın keyfiyyəti (Gehl, 12 meyar) və fiziki əlçatanlıq (AzDTN / ISO 21542 əsasında, 20 bənd)

export const GEHL_SCALE = [
  { value: "", label: "–" },
  { value: "0", label: "0 · yoxdur" },
  { value: "1", label: "1 · zəif" },
  { value: "2", label: "2 · orta" },
  { value: "3", label: "3 · yaxşı" },
];

export const GEHL = [
  { group: "Qorunma", items: [
    ["g1", "Nəqliyyatdan qorunma", "Piyada maşından ayrılıb, sürət aşağıdır, keçid təhlükəsizdir"],
    ["g2", "Cinayətdən qorunma", "Gündüz və gecə insan var, görünürlük və işıqlandırma yaxşıdır"],
    ["g3", "Xoşagəlməz təsirlərdən qorunma", "Külək (Xəzri), istilik, səs-küy, toz və tüstüdən qorunma"],
  ] },
  { group: "Rahatlıq", items: [
    ["g4", "Yerimək", "Səki geniş, hamar, maneəsizdir; fasadlar maraqlıdır"],
    ["g5", "Dayanmaq", "Söykənmək, gözləmək üçün yer var"],
    ["g6", "Oturmaq", "Oturacaq var, kölgədədir, istifadə olunur"],
    ["g7", "Görmək", "Mənzərə maneəsizdir, maraqlı nə isə görünür"],
    ["g8", "Danışmaq və eşitmək", "Səs-küy aşağıdır, insanlar rahat danışa bilir"],
    ["g9", "Oyun və idman", "Uşaq oyunu, idman, fiziki aktivlik imkanı var"],
  ] },
  { group: "Zövq", items: [
    ["g10", "İnsan miqyası", "Binalar və məkan insan ölçüsünə uyğundur"],
    ["g11", "Müsbət iqlim", "Yayda kölgə, qışda günəş, küləkdən sığınacaq"],
    ["g12", "Estetika və duyğular", "Gözəl dizayn, ağac, su, keyfiyyətli materiallar"],
  ] },
];

export const ACCESS_SCALE = [
  { value: "", label: "–" },
  { value: "beli", label: "bəli" },
  { value: "xeyr", label: "xeyr" },
  { value: "aid", label: "aid deyil" },
];

export const ACCESS = [
  { group: "Keçid", items: [
    ["a1", "Yerüstü zebra keçid var"],
    ["a2", "Bordürdə pandus (enmə) var"],
    ["a3", "Pandusun mailliyi yumşaqdır (≤ 8%)"],
    ["a4", "Taktil (qabarıq) plitə var"],
    ["a5", "Svetoforda səs və ya vibrasiya siqnalı var"],
    ["a6", "Yaşıl işıq yaşlı insan üçün kifayət qədər uzundur"],
    ["a7", "Geniş yolda ortada sığınacaq adası var"],
  ] },
  { group: "Səki", items: [
    ["a8", "Səkinin maneəsiz eni ≥ 1.5 m"],
    ["a9", "Səkidə park edilmiş maşın yoxdur"],
    ["a10", "Səth hamardır, çuxur və qırıq plitə yoxdur"],
    ["a11", "Gözlənilməz pillə və hündürlük fərqi yoxdur"],
    ["a12", "Dirək, ağac və reklam keçidi daraltmır"],
  ] },
  { group: "Yeraltı keçid və metro", items: [
    ["a13", "Lift var"],
    ["a14", "Lift işləyir"],
    ["a15", "Pilləkəndə hər iki tərəfdə məhəccər var"],
    ["a16", "İşıqlandırma kifayətdir"],
    ["a17", "Yağışda su yığılmır"],
  ] },
  { group: "Dayanacaq və yönləndirmə", items: [
    ["a18", "Dayanacaqda oturacaq və kölgə var"],
    ["a19", "Avtobusa minmək üçün hündür pillə yoxdur"],
    ["a20", "Yönləndirici lövhələr oxunaqlıdır (piktoqram, böyük şrift)"],
  ] },
];

export const GEHL_KEYS = GEHL.flatMap((g) => g.items.map((i) => i[0]));
export const ACCESS_KEYS = ACCESS.flatMap((g) => g.items.map((i) => i[0]));

// Gehl balı: 0–36 (cavablanmış meyarlar üzrə), əlçatanlıq: "bəli" / ("bəli" + "xeyr")
export const gehlScore = (v) => {
  const ans = GEHL_KEYS.map((k) => v[k]).filter((x) => x !== "" && x != null);
  return { answered: ans.length, total: ans.reduce((t, x) => t + Number(x), 0), max: ans.length * 3 };
};
export const accessScore = (v) => {
  const yes = ACCESS_KEYS.filter((k) => v[k] === "beli").length;
  const no = ACCESS_KEYS.filter((k) => v[k] === "xeyr").length;
  return { yes, no, pct: yes + no ? Math.round((100 * yes) / (yes + no)) : null };
};
