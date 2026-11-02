import styled, { css, keyframes } from "styled-components";

// Animasiyalı izah şəkilləri (SVG + CSS). <Art $on={görünür}> içində istifadə olunur:
// ekranda deyilsə animasiyalar dayanır, "hərəkəti azalt" ayarında söndürülür.

/* ---------- illüstrasiyalar (SVG + CSS) ---------- */

const flow = keyframes`to { stroke-dashoffset: -40; }`;
const drive = keyframes`
  from { translate: -60px 0; }
  to { translate: 240px 0; }
`;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const Underpass = () => (
  <svg viewBox="0 0 220 140">
    <rect className="road" x="0" y="34" width="220" height="44" rx="6" />
    <line className="lane" x1="0" y1="56" x2="220" y2="56" />
    <rect className="car" x="20" y="40" width="26" height="12" rx="4" />
    <rect className="car c2" x="120" y="60" width="26" height="12" rx="4" />
    <path className="tunnel" d="M30 92 h22 v24 h116 v-24 h22" />
    <path id="ped-path" className="route" d="M10 26 H40 V106 H180 V26 H210" />
    {still() ? (
      <circle className="ped" cx="110" cy="106" r="5" />
    ) : (
      <circle className="ped" r="5">
        <animateMotion dur="5s" repeatCount="indefinite" rotate="0">
          <mpath href="#ped-path" />
        </animateMotion>
      </circle>
    )}
  </svg>
);

export const DataGrid = () => (
  <svg viewBox="0 0 220 140">
    {Array.from({ length: 40 }, (_, i) => {
      const x = (i % 8) * 26 + 6;
      const y = Math.floor(i / 8) * 26 + 6;
      return <rect key={i} className="cell" x={x} y={y} width="22" height="22" rx="5" style={{ animationDelay: `${((i % 8) + Math.floor(i / 8)) * 0.12}s` }} />;
    })}
  </svg>
);

export const Hotspot = () => (
  <svg viewBox="0 0 220 140">
    {Array.from({ length: 40 }, (_, i) => (
      <rect key={i} className="cell dim" x={(i % 8) * 26 + 6} y={Math.floor(i / 8) * 26 + 6} width="22" height="22" rx="5" />
    ))}
    <circle className="ring" cx="122" cy="70" r="16" />
    <circle className="ring r2" cx="122" cy="70" r="16" />
    <circle className="ring r3" cx="122" cy="70" r="16" />
    <circle className="core" cx="122" cy="70" r="9" />
  </svg>
);

const CITY_PTS = [
  [24, 28], [70, 16], [196, 24], [204, 108], [30, 112], [150, 126],
];
export const Models = () => (
  <svg viewBox="0 0 220 140">
    {CITY_PTS.map(([x, y], i) => (
      <g key={i}>
        <path className="arc" d={`M${x} ${y} Q ${(x + 110) / 2} ${(y + 70) / 2 - 24} 110 70`} style={{ animationDelay: `${i * 0.3}s` }} />
        <circle className="city" cx={x} cy={y} r="6" />
      </g>
    ))}
    <circle className="baku-glow" cx="110" cy="70" r="16" />
    <circle className="baku" cx="110" cy="70" r="9" />
  </svg>
);

export const Steps = () => (
  <svg viewBox="0 0 220 140">
    <path className="route" d="M14 120 C 70 120, 70 30, 120 40 S 190 90, 206 20" />
    {[
      [22, 112], [40, 118], [56, 100], [66, 82], [70, 64], [84, 48], [104, 40], [124, 44], [140, 56], [156, 70], [174, 70], [188, 52], [200, 32],
    ].map(([x, y], i) => (
      <ellipse key={i} className="step" cx={x + (i % 2 ? 4 : -4)} cy={y} rx="4" ry="6.5" style={{ animationDelay: `${i * 0.22}s` }} />
    ))}
  </svg>
);


export const MapLayers = () => (
  <svg viewBox="0 0 220 140">
    {[
      ["l3", "var(--good)"],
      ["l2", "var(--warn)"],
      ["l1", "var(--accent)"],
    ].map(([c, col]) => (
      <g key={c} className={`layer ${c}`}>
        <path d="M40 70 L110 40 L180 70 L110 100 Z" style={{ fill: `color-mix(in srgb, ${col} 28%, transparent)`, stroke: col }} />
      </g>
    ))}
  </svg>
);

export const WalkScore = () => (
  <svg viewBox="0 0 220 140">
    <path className="route" d="M36 64 C 80 30, 140 98, 184 64" />
    <circle className="metro" cx="36" cy="64" r="16" />
    <text className="m-txt" x="36" y="69" textAnchor="middle">M</text>
    <circle className="park" cx="184" cy="64" r="16" />
    <path className="tree" d="M184 54 l8 12 h-16 z" />
    {still() ? (
      <circle className="walker" cx="110" cy="64" r="5" />
    ) : (
      <circle className="walker" r="5">
        <animateMotion dur="3.6s" repeatCount="indefinite" path="M36 64 C 80 30, 140 98, 184 64" />
      </circle>
    )}
    <rect className="bar-bg" x="30" y="112" width="160" height="10" rx="5" />
    <rect className="bar" x="30" y="112" width="120" height="10" rx="5" />
  </svg>
);

