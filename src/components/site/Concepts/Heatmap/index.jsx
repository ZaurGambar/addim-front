import { useState } from "react";
import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import { CONCEPT_LABELS } from "@/utils/mock/concepts";
import { cssVar, divColor } from "@/utils/helpers/format";
import { useColorScheme } from "@/utils/hooks/useLeafletMap";

const CELL = 26;
const L = 150;
const T = 150;

const Heatmap = ({ concepts }) => {
  useColorScheme();
  const [tip, setTip] = useState(null);
  const K = concepts.keys;
  const n = K.length;
  const shared = new Set(concepts.shared_pairs.map((p) => p.join("|")));
  const isShared = (a, b) => shared.has([a, b].sort().join("|"));
  const W = L + n * CELL + 10;
  const H = T + n * CELL + 10;

  return (
    <Box>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Anlayış göstəriciləri arasında Spearman korrelasiya matrisi">
        {K.map((k, i) => (
          <g key={k}>
            <text x={L - 6} y={T + i * CELL + CELL / 2 + 3} textAnchor="end">{CONCEPT_LABELS[k]}</text>
            <text transform={`translate(${L + i * CELL + CELL / 2 + 3},${T - 6}) rotate(-60)`}>{CONCEPT_LABELS[k]}</text>
            {K.map((k2, j) => {
              const v = concepts.matrix[i][j];
              const fill = v == null ? cssVar("--panel-2") : i === j ? cssVar("--line") : divColor(v);
              return (
                <g key={k2} onMouseEnter={() => i !== j && setTip({ i, j, v })} onMouseLeave={() => setTip(null)}>
                  <rect x={L + j * CELL} y={T + i * CELL} width={CELL} height={CELL} fill={fill} stroke="var(--panel)" strokeWidth="1.5" />
                  {i !== j && isShared(k, k2) && <circle cx={L + j * CELL + CELL / 2} cy={T + i * CELL + CELL / 2} r="2.2" fill="var(--text-2)" pointerEvents="none" />}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      {tip && (
        <Tip style={{ left: `${((L + tip.j * CELL + CELL) / W) * 100}%`, top: `${((T + tip.i * CELL) / H) * 100}%` }}>
          <strong>{CONCEPT_LABELS[K[tip.i]]} × {CONCEPT_LABELS[K[tip.j]]}</strong>
          <br />ρ = <b>{tip.v ?? "–"}</b>
          {isShared(K[tip.i], K[tip.j]) && <><br />ortaq komponent, ehtiyatla oxuyun</>}
        </Tip>
      )}
      <Legend>
        <span>−1</span>
        <i />
        <span>+1</span>
        <span>· ortaq komponent</span>
      </Legend>
    </Box>
  );
};

export default Heatmap;

const Box = styled.div`
  position: relative;
  overflow-x: auto;
  ${card}

  svg {
    min-width: 620px;
    width: 100%;
    height: auto;
  }
  text {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 11.5px;
    fill: var(--text-2);
  }
`;

const Tip = styled.div`
  position: absolute;
  transform: translateX(8px);
  pointer-events: none;
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 8px 12px;
  font-size: 12px;
  max-width: 240px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-semibold);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  color: var(--text-3);
  margin-top: 8px;
  i {
    width: 120px;
    height: 10px;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--d-neg), var(--d-mid), var(--d-pos));
  }
`;
