import BarList from "@/components/common/BarList";

const Combos = ({ combos }) => (
  <BarList color="var(--g3)" items={combos.map((c) => ({ key: c.layers.join("+"), label: c.layers.join(" + "), value: c.pop }))} />
);

export default Combos;
