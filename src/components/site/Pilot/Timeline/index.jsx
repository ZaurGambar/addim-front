import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import { TIMELINE } from "@/utils/mock/pilot";

const Timeline = () => (
  <Grid>
    {TIMELINE.map((s) => (
      <Step key={s.when}>
        <span>{s.when}</span>
        <h3>{s.title}</h3>
        <ul>
          {s.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Step>
    ))}
  </Grid>
);

export default Timeline;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Step = styled.div`
  ${card}

  span {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: var(--accent);
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 17px;
    margin: 4px 0 6px;
  }
  ul {
    list-style: disc;
    padding-left: 16px;
    font-size: 13px;
    color: var(--text-2);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
`;
