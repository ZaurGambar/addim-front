import styled from "styled-components";
import { card, kpiValue } from "@/styles/common/mixins";
import { fmt } from "@/utils/helpers/format";
import { overlap4Pop, typeInfo } from "@/utils/helpers/synth";

const KeyFindings = ({ analysis, synth }) => {
  const C = analysis.city;
  const r = (n) => analysis.rayons.find((x) => x.rayon === n) || {};
  const top = synth.zones[0];
  const items = [
    { k: `${C.no_metro_rayons.length} rayon`, t: "metrosuz", p: `${fmt(C.pop_no_metro)} nəfər metro olmayan rayonlarda yaşayır: ${C.no_metro_rayons.join(", ")}.` },
    { k: `${(r("Qaradağ").lst_mean - r("Nəsimi").lst_mean).toFixed(1)}°C`, t: "tərs istilik adası", p: "Suvarılan parklar mərkəzi periferiyadan sərin saxlayır. Bu model isti qəsəbələrə köçürülə bilər." },
    { k: fmt(overlap4Pop(synth)), t: "nəfər 4+ problemlə", p: "Bu insanların hücrəsində səkkiz problemdən dördü və ya daha çoxu eyni anda ən pis üçdə birlikdədir." },
    { k: top.place, t: "1-ci prioritet zona", p: `${fmt(top.pop)} nəfər. ${top.top_layers.map((l) => l[0]).join(", ")}. Tip: ${typeInfo(synth, Math.max(0, synth.types.findIndex((t) => t.places.some((pl) => pl[0] === top.place)))).name}.` },
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
