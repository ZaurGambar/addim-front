import { useState } from "react";
import styled from "styled-components";
import { fmt } from "@/utils/helpers/format";

const W = 640;
const H = 380;
const M = { l: 48, r: 20, t: 16, b: 44 };
const X_MAX = 50000;
const Y_MIN = 30;
const Y_MAX = 70;
const X_CUT = 25000;
const X = (v) => M.l + ((W - M.l - M.r) * v) / X_MAX;
const Y = (v) => M.t + (H - M.t - M.b) * (1 - (v - Y_MIN) / (Y_MAX - Y_MIN));

const RidershipScatter = ({ stations, onSelect }) => {
  const [tip, setTip] = useState(null);
  const st = stations.filter((s) => s.score != null && s.ride_2026);
  const hot = (s) => s.ride_2026 >= X_CUT && s.score < 50;
  const labelled = new Set(st.filter(hot).map((s) => s.name).concat(["28 May", "Ulduz"]));
  const placed = [];
  const labels = [];
  st.forEach((s) => {
    if (!labelled.has(s.name)) return;
    const cx = X(Math.min(s.ride_2026, X_MAX));
    const cy = Y(Math.max(Y_MIN, Math.min(Y_MAX, s.score)));
    const right = cx > W - 140;
    const txt = s.name.replace(" st.", "");
    const w = txt.length * 6.5;
    const x0 = right ? cx - 10 - w : cx + 10;
    let ly = cy + 4;
    while (placed.some((p) => x0 < p.x + p.w && x0 + w > p.x && Math.abs(ly - p.y) < 14)) ly += 14;
    placed.push({ x: x0, y: ly, w });
    labels.push({ key: s.name, x: right ? cx - 10 : cx + 10, y: ly, anchor: right ? "end" : "start", txt });
  });
  const hs = st.filter(hot).sort((a, b) => b.ride_2026 - a.ride_2026);

  return (
    <Grid>
      <Box>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Metro stansiyaları: gündəlik sərnişin və piyada indeksi">
          <rect className="zone" x={X(X_CUT)} y={Y(50)} width={X(X_MAX) - X(X_CUT)} height={Y(Y_MIN) - Y(50)} />
          <text className="zone-t" x={X(X_MAX) - 6} y={Y(Y_MIN) - 8} textAnchor="end">ÇOX SƏRNİŞİN · AZ RAHATLIQ</text>
          {[30, 40, 50, 60, 70].map((v) => (
            <g key={v}>
              <line className="grid" x1={M.l} x2={W - M.r} y1={Y(v)} y2={Y(v)} />
              <text x={M.l - 8} y={Y(v) + 4} textAnchor="end">{v}</text>
            </g>
          ))}
          {[0, 10000, 20000, 30000, 40000, 50000].map((v) => (
            <text key={v} x={X(v)} y={H - M.b + 18} textAnchor="middle">{v / 1000}k</text>
          ))}
          <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle">gündəlik sərnişin, 2026</text>
          {st.map((s) => {
            const cx = X(Math.min(s.ride_2026, X_MAX));
            const cy = Y(Math.max(Y_MIN, Math.min(Y_MAX, s.score)));
            return (
              <g key={s.name} onMouseEnter={() => setTip({ s, cx, cy })} onMouseLeave={() => setTip(null)} onClick={() => onSelect(s)} style={{ cursor: "pointer" }}>
                <circle className={hot(s) ? "dot hot" : "dot"} cx={cx} cy={cy} r="6" />
                <circle cx={cx} cy={cy} r="14" fill="transparent" />
              </g>
            );
          })}
          {labels.map((l) => (
            <text key={l.key} className="lab" x={l.x} y={l.y} textAnchor={l.anchor}>{l.txt}</text>
          ))}
        </svg>
        {tip && (
          <Tip style={{ left: `${(tip.cx / W) * 100}%`, top: `${(tip.cy / H) * 100}%` }}>
            <strong>Ⓜ {tip.s.name}</strong>
            <br />Gündə <b>{fmt(tip.s.ride_2026)}</b> sərnişin
            <br />İndeks: <b>{tip.s.score}</b>/100
          </Tip>
        )}
      </Box>
      <Read>
        Qırmızı zonada <b>{hs.length}</b> stansiya var: {hs.map((s) => s.name.replace(" st.", "")).join(", ")}. Onlardan gündə cəmi <b>{fmt(hs.reduce((t, s) => t + s.ride_2026, 0))}</b> sərnişin keçir, ətrafın indeksi isə 50-dən aşağıdır. Müqayisə üçün: 28 May ən yüklü stansiyalardandır, amma indeksi {stations.find((x) => x.name === "28 May")?.score}-dir. Yüksək yük və rahat mühit birlikdə mümkündür.
      </Read>
    </Grid>
  );
};

export default RidershipScatter;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 32px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Box = styled.div`
  position: relative;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 8px;

  text {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: var(--text-3);
  }
  .lab {
    font-family: var(--font);
    font-size: 12px;
    fill: var(--text);
  }
  .grid {
    stroke: var(--line-soft);
  }
  .zone {
    fill: var(--accent-soft);
  }
  .zone-t {
    fill: var(--accent);
  }
  .dot {
    fill: var(--s4);
    stroke: var(--panel);
    stroke-width: 2;
  }
  .dot.hot {
    fill: var(--accent);
  }
`;

const Tip = styled.div`
  position: absolute;
  transform: translate(12px, -50%);
  pointer-events: none;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
`;

const Read = styled.p`
  font-size: 15px;
  color: var(--text-2);
  b {
    font-family: var(--font-mono);
    color: var(--text);
  }
`;