export const Swot = () => (
  <svg viewBox="0 0 220 140">
    {[
      ["S", 52, 14, "var(--good)"],
      ["W", 114, 14, "var(--critical)"],
      ["O", 52, 74, "var(--accent)"],
      ["T", 114, 74, "var(--serious)"],
    ].map(([l, x, y, col], i) => (
      <g key={l} className="quad" style={{ animationDelay: `${i * 0.35}s` }}>
        <rect x={x} y={y} width="54" height="52" rx="12" style={{ fill: `color-mix(in srgb, ${col} 22%, transparent)`, stroke: col }} />
        <text x={x + 27} y={y + 34} textAnchor="middle" style={{ fill: col }}>
          {l}
        </text>
      </g>
    ))}
  </svg>
);

const NET = [[40, 40], [100, 24], [170, 36], [60, 100], [120, 76], [184, 106], [28, 72], [150, 124]];
const LINKS = [[0, 1], [1, 2], [0, 4], [1, 4], [2, 4], [3, 4], [4, 5], [3, 6], [0, 6], [4, 7], [5, 7]];
export const Network = () => (
  <svg viewBox="0 0 220 140">
    {LINKS.map(([a, b], i) => (
      <line key={i} className="link" x1={NET[a][0]} y1={NET[a][1]} x2={NET[b][0]} y2={NET[b][1]} style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
    {NET.map(([x, y], i) => (
      <circle key={i} className="node" cx={x} cy={y} r={i === 4 ? 9 : 6} style={{ animationDelay: `${i * 0.25}s` }} />
    ))}
  </svg>
);

export const Brain = () => (
  <svg viewBox="0 0 220 140">
    {[30, 70, 110].map((y) =>
      [70, 50, 90].map((y2, j) => <line key={`${y}-${j}`} className="sig" x1="28" y1={y} x2="110" y2={y2 + 0} />)
    )}
    {[50, 70, 90].map((y) => (
      <line key={y} className="sig s2" x1="110" y1={y} x2="192" y2="70" />
    ))}
    {[30, 70, 110].map((y) => (
      <circle key={y} className="in" cx="28" cy={y} r="7" />
    ))}
    {[50, 70, 90].map((y, i) => (
      <circle key={y} className="hid" cx="110" cy={y} r="8" style={{ animationDelay: `${i * 0.3}s` }} />
    ))}
    <circle className="out" cx="192" cy="70" r="11" />
  </svg>
);

export const Checklist = () => (
  <svg viewBox="0 0 220 140">
    {[24, 60, 96].map((y, i) => (
      <g key={y}>
        <rect className="box" x="30" y={y} width="22" height="22" rx="6" />
        <path className="tick" d={`M35 ${y + 11} l5 6 l9 -11`} style={{ animationDelay: `${i * 0.6}s` }} />
        <rect className="line-bg" x="64" y={y + 6} width="120" height="10" rx="5" />
        <rect className="line" x="64" y={y + 6} width={[110, 84, 96][i]} height="10" rx="5" style={{ animationDelay: `${i * 0.6 + 0.2}s` }} />
      </g>
    ))}
  </svg>
);

const dash = keyframes`to { stroke-dashoffset: -32; }`;
const wave = keyframes`
  0%, 100% { fill-opacity: 0.12; }
  45% { fill-opacity: 0.85; }
`;
const ring = keyframes`
  from { transform: scale(1); opacity: 0.7; }
  to { transform: scale(4.2); opacity: 0; }
`;
const glowK = keyframes`
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(1.35); }
`;
const stepK = keyframes`
  0%, 8% { opacity: 0; }
  14%, 70% { opacity: 1; }
  100% { opacity: 0; }
`;

const layerK = keyframes`
  0%, 100% { translate: 0 0; }
  50% { translate: 0 var(--dy); }
`;
const fillK = keyframes`
  0%, 15% { transform: scaleX(0); }
  60%, 100% { transform: scaleX(1); }
`;
const popK = keyframes`
  0%, 100% { transform: scale(1); }
  12% { transform: scale(1.12); }
  24% { transform: scale(1); }
`;
const blinkK = keyframes`
  0%, 100% { opacity: 0.35; }
  30% { opacity: 1; }
`;
const tickK = keyframes`
  0%, 10% { stroke-dashoffset: 24; }
  30%, 100% { stroke-dashoffset: 0; }
`;

export const Art = styled.div`
  justify-self: center;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 220 / 140;
  border-radius: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--line-soft);
  overflow: hidden;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  ${({ $on }) =>
    !$on &&
    css`
      * {
        animation-play-state: paused !important;
      }
    `}

  .road {
    fill: color-mix(in srgb, var(--text) 10%, transparent);
  }
  .lane {
    stroke: var(--text-3);
    stroke-width: 2;
    stroke-dasharray: 10 10;
    animation: ${flow} 1s linear infinite;
  }
  .car {
    fill: var(--warn);
    animation: ${drive} 2.6s linear infinite;
  }
  .car.c2 {
    fill: var(--critical);
    animation-direction: reverse;
    animation-duration: 3.2s;
  }
  .tunnel {
    fill: none;
    stroke: var(--line);
    stroke-width: 10;
    stroke-linejoin: round;
  }
  .route {
    fill: none;
    stroke: color-mix(in srgb, var(--accent) 55%, transparent);
    stroke-width: 2;
    stroke-dasharray: 4 6;
    animation: ${dash} 1.2s linear infinite;
  }
  .ped {
    fill: var(--accent);
    filter: drop-shadow(0 0 4px var(--accent));
  }
  .cell {
    fill: var(--accent);
    fill-opacity: 0.12;
    animation: ${wave} 3.2s ease-in-out infinite;
  }
  .cell.dim {
    fill: var(--text-3);
    fill-opacity: 0.1;
    animation: none;
  }
  .ring {
    fill: none;
    stroke: var(--critical);
    stroke-width: 2;
    transform-box: fill-box;
    transform-origin: center;
    animation: ${ring} 2.4s ease-out infinite;
  }
  .ring.r2 {
    animation-delay: 0.8s;
  }
  .ring.r3 {
    animation-delay: 1.6s;
  }
  .core {
    fill: var(--critical);
    filter: drop-shadow(0 0 8px var(--critical));
  }
  .arc {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-dasharray: 3 7;
    opacity: 0.8;
    animation: ${dash} 1.4s linear infinite;
  }
  .city {
    fill: var(--solid);
    stroke: var(--accent);
    stroke-width: 2;
  }
  .baku {
    fill: var(--accent);
  }
  .baku-glow {
    fill: var(--accent);
    transform-box: fill-box;
    transform-origin: center;
    animation: ${glowK} 2.4s ease-in-out infinite;
  }
  .step {
    fill: var(--accent);
    opacity: 0;
    animation: ${stepK} 3.6s ease-in-out infinite;
  }

  .layer {
    animation: ${layerK} 3s ease-in-out infinite;
  }
  .layer path {
    stroke-width: 1.5;
  }
  .layer.l1 {
    --dy: -22px;
  }
  .layer.l2 {
    --dy: 0px;
  }
  .layer.l3 {
    --dy: 22px;
  }
  .metro {
    fill: var(--critical);
  }
  .m-txt {
    fill: #fff;
    font: 700 14px var(--font-bold);
  }
  .park {
    fill: color-mix(in srgb, var(--good) 30%, transparent);
    stroke: var(--good);
    stroke-width: 2;
  }
  .tree {
    fill: var(--good);
  }
  .walker {
    fill: var(--accent);
    filter: drop-shadow(0 0 4px var(--accent));
  }
  .bar-bg,
  .line-bg {
    fill: color-mix(in srgb, var(--text) 10%, transparent);
  }
  .bar {
    fill: var(--accent);
    transform-box: fill-box;
    transform-origin: left center;
    animation: ${fillK} 3.6s ease-in-out infinite;
  }
  .quad {
    transform-box: fill-box;
    transform-origin: center;
    animation: ${popK} 2.8s ease-in-out infinite;
  }
  .quad rect {
    stroke-width: 1.5;
  }
  .quad text {
    font: 700 22px var(--font-bold);
  }
  .link {
    stroke: var(--accent);
    stroke-width: 1.4;
    stroke-dasharray: 3 5;
    opacity: 0.7;
    animation: ${dash} 1.6s linear infinite;
  }
  .node {
    fill: var(--accent);
    animation: ${blinkK} 2.4s ease-in-out infinite;
  }
  .sig {
    stroke: color-mix(in srgb, var(--accent) 60%, transparent);
    stroke-width: 1.3;
    stroke-dasharray: 4 8;
    animation: ${dash} 1.2s linear infinite;
  }
  .sig.s2 {
    stroke: color-mix(in srgb, var(--good) 70%, transparent);
  }
  .in {
    fill: var(--solid);
    stroke: var(--text-3);
    stroke-width: 2;
  }
  .hid {
    fill: var(--accent);
    animation: ${blinkK} 1.8s ease-in-out infinite;
  }
  .out {
    fill: var(--good);
    filter: drop-shadow(0 0 6px var(--good));
  }
  .box {
    fill: var(--solid);
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .tick {
    fill: none;
    stroke: var(--good);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 24;
    animation: ${tickK} 3.6s ease-out infinite;
  }
  .line {
    fill: var(--accent);
    opacity: 0.7;
    transform-box: fill-box;
    transform-origin: left center;
    animation: ${fillK} 3.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
    .step {
      opacity: 0.8;
    }
  }
`;
