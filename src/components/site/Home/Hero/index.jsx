import styled from "styled-components";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import { fmt } from "@/utils/helpers/format";

const Hero = ({ city, synth, onHelp }) => {
  const facts = [
    [fmt(city.pop), "Bakı əhalisi (WorldPop 2020)"],
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
  padding: 40px 0 32px;
  border-bottom: 1px solid var(--line);
`;

const Brand = styled.h1`
  font-family: var(--font-bold);
  font-size: clamp(48px, 9vw, 96px);
  letter-spacing: -0.04em;
  line-height: 1;
  span {
    color: var(--accent);
  }
`;

const Tag = styled.p`
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-3);
  margin-top: 12px;
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
  font-size: clamp(18px, 2.2vw, 23px);
  line-height: 1.45;
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
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  b {
    font-family: var(--font-mono);
    font-size: 24px;
    font-weight: 500;
  }
  span {
    font-size: 13px;
    color: var(--text-2);
  }
`;
