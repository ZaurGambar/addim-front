import styled from "styled-components";
import { card, kpiValue } from "@/styles/common/mixins";
import { fmt } from "@/utils/helpers/format";
import { overlap4Pop } from "@/utils/helpers/synth";

const KeyFindings = ({ analysis, synth }) => {
  const C = analysis.city;
  const r = (n) => analysis.rayons.find((x) => x.rayon === n) || {};
  const top = synth.zones[0];
  const items = [
    { k: `${C.no_metro_rayons.length} rayon`, t: "metro yoxdur", p: `${fmt(C.pop_no_metro)} insan metrosu olmayan rayonlarda yaşayır: ${C.no_metro_rayons.join(", ")}.` },
    { k: `${(r("Qaradağ").lst_mean - r("Nəsimi").lst_mean).toFixed(1)}°C`, t: "kənar rayonlar daha istidir", p: "Qaradağ Nəsimidən bu qədər istidir. Mərkəzdə suvarılan parklar havanı sərinləşdirir. Eyni şeyi isti qəsəbələrdə də etmək olar." },
    { k: fmt(overlap4Pop(synth)), t: "insan çox problemlə yaşayır", p: "Bu insanların yaşadığı yerdə 8 problemdən ən azı 4-ü birdən var: isti, yaşıllıq azlığı, uzaq avtobus və s." },
    { k: top.place, t: "kömək ən çox lazım olan yer", p: `Burada ${fmt(top.pop)} insan yaşayır. Əsas problemlər: ${top.top_layers.map((l) => l[0].toLowerCase()).join(", ")}.` },
  ];
  return (
    <Grid>
      {items.map((i) => (
        <Item key={i.t}>
          <b>{i.k}</b>
          <h3>{i.t}</h3>
          <p>{i.p}</p>
        </Item>
      ))}
    </Grid>
  );
};

export default KeyFindings;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.article`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 4px;

  b {
    ${kpiValue}
    color: var(--accent);
    overflow-wrap: anywhere;
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 15px;
    margin-top: 2px;
  }
  p {
    font-size: 13px;
    color: var(--text-3);
    margin-top: 4px;
  }
`;
