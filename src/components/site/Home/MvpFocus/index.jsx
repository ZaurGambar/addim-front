import styled from "styled-components";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, Bus, MapPin, Ruler } from "lucide-react";
import { card, hoverLift } from "@/styles/common/mixins";
import { fmt } from "@/utils/helpers/format";

// Ana səhifədə MVP: kim üçün, necə işləyir, nəticə nədir
const MvpFocus = ({ transit }) => {
  const far = transit.scenarios.far;
  const all = transit.scenarios.all;
  const S = transit.summary;
  const k = 10;
  const cost = k * S.stop_cost;
  const first = far.proposals.slice(0, 3);
  return (
    <Wrap>
      <Steps>
        <li>
          <Ruler size={20} />
          <b>1. Ölçür</b>
          <span>
            {fmt(S.pop_total)} sakinin hər məhəllə blokundan ən yaxın avtobus və metro dayanacağına ({fmt(S.stops_n)} nöqtə) real piyada yolu, 420 min qovşaqlı şəbəkədə.
          </span>
        </li>
        <li>
          <BrainCircuit size={20} />
          <b>2. Seçir</b>
          <span>
            AI optimallaşdırma {S.routes_n} mövcud marşrutun üzərində {fmt(S.candidates_n)} nöqtəni yoxlayır və hər dəfə ən çox insanı 5 dəqiqəlik məsafəyə gətirən yeri seçir.
          </span>
        </li>
        <li>
          <Bus size={20} />
          <b>3. Təklif edir</b>
          <span>Hər dayanacaq üçün: hansı marşrut, hansı məhəllə, neçə insan, nə qədər xərc. Yeni avtobus və yeni marşrut lazım deyil.</span>
        </li>
      </Steps>

      <Result>
        <div className="big">
          <span>{k} yeni dayanacaq</span>
          <b>+{fmt(far.curve[k])} insan</b>
          <em>
            dayanacağa 10 dəqiqədən çox yeriyənlərdən 5 dəqiqəlik məsafəyə düşür · {fmt(cost)} ₼ · nəfərə {(cost / far.curve[k]).toFixed(1)} ₼ · gündə {fmt(Math.round(far.saved[k] / 60))} saat qənaət
          </em>
        </div>
        <div>
          <span>Bütün şəhər ssenarisi</span>
          <b>+{fmt(all.curve[k])}</b>
          <em>insan, nəfərə {(cost / all.curve[k]).toFixed(1)} ₼</em>
        </div>
      </Result>

      <Firsts>
        {first.map((p) => (
          <li key={p.k}>
            <MapPin size={16} />
            <div>
              <b>
                {p.k}. {p.zone}
              </b>
              <span>
                {p.rayon} · marşrut {p.routes.join(", ")}
              </span>
              <em>
                {fmt(p.walk_before_m)} m → ≤ 400 m · +{fmt(p.gain)} insan
              </em>
            </div>
          </li>
        ))}
        <CTA as={Link} to="/dayanacaq">
          Bütün təkliflər və simulyator <ArrowRight size={16} />
        </CTA>
      </Firsts>
    </Wrap>
  );
};

export default MvpFocus;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const Steps = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  li {
    ${card}
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  svg {
    color: var(--accent);
  }
  b {
    font-family: var(--font-bold);
    font-size: 17px;
  }
  span {
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--text-2);
  }
  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;
const Result = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 12px;
  > div {
    ${card}
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .big {
    border-left: 4px solid var(--accent);
  }
  span {
    font-size: 13px;
    color: var(--text-3);
  }
  b {
    font-family: var(--font-bold);
    font-size: clamp(26px, 4vw, 38px);
    color: var(--accent);
  }
  div:not(.big) b {
    font-size: 26px;
    color: var(--text);
  }
  em {
    font-style: normal;
    font-size: 13.5px;
    color: var(--text-2);
  }
  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;
const Firsts = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  li {
    ${card}
    display: flex;
    gap: 10px;
    padding: 14px 16px;
  }
  li > svg {
    flex: none;
    color: var(--accent);
    margin-top: 2px;
  }
  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  span,
  em {
    font-size: 12.5px;
    color: var(--text-2);
    font-style: normal;
  }
`;
const CTA = styled.a`
  ${card}
  ${hoverLift}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-bold);
  color: var(--accent);
  text-decoration: none;
`;
