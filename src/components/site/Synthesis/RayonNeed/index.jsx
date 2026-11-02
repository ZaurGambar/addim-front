import styled from "styled-components";
import { glass, num, table, scrollReveal } from "@/styles/common/mixins";

const RayonNeed = ({ rayons }) => (
  <Wrap>
    <table>
      <thead>
        <tr>
          <th>Rayon</th>
          <th>Ehtiyac</th>
          <th>Qaynar nöqtədə</th>
          <th>4+ problem</th>
          <th>Soyuq nöqtədə</th>
        </tr>
      </thead>
      <tbody>
        {rayons
          .filter((r) => r.rayon !== "—")
          .map((r) => (
            <tr key={r.rayon}>
              <td>{r.rayon}</td>
              <td className="n">{r.need}</td>
              <td className="n">{r.hot_pct}%</td>
              <td className="n">{r.overlap4_pct}%</td>
              <td className="n">{r.cold_pct}%</td>
            </tr>
          ))}
      </tbody>
    </table>
  </Wrap>
);

export default RayonNeed;

// CRM cədvəli: şüşə kart içində, incə xətlər, sağa düzülmüş rəqəmlər
export const Wrap = styled.div`
  ${glass}
  ${scrollReveal}
  border-radius: var(--r);
  padding: 6px 10px;
  overflow-x: auto;

  table {
    ${table}
  }
  td {
    white-space: nowrap;
  }
  td:first-child {
    font-family: var(--font-semibold);
  }
  td.n {
    ${num}
    text-align: right;
  }
  tbody tr:hover td {
    background: var(--bg-secondary);
  }
`;
