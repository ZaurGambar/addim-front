import styled from "styled-components";

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

export const Wrap = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  th,
  td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid var(--line-soft);
  }
  th {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-3);
    font-weight: 500;
  }
  td.n {
    font-family: var(--font-mono);
    text-align: right;
  }
`;
