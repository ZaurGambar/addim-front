import styled from "styled-components";

const Tabs = ({ tabs, active, onChange }) => {
  return (
    <List role="tablist">
      {tabs.map((t) => (
        <Tab key={t.value} role="tab" aria-selected={active === t.value} $active={active === t.value} onClick={() => onChange(t.value)}>
          {t.label}
        </Tab>
      ))}
    </List>
  );
};

export default Tabs;

// UCH CRM seqment idarəsi
const List = styled.div`
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 3px;
  background: var(--bg-secondary);
  border: 1px solid var(--line);
  border-radius: 20px;
  max-width: 100%;
  width: max-content;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button`
  flex: none;
  height: 30px;
  padding: 0 13px;
  border-radius: 15px;
  font-family: var(--font-semibold);
  font-size: 13px;
  white-space: nowrap;
  color: ${({ $active }) => ($active ? "var(--text)" : "var(--text-3)")};
  background: ${({ $active }) => ($active ? "var(--panel)" : "transparent")};
  box-shadow: ${({ $active }) => ($active ? "inset 0 0 0 1px var(--line), 0 2px 8px rgba(0, 0, 0, 0.18)" : "none")};
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: var(--text);
  }
`;
