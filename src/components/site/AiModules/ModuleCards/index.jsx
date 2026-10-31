import styled from "styled-components";
import { AI_MODULES } from "@/utils/mock/aiModules";

const ModuleCards = () => (
  <Grid>
    {AI_MODULES.map((m) => (
      <Mod key={m.code}>
        <span className="code">{m.code}</span>
        <div>
          <h3>{m.title}</h3>
          <p>{m.what}</p>
          <p className="kv">
            <b>Model</b>
            {m.model}
          </p>
          <p className="rp">
            <b>Əvəz edir:</b> {m.replaces}
          </p>
        </div>
      </Mod>
    ))}
  </Grid>
);

export default ModuleCards;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Mod = styled.article`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px;

  .code {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--primary);
    border: 1px solid var(--primary);
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 10px;
  }
  div {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 18px;
  }
  p {
    font-size: 14px;
    color: var(--text-2);
  }
  .kv b {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-right: 6px;
    font-weight: 500;
  }
  .rp {
    color: var(--text);
  }
  .rp b {
    color: var(--accent);
  }
`;
