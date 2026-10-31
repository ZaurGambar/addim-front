import styled from "styled-components";
import { fmtN } from "@/utils/helpers/format";

// items: [{ key, label, value }]; max: şkala; marker: kəsik xətt; onSelect: sətrə klik
const BarList = ({ items, max, marker, color = "var(--s4)", diverging = false, onSelect }) => {
  const m = max || Math.max(...items.map((i) => Math.abs(i.value || 0))) || 1;
  return (
    <List>
      {items.map((it) => {
        const v = it.value ?? 0;
        const w = diverging ? (Math.abs(v) / m) * 50 : (v / m) * 100;
        const left = diverging ? (v >= 0 ? 50 : 50 - w) : 0;
        const fill = diverging ? (v >= 0 ? "var(--d-pos)" : "var(--d-neg)") : color;
        return (
          <Row key={it.key || it.label} as={onSelect ? "button" : "div"} type={onSelect ? "button" : undefined} $clickable={!!onSelect} onClick={onSelect ? () => onSelect(it) : undefined}>
            <Name title={it.label}>{it.label}</Name>
            <Track>
              <Fill style={{ left: `${left}%`, width: `${w}%`, background: fill }} />
              {marker != null && <Marker style={{ left: `${(marker / m) * 100}%` }} />}
              {diverging && <Marker style={{ left: "50%" }} />}
            </Track>
            <Value>{diverging ? v.toFixed(2) : fmtN(it.value)}</Value>
          </Row>
        );
      })}
    </List>
  );
};

export default BarList;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(90px, 160px) 1fr 52px;
  align-items: center;
  gap: 10px;
  padding: 3px 0;
  text-align: left;
  color: var(--text);
  font-size: 13px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover span:first-child {
    color: ${({ $clickable }) => ($clickable ? "var(--primary)" : "inherit")};
  }
`;

const Name = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Track = styled.span`
  position: relative;
  height: 12px;
  background: var(--panel-2);
  border-radius: 3px;
`;

const Fill = styled.i`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 3px;
`;

const Marker = styled.u`
  position: absolute;
  top: -3px;
  bottom: -3px;
  border-left: 1px dashed var(--text-3);
`;

const Value = styled.span`
  font-family: var(--font-mono);
  text-align: right;
  font-variant-numeric: tabular-nums;
`;
