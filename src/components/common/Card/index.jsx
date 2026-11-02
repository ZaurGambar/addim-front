import styled from "styled-components";

const Card = ({ title, children, ...props }) => {
  return (
    <StyledCard {...props}>
      {title && <CardTitle>{title}</CardTitle>}
      {children}
    </StyledCard>
  );
};

export default Card;

export const StyledCard = styled.div`
  background: var(--panel);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  border-radius: var(--r);
  padding: 20px;
  min-width: 0;

  @media (max-width: 560px) {
    padding: 16px;
    border-radius: 22px;
  }
`;

export const CardTitle = styled.h4`
  font-family: var(--font-bold);
  font-size: 17px;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 14px;
`;
