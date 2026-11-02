import styled from "styled-components";
import Skeleton from "react-loading-skeleton";

const CardGridSkeleton = ({ count = 4, height = 180 }) => (
  <Grid>
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} height={height} borderRadius={26} baseColor="var(--bg-secondary)" highlightColor="var(--panel-2)" />
    ))}
  </Grid>
);

export default CardGridSkeleton;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
