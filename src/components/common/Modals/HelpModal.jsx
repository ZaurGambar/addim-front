import styled from "styled-components";
import BaseModal from "./BaseModal";

const STEPS = [
  ["Bakı analizi", "Şəhəri 9 mövzu üzrə oxuyun: nə var, nə yoxdur, nə diqqət çəkir."],
  ["Sintez", "Problemlərin üst-üstə düşdüyü zonalar və məhəllə tipləri."],
  ["SWOT", "Analizin yekunu: güclü və zəif tərəflər, imkanlar və təhdidlər."],
  ["Mərkəzi xəritə", "250 m hücrələrdə piyada indeksi və Seul ssenarisi."],
  ["Pilot", "Data ilə seçilmiş zonalar və sahə yoxlaması forması."],
];

const HelpModal = ({ onClose }) => {
  return (
    <BaseModal title="Platformanı necə oxumalı" onClose={onClose}>
      <List>
        {STEPS.map(([h, p], i) => (
          <li key={h}>
            <b>{i + 1}</b>
            <div>
              <strong>{h}</strong>
              <p>{p}</p>
            </div>
          </li>
        ))}
      </List>
      <Note>Xəritələrdə hücrəyə və ya rayona klikləsəniz, ətraflı məlumat açılır.</Note>
    </BaseModal>
  );
};

export default HelpModal;

const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 12px;
  li {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 10px;
  }
  b {
    font-family: var(--font-mono);
    color: var(--accent);
  }
  strong {
    font-family: var(--font-semibold);
  }
  p {
    color: var(--text-2);
    font-size: 14px;
  }
`;

const Note = styled.p`
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-3);
`;
