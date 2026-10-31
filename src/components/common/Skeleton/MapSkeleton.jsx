import Skeleton from "react-loading-skeleton";

const MapSkeleton = ({ height = 560 }) => (
  <Skeleton height={height} borderRadius={12} baseColor="var(--panel-2)" highlightColor="var(--panel)" />
);

export default MapSkeleton;
