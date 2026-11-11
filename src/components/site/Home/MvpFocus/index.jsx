import styled from "styled-components";
import { Link } from "react-router-dom";
import { Accessibility, ArrowRight, Baby, BarChart3, Megaphone, PersonStanding, Route, Target, UserRound } from "lucide-react";
import { card } from "@/styles/common/mixins";
import { fmt } from "@/utils/helpers/format";

// Ana səhifə: Problem → Həll → Hədəf (inclusive_access.json, marşrut modulu)
const PROF = [
  ["adult", "Orta piyada", PersonStanding],
  ["elderly", "Yaşlı", UserRound],
  ["wheel", "Əlil arabası", Accessibility],
  ["stroller", "Uşaq arabalı valideyn", Baby],
];

const MvpFocus = ({ inc }) => {
  const P = inc.profiles;
  const G = inc.groups;
  const S = inc.scenarios;
  const base = S[0].wheel;
  const last = S[S.length - 1].wheel;
  const yas = inc.rayons.find((r) => r.rayon === "Yasamal");
  const qar = inc.rayons.find((r) => r.rayon === "Qaradağ");
  return (
    <Wrap>
      <Block>
        <h3>
          <BarChart3 size={18} /> Problem: eyni şəhər, fərqli imkan
        </h3>
        <p>10 dəqiqədə 5 gündəlik xidmətin hamısına (dayanacaq, aptek, səhiyyə, ərzaq, park) çatan əhali payı, profil üzrə:</p>
        <Bars>
          {PROF.map(([k, label, Icon]) => (
            <li key={k}>
              <span>
                <Icon size={15} /> {label}
              </span>
              <div>
                <i style={{ width: `${(P[k].full / P.adult.full) * 100}%` }} className={k === "adult" ? "ref" : ""} />
              </div>
              <b>{P[k].full}%</b>
            </li>
          ))}
        </Bars>
        <Facts>
          <li>
            <b>{P.wheel.none}%</b> əlil arabası istifadəçisi heç bir gündəlik xidmətə 10 dəqiqədə çatmır
          </li>
          <li>
            <b>Mərkəzdə maneə:</b> Yasamalda orta piyada {yas.adult}%, əlil arabası {yas.wheel}% ({inc.barriers.underpasses} yeraltı keçid)
          </li>
          <li>
            <b>Periferiyada məsafə:</b> Qaradağda hamı üçün {qar.wheel}–{qar.adult}%
          </li>
          <li>
            <b>{fmt(G.children.risky_school)}</b> uşağın ən yaxın məktəbi riskli yol mühitindədir
          </li>
        </Facts>
      </Block>

      <Block>
        <h3>
          <Route size={18} /> Həll: üç hissə, bir sistem
        </h3>
        <Steps>
          <li>
            <b>1. SmartUrban Analiz — ölçür</b>
            <span>2 685 məhəllə blokunda 4 profil üçün 10 dəqiqəlik çatım; maneələr (yeraltı keçid, yamac), həssas qruplar, prioritet zonalar və tədbir paketləri.</span>
            <Link to="/planlama?addim=3">Analiz →</Link>
          </li>
          <li>
            <b>2. SmartUrban Marşrut — yol göstərir</b>
            <span>Multimodal marşrutlar (avtobus, metro, piyada) sakinin profili ilə yoxlanır: pilləkən, dik yamac, liftsiz metro və real vaxt göstərilir, maneəsiz variant önə çıxır.</span>
            <Link to="/marsrut">Marşrut →</Link>
          </li>
          <li>
            <b>3. SmartUrban Panel — bildiriş → qərar</b>
            <span>
              <Megaphone size={13} /> Sakin maneəni bir kliklə bildirir; bildiriş AYNA-nın panelinə düşür, SmartUrban prioritet zonaları və tədbir siyahısını yeniləyir.
            </span>
            <Link to="/bolgeleme">Tədbirlər →</Link>
          </li>
        </Steps>
      </Block>

      <Block>
        <h3>
          <Target size={18} /> Hədəf: ölçülə bilən nəticə
        </h3>
        <p>Ssenarilər eyni modeldə hesablanıb (əlil arabası profili, 10 dəqiqədə 5 xidmət):</p>
        <Ladder>
          {S.map((s, i) => (
            <li key={s.key}>
              <em>{i === 0 ? "İndi" : `Addım ${i}`}</em>
              <span>{s.name}</span>
              <b>{s.wheel.full}%</b>
              <small>{fmt(s.wheel.disabled_ok)} əlilliyi olan şəxs</small>
            </li>
          ))}
        </Ladder>
        <Goal>
          <li>
            Əlil arabası üçün tam səbət: <b>{base.full}% → {last.full}%</b> (+{fmt(last.disabled_ok - base.disabled_ok)} əlilliyi olan, +{fmt(S[S.length - 1].elderly.elderly_ok - S[0].elderly.elderly_ok)} yaşlı)
          </li>
          <li>
            Uşaq arabalı valideyn: <b>
              {S[0].stroller.full}% → {S[S.length - 1].stroller.full}%
            </b>
          </li>
          <li>
            Aptekə 10 dəqiqə (yaşlı): <b>
              {S[0].elderly.services.pharmacy}% → {S[S.length - 1].elderly.services.pharmacy}%
            </b>
          </li>
          <li>Pilot: 3 zonada 12 ay, “əvvəl/sonra” sahə auditi və sakin bildirişləri ilə yoxlanır.</li>
        </Goal>
        <CTA as={Link} to="/marsrut">
          Marşrutu profilimlə yoxla <ArrowRight size={16} />
        </CTA>
      </Block>
    </Wrap>
  );
};

export default MvpFocus;

const Wrap = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;
const Block = styled.section`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 10px;
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-bold);
    font-size: 17px;
    svg {
      color: var(--accent);
    }
  }
  > p {
    font-size: 13px;
    color: var(--text-2);
  }
`;
const Bars = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  li {
    display: grid;
    grid-template-columns: 150px 1fr 48px;
    gap: 8px;
    align-items: center;
    font-size: 13px;
  }
  span {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  div {
    height: 12px;
    background: var(--line);
    border-radius: 6px;
    overflow: hidden;
  }
  i {
    display: block;
    height: 100%;
    background: var(--critical);
  }
  i.ref {
    background: var(--text-3);
  }
  b {
    text-align: right;
  }
`;
const Facts = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--text-2);
  li {
    padding-left: 10px;
    border-left: 3px solid var(--line);
  }
  b {
    color: var(--text);
  }
`;
const Steps = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 10px;
  li {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 14px;
  }
  span {
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.5;
  }
  a {
    font-size: 13px;
    color: var(--accent);
  }
`;
const Ladder = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 6px;
  li {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    column-gap: 8px;
    align-items: center;
    padding: 8px 10px;
    border-radius: 12px;
    background: var(--bg-secondary);
  }
  li:last-child {
    background: color-mix(in srgb, var(--good) 14%, transparent);
  }
  em {
    font-style: normal;
    font-size: 11.5px;
    color: var(--text-3);
    grid-row: span 2;
  }
  span {
    font-size: 12.5px;
  }
  b {
    font-family: var(--font-bold);
    font-size: 18px;
    grid-row: span 2;
  }
  small {
    font-size: 11.5px;
    color: var(--text-3);
  }
`;
const Goal = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  padding-left: 16px;
  list-style: disc;
  b {
    color: var(--good);
  }
`;
const CTA = styled.a`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-bold);
  color: var(--accent);
`;
