import styled from "styled-components";
import { card, hoverLift } from "@/styles/common/mixins";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { NAV_ITEMS } from "@/utils/constants/ContractConstants";

const DESC = {
  "/analiz": "12 rayonu müqayisə edin: istilik, yaşıllıq, nəqliyyat",
  "/sintez": "Problemlərin toplandığı yerlər xəritədə",
  "/swot": "Bakının güclü və zəif tərəfləri, 4 qutuda",
  "/xerite": "Mərkəzdə piyada nə qədər rahatdır: 0–100 bal",
  "/modeller": "Başqa şəhərlər piyadalar üçün nə edib",
  "/anlayislar": "Şəhərsalmanın 29 məşhur fikri Bakıda",
  "/ai": "Süni intellekt hansı işi asanlaşdırır",
  "/pilot": "Fikri sınayacağımız 3 yer",
  "/qaydalar": "Həlli bütün şəhərə yaymaq üçün 10 qayda",
  "/metodologiya": "Ballar necə hesablanır, data haradandır",
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
