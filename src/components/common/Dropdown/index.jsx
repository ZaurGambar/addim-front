import styled from "styled-components";

// options: [{ value, label }] və ya [{ group, options: [...] }]
const Dropdown = ({ label, id, value, onChange, options = [], ...props }) => {
  return (
    <Wrapper htmlFor={id}>
      {label && <span>{label}</span>}
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} {...props}>
        {options.map((o) =>
          o.group ? (
            <optgroup key={o.group} label={o.group}>
              {o.options.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </Select>
    </Wrapper>
  );
};

export default Dropdown;

const Wrapper = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-3);
`;

const Select = styled.select`
  width: 100%;
  font-size: 14px;
  color: var(--text);
  background: var(--bg-secondary);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 9px 10px;
  min-height: 42px;
`;
