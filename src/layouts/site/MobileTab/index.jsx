import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/utils/constants/ContractConstants";

const MobileTab = () => {
  return (
    <Bar aria-label="Alt menyu">
      {NAV_ITEMS.filter((n) => n.tab).map(({ path, short, icon: Icon }) => (
        <Item key={path} to={path} end={path === "/"}>
          <Icon size={22} />
          <span>{short}</span>
        </Item>
      ))}
    </Bar>
  );
};

export default MobileTab;

const Bar = styled.nav`
  display: none;

  @media (max-width: 900px) {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    z-index: 1000;
    padding: 6px 4px;
    border-radius: 28px;
    background: var(--panel);
    backdrop-filter: var(--blur);
    -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--line);
    box-shadow: inset 0 1px 0 var(--hi), 0 10px 40px rgba(0, 0, 0, 0.3);
  }
`;

const Item = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 5px 0;
  border-radius: 20px;
  font-family: var(--font-semibold);
  font-size: 10.5px;
  color: var(--faint);

  span {
    max-width: 100%;
    padding: 0 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &.active {
    color: var(--text);
    background: var(--bg-secondary);
  }
`;
