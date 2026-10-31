import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";

const Error = () => (
  <Wrapper>
    <Helmet>
      <title>Səhifə tapılmadı · ADDIM Bakı</title>
    </Helmet>
    <Code>404</Code>
    <h1>Səhifə tapılmadı</h1>
    <p>Bu ünvanda səhifə yoxdur. Ana səhifəyə qayıdın.</p>
    <Button as={Link} to="/">
      Ana səhifə
    </Button>
  </Wrapper>
);

export default Error;

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  text-align: center;
  h1 {
    font-family: var(--font-bold);
    font-size: 28px;
  }
  p {
    color: var(--text-2);
  }
`;

const Code = styled.span`
  font-family: var(--font-mono);
  font-size: 64px;
  color: var(--accent);
`;
