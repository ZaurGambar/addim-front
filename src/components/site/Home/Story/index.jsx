import { useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { Art, DataGrid, Hotspot, Models, Steps, Underpass } from "@/components/common/Illustrations";
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
      title: "Yolu keçmək üçün yerin altına enirik",
      text: "Mərkəzdə geniş maşın yolunu keçmək üçün çox vaxt pilləkənlə yeraltı keçidə enmək lazımdır. Uşaq arabası olan ana, yaşlı insan və əlil arabasında olan adam üçün bu, böyük çətinlikdir.",
      stats: [
        [summary.underpass_sites, "yeraltı keçid"],
        [summary.barrier_km, "km keçilməsi çətin geniş yol", 1],
        [summary.crossings_signalized, "svetoforlu keçid"],
      ],
      art: <Underpass />,
      to: "/xerite",
      cta: "Mərkəzi xəritə",
    },
    {
      tag: "Ölçdük",
      title: "Bütün şəhəri kiçik kvadratlara böldük",
      text: "Bakını 1 km-lik kvadratlara böldük. Hər kvadratda baxdıq: neçə insan yaşayır, nə qədər istidir, ağac varmı, avtobus yaxındırmı, mağaza və məktəb varmı. Bütün məlumat açıq mənbələrdəndir.",
      stats: [
        [city.grid_cells, "kvadrat yoxlandı"],
        [city.pois, "mağaza, məktəb, aptek və s."],
        [city.pop, "insan (rəsmi statistika)"],
      ],
      art: <DataGrid />,
      to: "/analiz",
      cta: "Bakı analizi",
    },
    {
      tag: "Tapdıq",
      title: "Problemlər eyni yerlərdə toplanır",
      text: `Bəzi yerlərdə bir neçə problem birdən var: isti, ağac az, avtobus uzaq, yol keçmək çətin. Biz belə yerləri xəritədə tapdıq. 1-ci yer: ${top.place}. Orada əsas problemlər: ${top.top_layers.map((l) => l[0].toLowerCase()).join(", ")}.`,
      stats: [
        [synth.hot_pop, "insan ən çətin yerlərdə yaşayır"],
        [synth.zones.length, "kömək lazım olan zona"],
        [top.pop, `insan ${top.place} zonasında`],
      ],
      art: <Hotspot />,
      to: "/sintez",
      cta: "Sintez",
      hot: true,
    },
    {
      tag: "Öyrəndik",
      title: "Başqa şəhərlər bunu necə həll edib?",
      text: `${CITIES.map((c) => c.name).slice(0, 3).join(", ")} və başqa şəhərlər piyadalar üçün çox iş görüb: piyada küçələri açıblar, yerüstü zebra çəkiblər. Onların yaxşı fikirlərini götürüb Bakıya uyğunlaşdırdıq.`,
      stats: [
        [CITIES.length, "şəhərin təcrübəsi"],
        [29, "şəhərsalma fikri"],
        [8, "süni intellekt aləti"],
      ],
      art: <Models />,
      to: "/modeller",
      cta: "Şəhər modelləri",
    },
    {
      tag: "Sınayırıq",
      title: "Əvvəlcə kiçik bir yerdə sınayırıq",
      text: "3 yer seçdik. Orada yeraltı keçidin yanına adi zebra, kölgə və oturacaq qoymağı təklif edirik. Nəticə yaxşı olsa, bu həll bütün şəhərə yayılacaq.",
      stats: [
        [PILOTS.length, "sınaq yeri"],
        [15, "yer peykdən yoxlanıb"],
        [city.transit500_pct, "% insan dayanacağa yaxındır", 1],
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

