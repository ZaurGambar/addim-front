import styled from "styled-components";

const Container = ({ children, ...props }) => {
  return <StyledContainer {...props}>{children}</StyledContainer>;
};

export default Container;

const StyledContainer = styled.div`
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 16px;
`;
