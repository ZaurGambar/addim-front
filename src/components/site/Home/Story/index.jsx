import { useEffect, useRef } from "react";
import styled, { css, keyframes } from "styled-components";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CountUp, useInView } from "@/components/common/Motion";
import { card, label } from "@/styles/common/mixins";
import { CITIES } from "@/utils/mock/cities";
import { PILOTS } from "@/utils/mock/pilot";

// Ana səhifənin hekayə xətti: bir piyadanın yolu. Skroll etdikcə xətt dolur, "piyada" nöqtəsi irəliləyir.
const Story = ({ summary, city, synth }) => {
  const wrap = useRef(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el?.style.setProperty("--p", "1");
      return undefined;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - r.top) / r.height));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const top = synth.zones[0];
  const chapters = [
    {
      tag: "Problem",
      title: "Bakıda piyada yeraltına enir",
      text: "Mərkəzdə magistralı keçmək çox vaxt pilləkənlə yeraltı keçidə enmək, ya da səkkiz zolaqlı yolu gözləmək deməkdir. Uşaq arabası, yaşlı və əlil üçün bu yol bağlanır.",
      stats: [
        [summary.underpass_sites, "yeraltı keçid"],
        [summary.barrier_km, "km maneə magistral", 1],
        [summary.crossings_signalized, "işıqforlu keçid"],
      ],
      art: <Underpass />,
      to: "/xerite",
      cta: "Mərkəzi xəritə",
    },
    {
      tag: "Data",
      title: "Şəhəri 1 km-lik hücrələrlə ölçdük",
      text: "12 rayon, 9 mövzu: əhali, yollar, nəqliyyat, istilik, yaşıllıq, relyef, xidmətlər. Hamısı açıq mənbələrdən: OSM, opendata.az, DSK, Landsat.",
      stats: [
        [city.grid_cells, "hücrə"],
        [city.pois, "obyekt (POI)"],
        [city.pop, "nəfər, DSK 2024"],
      ],
      art: <DataGrid />,
      to: "/analiz",
      cta: "Bakı analizi",
    },
    {
      tag: "Sintez",
      title: "Problemlər eyni yerdə toplanır",
      text: `Səkkiz problem qatını üst-üstə qoyduq. Getis-Ord Gi* statistik qaynar nöqtələri göstərdi. 1-ci prioritet zona: ${top.place} (${top.top_layers.map((l) => l[0].toLowerCase()).join(", ")}).`,
      stats: [
        [synth.hot_pop, "nəfər qaynar nöqtələrdə"],
        [synth.zones.length, "prioritet zona"],
        [top.pop, `nəfər ${top.place} zonasında`],
      ],
      art: <Hotspot />,
      to: "/sintez",
      cta: "Sintez",
      hot: true,
    },
    {
      tag: "Dünya",
      title: "İşləyən modelləri Bakıya uyğunlaşdırdıq",
      text: `${CITIES.map((c) => c.name).slice(0, 3).join(", ")} və digərləri: piyada küçələri, yerüstü keçidlər, 15 dəqiqəlik şəhər. Hər model üçün Bakıda nə var, nə çatışmır.`,
      stats: [
        [CITIES.length, "şəhər modeli"],
        [29, "şəhərsalma anlayışı"],
        [8, "AI modulu"],
      ],
      art: <Models />,
      to: "/modeller",
      cta: "Şəhər modelləri",
    },
    {
      tag: "Pilot",
      title: "Yerdə yoxlayırıq: addım-addım",
      text: "Pilot zonalarda yeraltı keçidin yanına yerüstü zebra, kölgə və oturacaq. Peyk görüntüsü ilə 15 namizəd yoxlanıb, sahə yoxlaması forması açıqdır.",
      stats: [
        [PILOTS.length, "pilot zona"],
        [15, "peykdə yoxlanmış namizəd"],
        [city.transit500_pct, "% əhali dayanacağa 500 m-də", 1],
      ],
      art: <Steps />,
      to: "/pilot",
      cta: "Pilot",
    },
  ];

  return (
    <Wrap ref={wrap}>
      <Rail aria-hidden="true">
        <Track />
        <Fill />
        <Walker />
      </Rail>
      {chapters.map((c, i) => (
        <Chapter key={c.tag} index={i} {...c} />
      ))}
    </Wrap>
  );
};

export default Story;

const Chapter = ({ index, tag, title, text, stats, art, to, cta, hot }) => {
  const [ref, inView] = useInView({ threshold: 0.35 });
  return (
    <Row ref={ref} $on={inView}>
      <Node $on={inView} $hot={hot}>
        {String(index + 1).padStart(2, "0")}
      </Node>
      <Panel $on={inView}>
        <Body>
          <Tag $hot={hot}>{tag}</Tag>
          <h3>{title}</h3>
          <p>{text}</p>
          <Stats>
            {stats.map(([v, l, d]) => (
              <div key={l}>
                <b>
                  <CountUp value={v} decimals={d || 0} />
                </b>
                <span>{l}</span>
              </div>
            ))}
          </Stats>
          <Cta to={to}>
            {cta} <ArrowRight size={16} />
          </Cta>
        </Body>
        <Art $on={inView}>{art}</Art>
      </Panel>
    </Row>
  );
};

