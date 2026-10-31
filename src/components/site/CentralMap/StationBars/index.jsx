import BarList from "@/components/common/BarList";

const StationBars = ({ stations, mean, onSelect }) => (
  <BarList max={100} marker={mean} items={stations.map((s) => ({ key: s.name, label: s.name, value: s.score, s }))} onSelect={(it) => onSelect(it.s)} />
);

export default StationBars;
