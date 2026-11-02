import styled from "styled-components";
import { useModal } from "@/contexts/ModalContext";
import { fmt } from "@/utils/helpers/format";

const PriorityZones = ({ zones, onShowOnMap }) => {
  const { openModal } = useModal();
  return (
    <List>
      {zones.slice(0, 10).map((z) => (
        <Zone key={z.rank} type="button" onClick={() => openModal("ZoneModal", { zone: z, onShowOnMap })}>
          <span className="rk">{z.rank}</span>
          <b>
            {z.place} <small>· {z.rayons.map((r) => r[0]).join(", ")}</small>
          </b>
          <span className="pp">{fmt(z.pop)} nəfər</span>
          <span className="ly">{z.top_layers.map((l) => `${l[0]} ${l[1]}`).join(" · ")}</span>
        </Zone>
      ))}
    </List>
  );
};

export default PriorityZones;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Zone = styled.button`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 2px 12px;
  padding: 10px 8px;
  border-bottom: 1px solid var(--line-soft);
  border-radius: 0;
  transition: background 0.15s;
  &:last-child {
    border-bottom: 0;
  }
  text-align: left;
  color: var(--text);

  .rk {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 18px;
    color: var(--accent);
    grid-row: span 2;
  }
  b {
    font-family: var(--font-semibold);
    font-size: 15px;
  }
  small {
    font-family: var(--font);
    color: var(--text-3);
    font-size: 13px;
  }
  .pp {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    text-align: right;
  }
  .ly {
    grid-column: 2 / 4;
    font-size: 12px;
    color: var(--text-2);
  }
  &:hover {
    background: var(--bg-secondary);
    border-radius: 14px;
  }
  &:hover b {
    color: var(--accent);
  }
`;
