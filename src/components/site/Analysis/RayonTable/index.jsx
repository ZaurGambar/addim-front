import { useMemo, useState } from "react";
import styled from "styled-components";
import { fmtN } from "@/utils/helpers/format";

const COLS = [
  ["pop", "Əhali"], ["density", "Sıxlıq"], ["metro_ride", "Metro/gün"], ["transit500_pct", "500 m %"], ["intersections_km2", "Kəsişmə/km²"],
  ["deadend_pct", "Dalan %"], ["poi_km2", "Obyekt/km²"], ["lst_mean", "Səth °C"], ["green_pct", "Yaşıl %"], ["steep_pct", "Dik %"],
  ["below_m20_pct", "Alçaq %"], ["disabled_per1000", "Əlil/1000"], ["walk_score", "Piyada"],
];

const RayonTable = ({ rayons }) => {
  const [sortK, setSortK] = useState("pop");
  const [dir, setDir] = useState(-1);
  const max = useMemo(() => Object.fromEntries(COLS.map(([k]) => [k, Math.max(...rayons.map((x) => x[k] ?? 0)) || 1])), [rayons]);
  const rows = [...rayons].sort((a, b) => dir * ((a[sortK] ?? -1e9) - (b[sortK] ?? -1e9)));

  const onSort = (k) => {
    if (k === sortK) setDir(-dir);
    else {
      setSortK(k);
      setDir(-1);
    }
  };

  return (
    <Wrap>
      <Table>
        <thead>
          <tr>
            <th>Rayon</th>
            {COLS.map(([k, l]) => (
              <th key={k}>
                <button type="button" onClick={() => onSort(k)}>
                  {l}
                  {k === sortK ? (dir < 0 ? " ↓" : " ↑") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.rayon}>
              <td>{x.rayon}</td>
              {COLS.map(([k]) => (
                <td key={k} className="n">
                  <i style={{ width: `${Math.max(0, (100 * (x[k] ?? 0)) / max[k])}%` }} />
                  <span>{fmtN(x[k])}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrap>
  );
};

export default RayonTable;

const Wrap = styled.div`
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
`;

const Table = styled.table`
  border-collapse: collapse;
  width: 100%;
  font-size: 13px;

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--line-soft);
    text-align: left;
    white-space: nowrap;
  }
  th button {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  td:first-child {
    font-family: var(--font-semibold);
  }
  td.n {
    position: relative;
    text-align: right;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  td.n i {
    position: absolute;
    left: 0;
    top: 5px;
    bottom: 5px;
    background: var(--primary-soft);
    border-radius: 0 3px 3px 0;
  }
  td.n span {
    position: relative;
  }
`;
