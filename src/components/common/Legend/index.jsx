import styled from "styled-components";
import { cssVar, fmtN, RAMP } from "@/utils/helpers/format";

// Ardıcıl rəng şkalası (7 addım) və ya kateqoriyalı siyahı
export const RampLegend = ({ title, breaks, labels }) => {
  return (
    <div>
      {title && <LegendTitle>{title}</LegendTitle>}
      <Ramp>
        {RAMP.map((v) => (
          <i key={v} style={{ background: cssVar(v) }} />
        ))}
      </Ramp>
      <Scale>
        {labels
          ? labels.map((l) => <span key={l}>{l}</span>)
          : ["min", ...breaks].map((b, i) => <span key={i}>{i === 0 ? b : fmtN(b)}</span>)}
      </Scale>
    </div>
  );
};

export const SwatchLegend = ({ title, items }) => {
  return (
    <div>
      {title && <LegendTitle>{title}</LegendTitle>}
      <Items>
        {items.map((it) => (
          <li key={it.label}>
            <Swatch style={{ background: it.color }} />
            {it.label}
          </li>
        ))}
      </Items>
    </div>
  );
};

const LegendTitle = styled.h4`
  font-size: 13px;
  font-family: var(--font-semibold);
  margin-bottom: 8px;
`;

const Ramp = styled.div`
  display: flex;
  height: 10px;
  border-radius: 99px;
  overflow: hidden;
  i {
    flex: 1;
  }
`;

const Scale = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: var(--font-semibold);
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
  color: var(--text-3);
  margin-top: 4px;
`;

const Items = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
`;

const Swatch = styled.span`
  width: 14px;
  height: 10px;
  border-radius: 4px;
  flex: none;
  border: 1px solid var(--line);
`;
