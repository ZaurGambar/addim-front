import styled from "styled-components";
import { card, hoverLift } from "@/styles/common/mixins";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { NAV_ITEMS } from "@/utils/constants/ContractConstants";

const DESC = {
  "/analiz": "12 rayon, 9 mövzu: nə var, nə yoxdur",
  "/sintez": "Qaynar nöqtələr və 4 məhəllə tipi",
  "/swot": "Güclü, zəif tərəflər, imkan və təhdidlər",
  "/xerite": "250 m hücrələrdə piyada indeksi",
  "/modeller": "Seul, Amsterdam, Barselona və digərləri",
  "/anlayislar": "29 nəzəriyyə Bakının datası ilə",
  "/ai": "8 AI modulu və arxitektura",
  "/pilot": "3 pilot zona və sahə yoxlaması",
  "/metodologiya": "İndeks, mənbələr, müraciət mətni",
};

const QuickLinks = () => (
  <Grid>
    {NAV_ITEMS.filter((n) => n.path !== "/").map(({ path, label, icon: Icon }) => (
      <Item key={path} to={path}>
        <Icon size={22} />
        <div>
          <b>{label}</b>
          <span>{DESC[path]}</span>
        </div>
        <ArrowRight size={18} className="arrow" />
      </Item>
    ))}
  </Grid>
);

export default QuickLinks;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled(Link)`
  display: grid;
  grid-template-columns: 22px 1fr 18px;
  gap: 12px;
  align-items: center;
  ${card}
  ${hoverLift}
  grid-template-columns: 40px 1fr 18px;
  padding: 16px;
  color: var(--accent);

  > svg:first-child {
    width: 40px;
    height: 40px;
    padding: 9px;
    border-radius: 13px;
    background: var(--accent-soft);
  }

  div {
    display: flex;
    flex-direction: column;
  }
  b {
    font-family: var(--font-bold);
    font-size: 15px;
    color: var(--text);
  }
  span {
    font-size: 12.5px;
    color: var(--text-3);
  }
  .arrow {
    color: var(--text-3);
  }
  &:hover .arrow {
    color: var(--accent);
  }
`;
