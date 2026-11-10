import styled from "styled-components";

// Açılıb-bağlanan audit bloku: qruplar üzrə sual, hər sual üçün seçim; başlıqda canlı bal
const AuditBlock = ({ title, summary, groups, scale, values, onChange, prefix }) => (
  <Details>
    <summary>
      <span>{title}</span>
      <b>{summary}</b>
    </summary>
    {groups.map((g) => (
      <fieldset key={g.group}>
        <legend>{g.group}</legend>
        {g.items.map(([key, label, hint]) => (
          <Row key={key}>
            <label htmlFor={`${prefix}-${key}`}>
              {label}
              {hint && <small>{hint}</small>}
            </label>
            <select id={`${prefix}-${key}`} name={key} value={values[key] ?? ""} onChange={(e) => onChange(key, e.target.value)}>
              {scale.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Row>
        ))}
      </fieldset>
    ))}
  </Details>
);

export default AuditBlock;

const Details = styled.details`
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0 14px;
  background: var(--bg);

  summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    cursor: pointer;
    font-family: var(--font-semibold);
    font-size: 14px;
  }
  summary b {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 13px;
    color: var(--primary);
    white-space: nowrap;
  }
  fieldset {
    border: 0;
    border-top: 1px solid var(--line-soft);
    padding: 10px 0;
  }
  legend {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-3);
    padding-top: 8px;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 10px;
  align-items: center;
  padding: 5px 0;

  label {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    color: var(--text);
  }
  small {
    font-size: 12px;
    color: var(--text-3);
  }
  select {
    font-size: 14px;
    color: var(--text);
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 7px 8px;
    min-height: 38px;
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
