import styled from "styled-components";
import { card, label } from "@/styles/common/mixins";
import { cssVar, fmt } from "@/utils/helpers/format";
import { typeInfo } from "@/utils/helpers/synth";

const TypeCards = ({ summary }) => (
  <Grid>
    {summary.types.map((t, i) => {
      const T = typeInfo(summary, i);
      const kpis = [
        [fmt(t.pop), "əhali"], [fmt(t.mean.density), "nəfər/km²"], [`${fmt(t.mean.transit_m)} m`, "dayanacağa"], [`${t.mean.hot_share}%`, "qaynar nöqtə"],
        [`${t.mean.deadend}%`, "dalan küçə"], [`${t.mean.slope}%`, "meyl"], [`${t.mean.lst}°C`, "səth"], [t.mean.need, "ehtiyac"],
      ];
      return (
        <Type key={t.id}>
          <header>
            <i style={{ background: cssVar(`--t${i}`) }} />
            <h3>{T.name}</h3>
          </header>
          <Kpis>
            {kpis.map(([v, l]) => (
              <div key={l}>
                <b>{v}</b>
                {l}
              </div>
            ))}
          </Kpis>
          <p>
            {T.d} Nümunələr: {t.places.slice(0, 4).map((p) => p[0]).join(", ")}.
          </p>
          <Rx>
            <em>Müdaxilə</em>
            {T.rx}
          </Rx>
        </Type>
      );
    })}
  </Grid>
);

export default TypeCards;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Type = styled.article`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 10px;

  header {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  header i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex: none;
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 19px;
  }
  p {
    font-size: 14px;
    color: var(--text-2);
  }
`;

const Kpis = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 16px;
    background: var(--bg-secondary);
    ${label}
    font-size: 11.5px;
  }
  b {
    font-family: var(--font-bold);
    font-variant-numeric: tabular-nums;
    font-size: 18px;
    letter-spacing: -0.02em;
    color: var(--text);
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Rx = styled.p`
  border-top: 1px solid var(--line-soft);
  padding-top: 8px;
  em {
    font-style: normal;
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 11.5px;
    color: var(--accent);
    display: block;
    margin-bottom: 2px;
  }
`;
