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

const List = styled.div`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
`;

const Tab = styled.button`
  flex: none;
  padding: 8px 14px;
  border-radius: 9px;
  font-size: 14px;
  white-space: nowrap;
  color: ${({ $active }) => ($active ? "var(--text)" : "var(--text-2)")};
  background: ${({ $active }) => ($active ? "var(--panel)" : "transparent")};
  font-family: ${({ $active }) => ($active ? "var(--font-semibold)" : "var(--font)")};
`;
