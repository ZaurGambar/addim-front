import Skeleton from "react-loading-skeleton";

const MapSkeleton = ({ height = 560 }) => (
  <Skeleton height={height} borderRadius={26} baseColor="var(--bg-secondary)" highlightColor="var(--panel-2)" />
);

export default MapSkeleton;
