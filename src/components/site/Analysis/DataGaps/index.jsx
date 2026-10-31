import styled from "styled-components";
import { DATA_GAPS } from "@/utils/mock/baku";

const DataGaps = () => (
  <Grid>
    {DATA_GAPS.map((g) => (
      <p key={g}>{g}</p>
    ))}
  </Grid>
);

export default DataGaps;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 24px;
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-2);

  p {
    border-top: 1px solid var(--line-soft);
    padding-top: 6px;
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
