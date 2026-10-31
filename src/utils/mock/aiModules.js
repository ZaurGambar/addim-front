export const AI_MODULES = [
  { code: "M1", title: "Piyada axını proqnozu", what: "Hər küçə üçün saatlıq piyada sayını proqnozlaşdırır. Metro, BakıKart və edge kamera datasından istifadə edir.", model: "Qrafik neyron şəbəkə (GNN) və gradient boosting", replaces: "əl ilə sayma və birdəfəlik sorğular" },
  { code: "M2", title: "Adaptiv piyada keçidi", what: "Gözləyən piyada sayına görə yaşıl işığın vaxtını dəyişir. Yaşlı insan BakıKart oxutduqda yaşıl işıq uzanır.", model: "Gücləndirilmiş öyrənmə (RL) və təhlükəsizlik qaydaları", replaces: "sabit svetofor rejimi" },
  { code: "M3", title: "Səki auditi", what: "Avtobus kameralarının görüntülərindən çuxur, səkidə parklanma və pandus olmamasını tapır.", model: "Kompüter görmə (YOLO və seqmentasiya)", replaces: "inspektorun piyada gəzintisi" },
  { code: "M4", title: "İstilik və kölgə", what: "Peyk istilik xəritəsini ağac örtüyü ilə birləşdirir, ağac əkini yerlərini sıralayır, kölgəli marşrut təklif edir.", model: "Məkan reqressiyası və marşrut optimizasiyası", replaces: "intuitiv yaşıllaşdırma qərarları" },
  { code: "M5", title: "Ssenari simulyatoru", what: "Bu küçəni piyadalaşdırsaq tıxac və piyada axını necə dəyişər? Rəqəmsal əkizdə işləyir.", model: "Agent əsaslı simulyasiya və surrogat neyron model", replaces: "sınaq-səhv ilə tikinti" },
  { code: "M6", title: "Müraciət analizi", what: "Azərbaycan dilində şikayətləri mövzuya və təcililiyə görə sıralayır, xəritədə nöqtəyə bağlayır.", model: "LLM və Azərbaycan dili üçün klassifikator", replaces: "müraciətlərin əl ilə oxunması" },
  { code: "M7", title: "Sel xəbərdarlığı", what: "Yağış proqnozu, relyef və drenaj datası ilə su yığılacaq küçələri əvvəlcədən göstərir.", model: "Hidroloji model və ML düzəlişi", replaces: "hadisədən sonra reaksiya" },
  { code: "M8", title: "İnvestisiya prioriteti", what: "Piyada indeksi, tələb və boşluq analizinə görə ən faydalı layihələri sıralayır.", model: "Çoxmeyarlı optimizasiya", replaces: "intuitiv sıralama" },
];
