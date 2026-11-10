import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import BarList from "@/components/common/BarList";
import { Wrap } from "@/components/site/Synthesis/RayonNeed";
import { fmt } from "@/utils/helpers/format";

const LEVEL_COLOR = { yüksək: "var(--critical)", orta: "var(--warn)", aşağı: "var(--good)" };

// Təhlükəsiz məktəb yolu: hər məktəb/bağça ətrafında magistral, keçidsiz hissə və işıqforsuz keçid riski
const SchoolSafety = ({ schools, summary }) => {
  const top = schools.features.slice(0, 15).map((f) => f.properties && { ...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] });
  const byRayon = Object.entries(summary.by_rayon_high).map(([k, v]) => ({ key: k, label: k, value: v }));
  return (
    <>
      <Stats>
        <div>
          <b>{fmt(summary.n)}</b>
          <span>məktəb və bağça yoxlanılıb</span>
        </div>
        <div>
          <b>{fmt(summary.near_major_300)}</b>
          <span>300 m-də magistral yol var</span>
        </div>
        <div className="hi">
          <b>{fmt(summary.high)}</b>
          <span>yüksək riskli yol mühitində</span>
        </div>
        <div>
          <b>{Math.round((100 * summary.high) / summary.n)}%</b>
          <span>hər 3 məktəbdən təxminən 1-i</span>
        </div>
      </Stats>
      <Two>
        <div>
          <h3>Ən riskli 15 məktəb və bağça</h3>
          <Wrap>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ad</th>
                  <th>Rayon</th>
                  <th>Magistral, m</th>
                  <th>Keçidsiz, m</th>
                  <th>Risk</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {top.map((p) => (
                  <tr key={p.rank}>
                    <td className="n">{p.rank}</td>
                    <td>{p.name}</td>
                    <td>{p.rayon}</td>
                    <td className="n">{fmt(p.major_m)}</td>
                    <td className="n">{p.barrier_m == null ? "–" : fmt(p.barrier_m)}</td>
                    <td className="n">
                      <Level style={{ "--c": LEVEL_COLOR[p.level] }}>{p.risk}</Level>
                    </td>
                    <td>
                      <a href={`https://maps.google.com/?q=${p.lat},${p.lon}`} target="_blank" rel="noopener noreferrer">
                        xəritə
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Wrap>
        </div>
        <div>
          <h3>Yüksək riskli məktəblər rayonlar üzrə</h3>
          <BarList color="var(--critical)" items={byRayon} />
          <Method>
            Risk (0–100): məktəbin 300 m-də magistral yol uzunluğu (geniş yol ağır çəkilir), 400 m-də 350 m-dən uzun keçidsiz magistral, 300 m-də işıqforsuz keçid və yeraltı keçid. Keçid datası yalnız mərkəzi zonada var, kənarda risk yalnız magistrala görə hesablanır. Qəza datası (DYP) gələndə model ona görə kalibrlənəcək.
          </Method>
        </div>
      </Two>
    </>
  );
};

export default SchoolSafety;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  div {
    ${card}
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  div.hi b {
    color: var(--critical);
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
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 28px;
  h3 {
    font-family: var(--font-semibold);
    font-size: 16px;
    margin-bottom: 10px;
  }
  a {
    color: var(--primary);
    font-size: 13px;
  }
  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Level = styled.span`
  font-family: var(--font-mono);
  color: var(--c);
  font-weight: 600;
`;

const Method = styled.p`
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-3);
`;
