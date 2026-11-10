import { useState } from "react";
import styled from "styled-components";

// 24 saatlıq aktivlik əyrisi: hər saat açıq obyektlərin payı (%)
const HourCurve = ({ values }) => {
  const [hover, setHover] = useState(null);
  const max = Math.max(...values) || 1;
  return (
    <Box>
      <Bars role="img" aria-label={`Gün ərzində açıq obyektlərin payı: ən yüksək ${max}%`}>
        {values.map((v, h) => (
          <i
            key={h}
            className={h >= 22 || h < 6 ? "night" : ""}
            style={{ height: `${Math.max(3, (100 * v) / max)}%` }}
            onMouseEnter={() => setHover(h)}
            onMouseLeave={() => setHover(null)}
            title={`${String(h).padStart(2, "0")}:00 · ${v}% açıq`}
          />
        ))}
      </Bars>
      <Axis>
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </Axis>
      <Read>{hover == null ? "Saatın üzərinə gəlin" : `${String(hover).padStart(2, "0")}:00 · obyektlərin ${values[hover]}%-i açıqdır`}</Read>
    </Box>
  );
};

export default HourCurve;

const Box = styled.div`
  margin-top: 4px;
`;

const Bars = styled.div`
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  align-items: end;
  gap: 2px;
  height: 64px;
  i {
    background: var(--s4);
    border-radius: 2px 2px 0 0;
    min-height: 2px;
  }
  i.night {
    background: var(--t3);
  }
  i:hover {
    opacity: 0.75;
  }
`;

const Axis = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
  margin-top: 3px;
`;

const Read = styled.p`
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
`;
