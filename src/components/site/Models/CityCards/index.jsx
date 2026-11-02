import styled from "styled-components";
import { card, hoverLift } from "@/styles/common/mixins";
import { CITIES } from "@/utils/mock/cities";

const CityCards = () => (
  <Grid>
    {CITIES.map((c) => (
      <City key={c.name}>
        <header>
          <h3>{c.name}</h3>
          <span>{c.coord}</span>
        </header>
        <ul>
          {c.items.map(([b, t]) => (
            <li key={b}>
              <b>{b}:</b> {t}
            </li>
          ))}
        </ul>
        <Take>
          <em>Bakıya götürürük</em>
          {c.take}
        </Take>
      </City>
    ))}
  </Grid>
);

export default CityCards;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const City = styled.article`
  ${card}
  ${hoverLift}
  display: flex;
  flex-direction: column;
  gap: 12px;

  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 21px;
  }
  header span {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 11px;
    color: var(--text-3);
  }
  ul {
    list-style: disc;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    color: var(--text-2);
  }
  b {
    color: var(--text);
    font-family: var(--font-semibold);
  }
`;

const Take = styled.p`
  margin-top: auto;
  font-size: 14px;
  border-top: 1px solid var(--line-soft);
  padding-top: 10px;
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