/* ---------- illüstrasiyalar (SVG + CSS) ---------- */

const flow = keyframes`to { stroke-dashoffset: -40; }`;
const drive = keyframes`
  from { translate: -60px 0; }
  to { translate: 240px 0; }
`;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Underpass = () => (
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

const DataGrid = () => (
  <svg viewBox="0 0 220 140">
    {Array.from({ length: 40 }, (_, i) => {
      const x = (i % 8) * 26 + 6;
      const y = Math.floor(i / 8) * 26 + 6;
      return <rect key={i} className="cell" x={x} y={y} width="22" height="22" rx="5" style={{ animationDelay: `${((i % 8) + Math.floor(i / 8)) * 0.12}s` }} />;
    })}
  </svg>
);

const Hotspot = () => (
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
const Models = () => (
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

const Steps = () => (
  <svg viewBox="0 0 220 140">
    <path className="route" d="M14 120 C 70 120, 70 30, 120 40 S 190 90, 206 20" />
    {[
      [22, 112], [40, 118], [56, 100], [66, 82], [70, 64], [84, 48], [104, 40], [124, 44], [140, 56], [156, 70], [174, 70], [188, 52], [200, 32],
    ].map(([x, y], i) => (
      <ellipse key={i} className="step" cx={x + (i % 2 ? 4 : -4)} cy={y} rx="4" ry="6.5" style={{ animationDelay: `${i * 0.22}s` }} />
    ))}
  </svg>
);

/* ---------- stil ---------- */

const Wrap = styled.div`
  --p: 0;
  --rail: 28px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-left: calc(var(--rail) * 2 + 8px);

  @media (max-width: 700px) {
    --rail: 18px;
    padding-left: calc(var(--rail) * 2 + 4px);
    gap: 20px;
  }
`;

const Rail = styled.div`
  position: absolute;
  left: var(--rail);
  top: 24px;
  bottom: 24px;
  width: 0;
`;

const Track = styled.div`
  position: absolute;
  left: -1px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: repeating-linear-gradient(to bottom, var(--line) 0 8px, transparent 8px 16px);
`;

const Fill = styled.div`
  position: absolute;
  left: -1.5px;
  top: 0;
  width: 3px;
  height: calc(var(--p) * 100%);
  border-radius: 3px;
  background: linear-gradient(to bottom, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--critical)));
  box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 60%, transparent);
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent); }
  100% { box-shadow: 0 0 0 14px transparent; }
`;
const Walker = styled.div`
  position: absolute;
  left: -8px;
  top: calc(var(--p) * 100% - 8px);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 4px solid var(--accent);
  animation: ${pulse} 1.6s ease-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Row = styled.section`
  position: relative;
`;

const Node = styled.span`
  position: absolute;
  left: calc(var(--rail) * -2 - 8px + var(--rail) - 18px);
  top: 22px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--font-bold);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  z-index: 1;
  color: ${({ $on }) => ($on ? "#fff" : "var(--text-3)")};
  background: ${({ $on, $hot }) => ($on ? ($hot ? "var(--critical)" : "var(--grad)") : "var(--solid)")};
  border: 1px solid ${({ $on }) => ($on ? "transparent" : "var(--line)")};
  box-shadow: ${({ $on, $hot }) => ($on ? `0 6px 20px color-mix(in srgb, ${$hot ? "var(--critical)" : "var(--accent)"} 45%, transparent)` : "none")};
  transition: background 0.4s, color 0.4s, box-shadow 0.4s, transform 0.4s;
  transform: scale(${({ $on }) => ($on ? 1 : 0.85)});

  @media (max-width: 700px) {
    left: calc(var(--rail) * -2 - 4px + var(--rail) - 14px);
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
`;

const Panel = styled.div`
  ${card}
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(200px, 1fr);
  gap: 20px;
  align-items: center;
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  translate: ${({ $on }) => ($on ? "0 0" : "24px 0")};
  transition: opacity 0.7s cubic-bezier(0.2, 0.7, 0.2, 1), translate 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
  animation: none;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    translate: none;
    transition: none;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  h3 {
    font-family: var(--font-bold);
    font-size: 22px;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  p {
    color: var(--text-2);
    font-size: 14.5px;
    max-width: 60ch;
  }
`;

const Tag = styled.span`
  align-self: flex-start;
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  font-family: var(--font-semibold);
  font-size: 12px;
  color: ${({ $hot }) => ($hot ? "var(--critical)" : "var(--accent)")};
  background: color-mix(in srgb, ${({ $hot }) => ($hot ? "var(--critical)" : "var(--accent)")} 15%, transparent);
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 6px;

  div {
    padding: 10px 12px;
    border-radius: 16px;
    background: var(--bg-secondary);
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  b {
    font-family: var(--font-bold);
    font-size: 22px;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  span {
    ${label}
    font-size: 12px;
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr 1fr;
    b {
      font-size: 19px;
    }
  }
`;

const Cta = styled(Link)`
  align-self: flex-start;
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-semibold);
  font-size: 13px;
  color: var(--accent);

  svg {
    transition: transform 0.2s;
  }
  &:hover svg {
    transform: translateX(4px);
  }
`;

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

const Art = styled.div`
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

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
    .step {
      opacity: 0.8;
    }
  }
`;
