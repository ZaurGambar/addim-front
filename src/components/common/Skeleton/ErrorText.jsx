import styled from "styled-components";

const ErrorText = ({ children }) => <Text role="alert">{children || "Data yüklənmədi. Səhifəni yeniləyin."}</Text>;

export default ErrorText;

const Text = styled.p`
  color: var(--critical);
  padding: 16px;
  border: 1px solid var(--critical);
  border-radius: var(--radius);
  background: var(--accent-soft);
`;
