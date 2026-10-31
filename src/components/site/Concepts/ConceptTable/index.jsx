import styled from "styled-components";
import { CONCEPTS, CONCEPT_LABELS } from "@/utils/mock/concepts";
import { Wrap } from "@/components/site/Synthesis/RayonNeed";

const lvlOf = (v) => (v == null ? "na" : v >= 60 ? "hi" : v >= 40 ? "md" : "lo");
const LVL = { hi: ["güclü", "var(--good)"], md: ["orta", "var(--warn)"], lo: ["zəif", "var(--critical)"], na: ["data yoxdur", "var(--line)"] };

const ConceptTable = ({ concepts, summary, onMap }) => {
  const st = concepts.stats;
  const m = (k) => st[k]?.mean;
  const val = (k) => {
    if (k === "_nu") { const v = (m("jacobs") + m("gehl") + m("compact")) / 3; return [v, v.toFixed(0)]; }
    if (k === "_na") return [null, "—"];
    if (k === "_sys") return ["sys", "platforma"];
    if (k === "_tact") return ["sys", `${summary.cells_gap_high} hücrə`];
    if (k === "_eq") return [null, `Gini ${st.equity.gini}`];
    if (k === "_sdg") return ["sys", `${st.sdg_transit.share}% · ${st.green.park300_share}%`];
    if (k === "min15") return [m(k), `${m(k).toFixed(0)} · tam: ${st.min15.full_share}%`];
    return [m(k), m(k).toFixed(0)];
  };
  return (
    <Wrap>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Anlayış</th>
            <th>Necə ölçülür</th>
            <th>Bakı</th>
            <th>Səviyyə</th>
            <th>AI</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {CONCEPTS.map((row) => {
            if (row.length === 1) return <Group key={row[0]}><td colSpan={7}>{row[0]}</td></Group>;
            const [num, name, k, how, ai] = row;
            const [v, txt] = val(k);
            const lv = v === "sys" ? null : lvlOf(v);
            return (
              <tr key={num}>
                <td className="n">{num}</td>
                <td>{name}</td>
                <td style={{ fontSize: 13, color: "var(--text-2)" }}>{how}</td>
                <td className="n">{txt}</td>
                <td>{lv ? <Lvl $c={LVL[lv][1]}>{LVL[lv][0]}</Lvl> : <span style={{ fontSize: 12, color: "var(--text-3)" }}>sistem</span>}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{ai}</td>
                <td>{CONCEPT_LABELS[k] && <MapBtn type="button" onClick={() => onMap(k)}>Xəritədə</MapBtn>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Wrap>
  );
};

export default ConceptTable;

const Group = styled.tr`
  td {
    background: var(--panel-2);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-3);
  }
`;

const Lvl = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  white-space: nowrap;
  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: ${({ $c }) => $c};
  }
`;

const MapBtn = styled.button`
  font-size: 12px;
  color: var(--primary);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 3px 8px;
  white-space: nowrap;
`;
