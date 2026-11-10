import { useMemo, useState } from "react";
import styled from "styled-components";
import { growX } from "@/components/common/Motion";
import { glass, num, table as tableCss, scrollReveal } from "@/styles/common/mixins";
import { fmtN } from "@/utils/helpers/format";

const COLS = [
  ["pop", "Əhali"], ["density", "Sıxlıq"], ["metro_ride", "Metro/gün"], ["transit500_pct", "500 m %"], ["intersections_km2", "Kəsişmə/km²"],
  ["deadend_pct", "Dalan %"], ["poi_km2", "Obyekt/km²"], ["lst_mean", "Səth °C"], ["green_pct", "Yaşıl %"], ["ps_m2_pc", "İctimai m²/nəf"], ["ps_400_net_pct", "Məkana 5 dəq %"], ["steep_pct", "Dik %"],
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
  ${glass}
  ${scrollReveal}
  border-radius: var(--r);
  padding: 6px 10px;
`;

const Table = styled.table`
  ${tableCss}

  th,
  td {
    white-space: nowrap;
  }
  th button {
    font-family: var(--font-semibold);
    font-size: 12px;
    color: var(--text-3);
  }
  th button:hover {
    color: var(--text);
  }
  tbody tr:hover td {
    background: var(--bg-secondary);
  }
  td:first-child {
    font-family: var(--font-semibold);
  }
  td.n {
    position: relative;
    text-align: right;
    ${num}
  }
  td.n i {
    ${growX}
    position: absolute;
    left: 0;
    top: 5px;
    bottom: 5px;
    background: var(--accent-soft);
    border-radius: 0 6px 6px 0;
  }
  td.n span {
    position: relative;
  }
`;
