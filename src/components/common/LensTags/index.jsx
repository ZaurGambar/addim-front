import styled from "styled-components";
import { Link } from "react-router-dom";
import { SUB_BY_ID } from "@/utils/mock/planning";

// Alt anlayış nişanları: İ (inklüziv) mavi, K (kompleks) yaşıl; klik → tutorialın alt anlayışlar addımı
const LensTags = ({ ids = [] }) => (
  <Tags>
    {ids.map((id) => {
      const s = SUB_BY_ID[id];
      if (!s) return null;
      return (
        <Tag key={id} to={`/planlama?addim=2#${id}`} className={s.core === "I" ? "i" : "k"} title={`${s.core === "I" ? "İnklüziv planlama (Inclusive planning)" : "Kompleks planlama (Comprehensive planning)"}: ${s.title} (${s.en}). ${s.def}`}>
          <b>{id.replace("I", "İ")}</b>
          {s.title} ({s.en})
        </Tag>
      );
    })}
  </Tags>
);

export default LensTags;

const Tags = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  vertical-align: middle;
`;
const Tag = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  line-height: 1;
  padding: 3px 7px 3px 3px;
  border-radius: 999px;
  text-decoration: none;
  white-space: nowrap;
  color: var(--text-2);
  border: 1px solid var(--line);
  background: var(--panel);
  b {
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 999px;
    color: #fff;
  }
  &.i b {
    background: var(--accent);
  }
  &.k b {
    background: var(--good);
  }
  &:hover {
    color: var(--text);
    border-color: var(--text-3);
  }
`;
