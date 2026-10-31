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
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
  min-width: 0;
`;

export const CardTitle = styled.h4`
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 10px;
`;
