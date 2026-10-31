import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/utils/constants/ContractConstants";

const MobileTab = () => {
  return (
    <Bar aria-label="Alt menyu">
      {NAV_ITEMS.filter((n) => n.tab).map(({ path, short, icon: Icon }) => (
        <Item key={path} to={path} end={path === "/"}>
          <Icon size={20} />
          <span>{short}</span>
        </Item>
      ))}
    </Bar>
  );
};

export default MobileTab;

const Bar = styled.nav`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: var(--panel);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    height: calc(var(--tab-h) + env(safe-area-inset-bottom, 0px));
  }
`;

const Item = styled(NavLink)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-3);

  &.active {
    color: var(--primary);
    font-family: var(--font-semibold);
  }
`;
