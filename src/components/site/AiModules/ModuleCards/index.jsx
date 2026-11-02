import styled from "styled-components";
import { card } from "@/styles/common/mixins";
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
  ${card}

  .code {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: #fff;
    background: var(--grad);
    box-shadow: 0 6px 18px var(--accent-soft);
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
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
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 11px;
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
