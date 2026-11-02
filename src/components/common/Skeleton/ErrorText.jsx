import styled from "styled-components";

const ErrorText = ({ children }) => <Text role="alert">{children || "Data yüklənmədi. Səhifəni yeniləyin."}</Text>;

export default ErrorText;

const Text = styled.p`
  color: var(--critical);
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
  background: color-mix(in srgb, var(--critical) 14%, transparent);
`;
