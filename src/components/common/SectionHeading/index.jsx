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
  gap: 10px;
  margin-bottom: 28px;
`;

const Eyebrow = styled.span`
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-3);
`;

const Title = styled.h1`
  font-family: var(--font-bold);
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
  letter-spacing: -0.01em;
  text-wrap: balance;
`;

const Lede = styled.p`
  font-size: 17px;
  color: var(--text-2);
  max-width: 70ch;
`;
