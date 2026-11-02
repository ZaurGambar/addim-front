import { useState } from "react";
import styled from "styled-components";
import { NavLink, Link } from "react-router-dom";
import { CircleHelp, Moon, Sun } from "lucide-react";
import { NAV_ITEMS } from "@/utils/constants/ContractConstants";
import { useModal } from "@/contexts/ModalContext";
import { getTheme, toggleTheme } from "@/utils/helpers/theme";

// UCH CRM shell: masaüstündə üzən şüşə yan panel, mobildə şüşə üst panel
const MAIN = NAV_ITEMS.slice(0, 5);
const MORE = NAV_ITEMS.slice(5);

const ThemeButton = () => {
  const [theme, setThemeState] = useState(getTheme);
  const onClick = () => {
    toggleTheme();
    setThemeState(getTheme());
  };
  return (
    <IconButton type="button" aria-label={theme === "light" ? "Qaranlıq tema" : "Açıq tema"} onClick={onClick}>
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </IconButton>
  );
};

const Brand = ({ to = "/" }) => (
  <BrandLink to={to} aria-label="ADDIM ana səhifə">
    <LogoSq>A</LogoSq>
    <div>
      ADDIM<span>.</span>
      <small>Bakı piyada platforması</small>
    </div>
  </BrandLink>
);

const Header = () => {
  const { openModal } = useModal();
  const help = (
    <IconButton type="button" aria-label="Kömək" onClick={() => openModal("HelpModal")}>
      <CircleHelp size={18} />
    </IconButton>
  );
  const renderItem = ({ path, label, icon: Icon }) => (
    <NavItem key={path} to={path} end={path === "/"}>
      <Icon size={17} />
      <span>{label}</span>
    </NavItem>
  );

  return (
    <>
      <Side aria-label="Əsas menyu">
        <Brand />
        <Nav>
          <Section>Platforma</Section>
          {MAIN.map(renderItem)}
          <Section>Ətraflı</Section>
          {MORE.map(renderItem)}
        </Nav>
        <Foot>
          <Event>
            <i />
            Hakaton · 11–13 noyabr
          </Event>
          <Tools>
            {help}
            <ThemeButton />
          </Tools>
        </Foot>
      </Side>

      <TopBar>
        <Brand />
        <TopRight>
          {help}
          <ThemeButton />
        </TopRight>
      </TopBar>
    </>
  );
};

export default Header;

const glass = `
  background: var(--panel);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
`;

const Side = styled.aside`
  ${glass}
  position: fixed;
  left: 12px;
  top: 12px;
  bottom: 12px;
  width: var(--side);
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  padding: 14px 10px;
  z-index: 1000;
  overflow: hidden;

  @media (max-width: 900px) {
    display: none;
  }
`;

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 6px 12px;
  font-family: var(--font-bold);
  font-size: 15px;
  color: var(--text);

  span {
    color: var(--accent);
  }
  small {
    display: block;
    font-family: var(--font-semibold);
    font-size: 11px;
    color: var(--text-3);
  }

  @media (max-width: 900px) {
    padding: 0;
  }
`;

const LogoSq = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: var(--grad);
  color: #fff !important;
  display: grid;
  place-items: center;
  flex: none;
  font-size: 16px;
  box-shadow: 0 6px 18px var(--accent-soft);
`;

const Nav = styled.nav`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Section = styled.div`
  font-family: var(--font-bold);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
  padding: 11px 12px 4px;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 11px;
  height: 33px;
  padding: 0 12px;
  border-radius: 18px;
  font-family: var(--font-semibold);
  font-size: 13px;
  color: var(--text-3);

  svg {
    flex: none;
  }
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &:hover {
    background: var(--bg-secondary);
    color: var(--text);
  }
  &.active {
    color: var(--text);
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.05));
    box-shadow: inset 0 0 0 1px var(--line), 0 4px 14px rgba(0, 0, 0, 0.2);
  }
  :root[data-theme="light"] &.active {
    background: #fff;
    box-shadow: inset 0 0 0 1px var(--line), 0 4px 14px rgba(0, 0, 0, 0.06);
  }
`;

const Foot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
`;

const Event = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  border-radius: 14px;
  font-family: var(--font-semibold);
  font-size: 12px;
  color: var(--text-3);
  background: var(--bg-secondary);

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
    background: var(--good);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--good) 14%, transparent);
  }
`;

const Tools = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 2px;
`;

const IconButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--text);
  flex: none;

  &:hover {
    background: var(--bg-secondary);
  }
`;

const TopBar = styled.header`
  display: none;

  @media (max-width: 900px) {
    display: flex;
    align-items: center;
    gap: 8px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: calc(var(--header-h) + env(safe-area-inset-top, 0px));
    padding: env(safe-area-inset-top, 0px) 14px 0;
    background: var(--glass);
    backdrop-filter: saturate(1.6) blur(20px);
    -webkit-backdrop-filter: saturate(1.6) blur(20px);
    border-bottom: 1px solid var(--line-soft);
  }
`;

const TopRight = styled.div`
  display: flex;
  gap: 2px;
  margin-left: auto;
`;
