import styled from "styled-components";

const InputField = ({ label, error, as = "input", id, ...props }) => {
  return (
    <Wrapper htmlFor={id}>
      {label && <span>{label}</span>}
      <Field as={as} id={id} $error={!!error} {...props} />
      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  );
};

export default InputField;

const Wrapper = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--text-2);
`;

const Field = styled.input`
  width: 100%;
  font-size: 15px;
  color: var(--text);
  background: var(--bg);
  border: 1px solid ${({ $error }) => ($error ? "var(--critical)" : "var(--line)")};
  border-radius: var(--radius);
  padding: 10px 12px;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const ErrorText = styled.span`
  color: var(--critical);
  font-size: 12px;
`;
