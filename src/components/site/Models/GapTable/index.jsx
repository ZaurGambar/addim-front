import styled from "styled-components";
import { GAPS } from "@/utils/mock/cities";
import { Wrap } from "@/components/site/Synthesis/RayonNeed";

const LABEL = { yes: "var", part: "qismən", no: "yoxdur" };

const GapTable = () => (
  <Wrap>
    <table>
      <thead>
        <tr>
          <th>İmkan</th>
          <th>Nümunə</th>
          <th>Bakıda</th>
          <th>Vəziyyət</th>
          <th>Prioritet</th>
        </tr>
      </thead>
      <tbody>
        {GAPS.map(([name, city, st, note, prio]) => (
          <tr key={name}>
            <td>{name}</td>
            <td>{city}</td>
            <td>
              <Chip $s={st}>{LABEL[st]}</Chip>
            </td>
            <td style={{ color: "var(--text-2)" }}>{note}</td>
            <td>
              <Prio $p1={prio === "P1"}>{prio}</Prio>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </Wrap>
);

export default GapTable;

const DOT = { yes: "var(--good)", part: "var(--warn)", no: "var(--critical)" };

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  white-space: nowrap;
  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $s }) => DOT[$s]};
  }
`;

const Prio = styled.span`
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid ${({ $p1 }) => ($p1 ? "var(--accent)" : "var(--line)")};
  background: ${({ $p1 }) => ($p1 ? "var(--accent-soft)" : "transparent")};
`;
