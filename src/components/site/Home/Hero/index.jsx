import styled from "styled-components";
import { card, glow, kpiValue, label, pill } from "@/styles/common/mixins";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import { fmt } from "@/utils/helpers/format";

const Hero = ({ city, synth, onHelp }) => {
  const facts = [
    [fmt(city.pop), "Bakı əhalisi (DSK, 2024)"],
    [fmt(synth.hot_pop), "nəfər statistik qaynar nöqtələrdə"],
    [`${city.transit500_pct}%`, "əhali dayanacağa 500 m-də"],
    [`${city.lst_popw}°C`, "yay günü səth temperaturu"],
  ];
  return (
    <Wrap>
      <Brand>
        ADDIM<span>.</span>
      </Brand>
      <Tag>Bakı üçün AI piyada platforması · “İnsanyönümlü şəhərlər” hakatonu · 11–13.11.2026</Tag>
      <Grid>
        <div>
          <Thesis>
            Bakıda piyada çox vaxt yeraltı keçidə enir, 8 zolaqlı prospekti gözləyir və kölgəsiz səkidə yeriyir. ADDIM şəhəri 9 mövzu üzrə analiz edir, problemlərin üst-üstə düşdüyü zonaları tapır və dünya şəhərlərinin modellərini Bakıya uyğunlaşdırır.
          </Thesis>
          <Actions>
            <Button as={Link} to="/analiz" size="lg">
              Analizə başla
            </Button>
            <Button variant="secondary" size="lg" onClick={onHelp}>
              Necə oxumalı
            </Button>
          </Actions>
        </div>
        <Facts>
          {facts.map(([v, l]) => (
            <div key={l}>
              <b>{v}</b>
              <span>{l}</span>
            </div>
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
  span {
    color: var(--accent);
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
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
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
