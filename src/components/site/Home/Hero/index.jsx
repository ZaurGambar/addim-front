import styled, { keyframes } from "styled-components";
import { CountUp } from "@/components/common/Motion";
import { card, glow, kpiValue, label, pill } from "@/styles/common/mixins";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";

// "SmartUrban." nöqtəsi addım atır; mətnlər ardıcıl görünür
const flowK = keyframes`to { stroke-dashoffset: -48; }`;
const inK = keyframes`
  from {
    opacity: 0;
    translate: 0 14px;
  }
`;
const stepDot = keyframes`
  0%, 60%, 100% { translate: 0 0; }
  70% { translate: 6px -10px; }
  80% { translate: 12px 0; }
  90% { translate: 6px 0; }
`;

// Fokus: periferiya sakinləri (MVP "Dayanacağa 5 dəqiqə"); rəqəmlər transit_access.json-dan
const Hero = ({ transit, onHelp }) => {
  const S = transit.summary;
  const facts = [
    [S.far_pop, "insan dayanacağa 10 dəqiqədən çox yeriyir", 0, ""],
    [S.pct_5min, "sakin dayanacağa 5 dəqiqəyə çatır", 1, "%"],
    [S.under_walk_m, "orta piyada yolu (5 dəqiqədən uzaq yaşayanlar)", 0, " m"],
    [S.under_lst, "həmin məhəllələrdə yayda yerin səthi", 1, "°C"],
  ];
  return (
    <Wrap>
      <Streets aria-hidden="true" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
        <path id="h-s1" d="M-20 300 C 160 260, 260 330, 420 250 S 700 120, 840 160" />
        <path id="h-s2" d="M-20 120 C 120 160, 300 60, 460 120 S 700 300, 840 260" />
        <path id="h-s3" d="M200 -20 C 240 120, 160 260, 260 420" />
        <path id="h-s4" d="M600 -20 C 560 140, 680 260, 600 420" />
        {["h-s1", "h-s2", "h-s3", "h-s4"].map((id, i) => (
          <circle key={id} r="4">
            <animateMotion dur={`${9 + i * 2}s`} repeatCount="indefinite" begin={`${-i * 1.7}s`}>
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        ))}
      </Streets>
      <Brand>
        SmartUrban<span>.</span>
      </Brand>
      <Tag>Hər kəs üçün şəhər · periferiya sakinləri üçün · “İnsanyönümlü şəhərlər” hakatonu · 11–13.11.2026</Tag>
      <Grid>
        <div>
          <Thesis>
            Mərkəzdə avtobus hər küncdədir. Qəsəbədə isə insan dayanacağa 1–3 km, 43°C istidə, çox vaxt səkisiz yolla yeriyir, halbuki avtobus çox vaxt elə evin yanından keçir, sadəcə orada dayanmır. SmartUrban hər evdən dayanacağa real piyada yolunu ölçür və
            yeni dayanacaqların ən çox insana fayda verən yerini seçir.
          </Thesis>
          <Actions>
            <Button as={Link} to="/dayanacaq" size="lg">
              Simulyatoru aç
            </Button>
            <Button variant="secondary" size="lg" onClick={onHelp}>
              Necə oxumalı
            </Button>
          </Actions>
        </div>
        <Facts>
          {facts.map(([v, l, d, suf], i) => (
            <Fact key={l} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
              <b>
                <CountUp value={v} decimals={d} suffix={suf} />
              </b>
              <span>{l}</span>
            </Fact>
          ))}
        </Facts>
      </Grid>
    </Wrap>
  );
};

export default Hero;

const Wrap = styled.div`
  ${card}
  ${glow}
  padding: 32px;
  margin-top: 8px;

  &::before {
    content: "";
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: var(--accent);
    filter: blur(140px);
    opacity: 0.14;
    top: -420px;
    left: -120px;
    pointer-events: none;
  }
  > * {
    position: relative;
    z-index: 1;
  }
  @media (max-width: 560px) {
    padding: 20px;
  }
`;

const Brand = styled.h1`
  font-family: var(--font-bold);
  font-size: clamp(44px, 7vw, 80px);
  letter-spacing: -0.045em;
  line-height: 1;
  animation: ${inK} 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  span {
    color: var(--accent);
    display: inline-block;
    animation: ${stepDot} 2.4s ease-in-out 1s infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    span {
      animation: none;
    }
  }
`;

const Tag = styled.p`
  ${pill}
  height: auto;
  min-height: 24px;
  padding: 3px 11px;
  white-space: normal;
  margin-top: 14px;
  background: var(--accent-soft);
  color: var(--accent);
  animation: ${inK} 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.1s both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 32px;
  align-items: end;
  margin-top: 24px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Thesis = styled.p`
  font-size: clamp(17px, 2vw, 21px);
  line-height: 1.45;
  color: var(--text-2);
  max-width: 48ch;
  animation: ${inK} 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.2s both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
  animation: ${inK} 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.3s both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Facts = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  div {
    background: var(--bg-secondary);
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  b {
    ${kpiValue}
  }
  span {
    ${label}
  }
`;


const Streets = styled.svg`
  position: absolute !important;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0 !important;
  opacity: 0.55;
  pointer-events: none;
  mask-image: radial-gradient(120% 90% at 70% 40%, #000 30%, transparent 85%);

  path {
    fill: none;
    stroke: color-mix(in srgb, var(--accent) 45%, transparent);
    stroke-width: 1.5;
    stroke-dasharray: 6 10;
    animation: ${flowK} 2.4s linear infinite;
  }
  circle {
    fill: var(--accent);
    filter: drop-shadow(0 0 6px var(--accent));
  }
  @media (prefers-reduced-motion: reduce) {
    path {
      animation: none;
    }
    circle {
      display: none;
    }
  }
`;

const Fact = styled.div`
  animation: ${inK} 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
