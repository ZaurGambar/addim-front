import styled from "styled-components";
import { RISKS } from "@/utils/mock/cities";

const RiskList = () => (
  <List>
    {RISKS.map((r) => (
      <Risk key={r.title}>
        <div className="src">
          <span>{r.src}</span>
          <strong>{r.title}</strong>
          <Sev $hi={r.sev === "hi"}>{r.sev === "hi" ? "yüksək risk" : "orta risk"}</Sev>
        </div>
        <div>
          <h5 className="p">Bakıda problem</h5>
          <p>{r.prob}</p>
        </div>
        <div>
          <h5 className="s">Həllimiz</h5>
          <p>{r.sol}</p>
        </div>
      </Risk>
    ))}
  </List>
);

export default RiskList;

const List = styled.div`
  border-top: 1px solid var(--line);
`;

const Risk = styled.div`
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);

  .src {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-3);
  }
  strong {
    font-family: var(--font-bold);
    font-size: 18px;
    color: var(--text);
  }
  h5 {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 4px;
    font-weight: 500;
  }
  h5.p {
    color: var(--accent);
  }
  h5.s {
    color: var(--primary);
  }
  p {
    font-size: 15px;
    color: var(--text-2);
  }
  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const Sev = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: ${({ $hi }) => ($hi ? "var(--critical)" : "var(--serious)")};
  }
`;
