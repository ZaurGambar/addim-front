import { css } from "styled-components";

// UCH CRM dizayn hissələri: bütün səhifə komponentləri bunlardan istifadə edir

// Şüşə panel (CRM .card)
export const glass = css`
  background: var(--panel);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
`;

export const card = css`
  ${glass}
  border-radius: var(--r);
  padding: 20px;
  min-width: 0;

  @media (max-width: 560px) {
    padding: 16px;
    border-radius: 22px;
  }
`;

// Kiçik başlıq (CRM .kpi .lbl)
export const label = css`
  font-family: var(--font-semibold);
  font-size: 12.5px;
  letter-spacing: 0;
  text-transform: none;
  color: var(--text-3);
`;

// Böyük rəqəm (CRM .kpi .val)
export const kpiValue = css`
  font-family: var(--font-bold);
  font-size: 28px;
  letter-spacing: -0.03em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;

  @media (max-width: 560px) {
    font-size: 22px;
  }
`;

// Rəqəm (cədvəl, siyahı)
export const num = css`
  font-family: var(--font-semibold);
  font-variant-numeric: tabular-nums;
`;

// Hap (CRM .pill)
export const pill = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 9px;
  border-radius: 11px;
  font-family: var(--font-semibold);
  font-size: 12px;
  white-space: nowrap;
  background: var(--panel-2);
  color: var(--text-3);
`;

// Rəngli hap: tone = CSS rəng dəyişəni
export const tone = (color) => css`
  background: color-mix(in srgb, ${color} 15%, transparent);
  color: ${color};
`;

// Cədvəl (CRM table.t)
export const table = css`
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;

  th {
    text-align: left;
    font-family: var(--font-semibold);
    font-size: 12px;
    color: var(--text-3);
    padding: 8px 10px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
    text-transform: none;
    letter-spacing: 0;
  }
  td {
    padding: 11px 10px;
    border-bottom: 1px solid var(--line-soft);
    vertical-align: middle;
  }
  tr:last-child td {
    border-bottom: 0;
  }
`;

// Basıla bilən panel: hover-də accent haşiyə
export const hoverLift = css`
  transition: border-color 0.15s, transform 0.15s;
  &:hover {
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  }
  &:active {
    transform: scale(0.99);
  }
`;

// Accent ləkəsi (CRM .kpi.hero::after)
export const glow = css`
  position: relative;
  overflow: hidden;
  &::after {
    content: "";
    position: absolute;
    inset: auto -40px -60px auto;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: var(--accent);
    filter: blur(60px);
    opacity: 0.25;
    pointer-events: none;
  }
`;
