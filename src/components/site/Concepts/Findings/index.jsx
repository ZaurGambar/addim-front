import styled from "styled-components";
import { card, kpiValue, pill } from "@/styles/common/mixins";

const buildFindings = (C, summary) => {
  const st = C.stats;
  const m = (k) => st[k].mean;
  const sc = C.station_corr;
  const rings = st.equity.rings;
  const pair = (a, b) => C.matrix[C.keys.indexOf(a)][C.keys.indexOf(b)];
  return [
    { tags: ["5 · 15 dəqiqə", "3 · Gehl", "11 · Universal"], big: `${st.min15.full_share}%`, h: "15 dəqiqəlik şəhər artıq var, amma ora piyada rahat çatmır",
      p: `Hücrələrin ${st.min15.full_share}%-ində 7 gündəlik xidmətin hamısı 1 km radiusdadır. Orta insan miqyası balı isə ${m("gehl").toFixed(0)}, universal dizayn balı ${m("universal").toFixed(0)}-dir. Problem məsafə deyil, keçidin keyfiyyətidir.` },
    { tags: ["7 · TOD", "19 · Vision Zero", "4 · Whyte"], big: `ρ = ${sc.visionzero}`, h: "Ən yüklü stansiyalar piyada üçün ən təhlükəlisidir",
      p: `Sərnişin sayı TOD ilə müsbət (ρ = ${sc.tod}), Vision Zero ilə mənfi əlaqədədir (ρ = ${sc.visionzero}). İnsan miqyası ilə əlaqə yoxdur (ρ = ${sc.gehl}).` },
    { tags: ["20 · Yaşıl", "18 · Sağlam", "5 · 15 dəqiqə"], big: `ρ = ${pair("green", "demand")}`, h: "Parklar tələbin olduğu yerdə deyil",
      p: `Yaşıllıqla tələb arasında əlaqə yoxdur (ρ = ${pair("green", "demand")}). Hücrələrin ${st.green.park300_share}%-ində 300 m-də park olsa da, yaşıllıq gündəlik həyatın keçdiyi yerlərdə deyil.` },
    { tags: ["16 · Sosial ədalət", "27 · SDG 11", "29 · Leipzig"], big: `${rings[0].mean} → ${rings[3].mean}`, h: "Mərkəz və periferiya arasında piyada bərabərsizliyi",
      p: `Fəvvarələr meydanından 1.5 km radiusda orta indeks ${rings[0].mean}, 4.5 km-dən uzaqda ${rings[3].mean}-dür. Gini əmsalı ${st.equity.gini}-dir.` },
    { tags: ["1 · Jacobs", "8 · Kompakt", "14 · Placemaking"], big: `ρ = ${pair("compact", "placemaking")}`, h: "Qarışıq istifadə olan yerdə ictimai həyat da var",
      p: `Kompaktlıq placemaking ilə (ρ = ${pair("compact", "placemaking")}), qarışıq istifadə 15 dəqiqəlik əlçatanlıqla (ρ = ${pair("jacobs", "min15")}) bağlıdır. Taktiki urbanizm üçün ${summary.cells_gap_high} namizəd hücrə var.` },
    { tags: ["17 · CPTED", "3 · Gehl", "9 · Tam küçələr"], big: `ρ = ${pair("gehl", "cpted")}`, h: "Bir müdaxilə dörd anlayışa xidmət edir",
      p: "Yeraltı keçidi işıqforlu yerüstü keçidlə əvəz etmək eyni anda Tam küçələr, Universal dizayn, Uşaq dostu şəhər və Vision Zero göstəricilərini qaldırır." },
  ];
};

const Findings = ({ concepts, summary }) => (
  <Grid>
    {buildFindings(concepts, summary).map((f) => (
      <Item key={f.h}>
        <Tags>
          {f.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </Tags>
        <b>{f.big}</b>
        <h3>{f.h}</h3>
        <p>{f.p}</p>
      </Item>
    ))}
  </Grid>
);

export default Findings;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.article`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 6px;

  b {
    ${kpiValue}
    color: var(--accent);
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 18px;
  }
  p {
    font-size: 14px;
    color: var(--text-2);
  }
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  span {
    ${pill}
  }
`;
