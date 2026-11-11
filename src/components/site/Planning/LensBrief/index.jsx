import styled from "styled-components";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LensTags from "@/components/common/LensTags";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { fmt } from "@/utils/helpers/format";

// Qısa inklüziv/kompleks baxış blokları: Analiz (bərabərlik) və Sintez (zəiflik + sektor)
export const EquityBrief = () => {
  const { data: L } = useGet("planningLens", ENDPOINTS.PLANNING_LENS);
  if (!L) return null;
  const eq = L.equity.filter((e) => e.key !== "heat").sort((a, b) => b.palma - a.palma).slice(0, 4);
  const heat = L.equity.find((e) => e.key === "heat");
  return (
    <Box>
      <Head>
        <h2>İnklüziv baxış: kim kənarda qalır</h2>
        <LensTags ids={["I1", "I3", "I8"]} />
      </Head>
      <p>Ən pis təmin olunmuş 20% əhali ən yaxşı 20%-dən neçə dəfə uzaqdadır (blok səviyyəsi, əhali ilə çəkili):</p>
      <Cards>
        {eq.map((e) => (
          <li key={e.key}>
            <b>{e.palma}×</b>
            <span>{e.name}</span>
            <em>
              {fmt(e.best20)} → {fmt(e.worst20)} m · {e.group}
            </em>
          </li>
        ))}
        <li>
          <b>{heat.over_pct}%</b>
          <span>42°C-dən isti məhəllədə</span>
          <em>istilik hamıya təsir edir (Gini {heat.gini}): universal həll</em>
        </li>
      </Cards>
      <More to="/planlama?addim=3">
        Qruplar və rayonlar üzrə tam analiz <ArrowRight size={14} />
      </More>
    </Box>
  );
};

export const InclusivePriority = () => {
  const { data: L } = useGet("planningLens", ENDPOINTS.PLANNING_LENS);
  if (!L) return null;
  const top = [...L.zones].sort((a, b) => a.pos_inc - b.pos_inc).slice(0, 8);
  const h = L.sector_hist;
  const multi = (h["3"]?.pop || 0) + (h["4"]?.pop || 0);
  return (
    <Box>
      <Head>
        <h2>İnklüziv və kompleks prioritet</h2>
        <LensTags ids={["I1", "I3", "K1", "K2"]} />
      </Head>
      <p>
        Ehtiyac balı sosial zəiflik indeksi (SVI: əlillik, dayanacaq və metroya uzaqlıq, aptek, riskli məktəb) ilə tamamlanıb. Sektor: zonada eyni anda kəskin olan sahə sayı (hərəkət, ətraf mühit, risk, xidmət). {fmt(multi)} insan 3–4 sektorun kəskin
        olduğu zonalarda yaşayır: onlara inteqrasiya olunmuş paket lazımdır.
      </p>
      <Table>
        <thead>
          <tr>
            <th>#</th>
            <th>Zona</th>
            <th>İnsan</th>
            <th>Ehtiyac</th>
            <th>SVI</th>
            <th>Sektor</th>
          </tr>
        </thead>
        <tbody>
          {top.map((z) => (
            <tr key={z.rank}>
              <td>{z.pos_inc}</td>
              <td>
                <b>{z.name}</b> · {z.rayon}
              </td>
              <td>{fmt(z.pop)}</td>
              <td>{z.need}</td>
              <td>{z.svi}</td>
              <td>{z.sectors.length} / 4</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <More to="/planlama?addim=5">
        Sintez addımı tutorialda <ArrowRight size={14} />
      </More>
    </Box>
  );
};

const Box = styled.section`
  margin-top: 28px;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 18px;
  background: var(--panel);
  > p {
    font-size: 13.5px;
    color: var(--text-2);
    margin: 6px 0 12px;
    line-height: 1.5;
    max-width: 90ch;
  }
`;
const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  h2 {
    font-family: var(--font-bold);
    font-size: 20px;
  }
`;
const Cards = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  li {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  b {
    font-family: var(--font-bold);
    font-size: 24px;
    color: var(--critical);
  }
  em {
    font-style: normal;
    font-size: 12px;
    color: var(--text-3);
  }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th,
  td {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
  }
  th {
    color: var(--text-3);
    font-weight: 600;
  }
`;
const More = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--accent);
`;
