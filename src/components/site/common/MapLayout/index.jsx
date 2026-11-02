import styled from "styled-components";

// Xəritə + yan panel düzülüşü (bütün xəritə səhifələrində eyni)
const MapLayout = ({ map, side }) => (
  <Grid>
    {map}
    <Side>{side}</Side>
  </Grid>
);

export default MapLayout;

export const MapBox = styled.div`
  height: ${({ $h }) => $h || 560}px;
  border: 1px solid var(--line);
  border-radius: var(--r);
  box-shadow: var(--shadow);
  background: ${({ $bg }) => $bg || "var(--sea)"};
  overflow: hidden;
  isolation: isolate;

  @media (max-width: 768px) {
    height: 440px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Side = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

export const InfoList = styled.dl`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 10px;
  font-size: 13px;
  color: var(--text-2);
  dd {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    color: var(--text);
    text-align: right;
  }
`;
