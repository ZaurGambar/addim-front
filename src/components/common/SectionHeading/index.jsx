import styled from "styled-components";

const SectionHeading = ({ eyebrow, title, lede, as = "h1" }) => {
  return (
    <Wrapper>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Title as={as}>{title}</Title>
      {lede && <Lede>{lede}</Lede>}
    </Wrapper>
  );
};

export default SectionHeading;

const Wrapper = styled.header`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
`;

const Eyebrow = styled.span`
  font-family: var(--font-semibold);
  font-size: 13px;
  color: var(--accent);
`;

const Title = styled.h1`
  font-family: var(--font-bold);
  font-size: ${({ as }) => (as === "h1" || !as ? "30px" : "22px")};
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-wrap: balance;

  @media (max-width: 900px) {
    font-size: ${({ as }) => (as === "h1" || !as ? "25px" : "20px")};
  }
`;

const Lede = styled.p`
  font-size: 15px;
  color: var(--text-3);
  max-width: 70ch;
`;
