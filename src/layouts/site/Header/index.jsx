import styled from "styled-components";
import { NavLink, Link } from "react-router-dom";
import { CircleHelp } from "lucide-react";
import Container from "@/styles/common/Container";
import { NAV_ITEMS } from "@/utils/constants/ContractConstants";
import { useModal } from "@/contexts/ModalContext";

const Header = () => {
  const { openModal } = useModal();
  return (
    <Bar>
      <Container>
        <Inner>
          <Logo to="/" aria-label="ADDIM ana səhifə">
            ADDIM<span>.</span>
          </Logo>
          <Nav aria-label="Əsas menyu">
            {NAV_ITEMS.map((n) => (
              <NavItem key={n.path} to={n.path} end={n.path === "/"}>
                {n.label}
              </NavItem>
            ))}
          </Nav>
          <HelpButton type="button" aria-label="Kömək" onClick={() => openModal("HelpModal")}>
            <CircleHelp size={20} />
          </HelpButton>
        </Inner>
      </Container>
    </Bar>
  );
};

export default Header;

const Bar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
  padding-top: env(safe-area-inset-top, 0px);
`;

const Inner = styled.div`
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Logo = styled(Link)`
  font-family: var(--font-bold);
  font-size: 22px;
  letter-spacing: -0.02em;
  flex: none;
  span {
    color: var(--accent);
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavItem = styled(NavLink)`
  flex: none;
  padding: 7px 10px;
  border-radius: 9px;
  font-size: 14px;
  color: var(--text-2);
  white-space: nowrap;

  &:hover {
    background: var(--bg-secondary);
    color: var(--text);
  }
  &.active {
    background: var(--primary-soft);
    color: var(--primary);
    font-family: var(--font-semibold);
  }
`;

const HelpButton = styled.button`
  margin-left: auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--text-2);
  flex: none;

  &:hover {
    background: var(--bg-secondary);
  }
`;
