import styled from "styled-components";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import LensTags from "@/components/common/LensTags";
import { PAGE_LENS } from "@/utils/mock/planning";

// Səhifənin başında: bu bölmə inklüziv və kompleks planlamanın hansı alt anlayışlarına xidmət edir
const LensStrip = ({ page, step }) => {
  const L = PAGE_LENS[page];
  if (!L) return null;
  return (
    <Strip aria-label="Planlama baxışı">
      <Compass size={18} />
      <div>
        <p>{L.note}</p>
        <Row>
          <span className="i">İnklüziv (Inclusive)</span>
          <LensTags ids={L.I} />
        </Row>
        <Row>
          <span className="k">Kompleks (Comprehensive)</span>
          <LensTags ids={L.K} />
        </Row>
      </div>
      <Link to={`/planlama${step ? `?addim=${step}` : ""}`}>Tutorial →</Link>
    </Strip>
  );
};

export default LensStrip;

const Strip = styled.aside`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: linear-gradient(to right, color-mix(in srgb, var(--accent) 8%, transparent), color-mix(in srgb, var(--good) 6%, transparent));
  > svg {
    color: var(--accent);
    margin-top: 2px;
  }
  p {
    font-size: 13.5px;
    color: var(--text-2);
    margin-bottom: 6px;
  }
  > a {
    font-size: 13px;
    color: var(--accent);
    white-space: nowrap;
  }
  @media (max-width: 640px) {
    grid-template-columns: auto minmax(0, 1fr);
    > a {
      grid-column: 2;
    }
  }
`;
const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  > span {
    font-size: 11.5px;
    font-weight: 700;
    min-width: 150px;
  }
  .i {
    color: var(--accent);
  }
  .k {
    color: var(--good);
  }
`;
